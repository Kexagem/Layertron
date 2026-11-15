
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import { GroundingMetadata } from "../types";

const getApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY environment variable not found.");
    throw new Error("API Key not configured. Please ensure API_KEY environment variable is set.");
  }
  return apiKey;
};

// Ensure API key is validated once, or lazily on first call
let aiInstance: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return aiInstance;
}

export async function generateText(
  prompt: string, 
  systemInstruction?: string,
  useSearch?: boolean
): Promise<{text: string, groundingMetadata?: GroundingMetadata}> {
  try {
    const ai = getAiInstance();
    const model = GEMINI_TEXT_MODEL; // As per guidelines

    const requestConfig: any = {};
    if (systemInstruction) {
      requestConfig.systemInstruction = systemInstruction;
    }
    if (useSearch) {
      requestConfig.tools = [{googleSearch: {}}];
    } else {
       // Only add thinkingConfig if not using search, as it might conflict or not be intended for search.
      requestConfig.thinkingConfig = { thinkingBudget: 0 }; // Disable thinking for low latency by default as per guidelines for this model
    }


    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      ...(Object.keys(requestConfig).length > 0 && { config: requestConfig }),
    });
    
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;

    return { text, groundingMetadata };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const message = error.message || "An unknown error occurred with the Gemini API.";
    // Potentially re-throw a more user-friendly error or specific error type
    throw new Error(`Gemini API Error: ${message}`);
  }
}
