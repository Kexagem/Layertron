
export enum NodeType {
  Character = "Character",
  Location = "Location",
  Object = "Object",
  Style = "Style",
  FX = "FX",
  Vehicle = "Vehicle",
  Camera = "Camera",
  Lighting = "Lighting",
  ColorGrading = "Color Grading",
  PostProcessing = "Post-Processing",
  Sound = "Sound",
}

export interface Node {
  id: string;
  name: string;
  node_type: NodeType;
  description: string;
}

export interface Layer {
  id: string;
  name:string;
  track_id: string;
  base_prompt: string;
  connected_node_ids: string[];
}

export interface Track {
  id: string;
  name: string;
  track_type: 'Visual'; // For now, only visual
  layers: Record<string, Layer>;
}

export interface SelectedItem {
  id: string;
  type: 'node' | 'layer';
}

export interface ProjectState {
  projectName: string;
  nodes: Record<string, Node>;
  tracks: Record<string, Track>;
}

export type NodeIconMap = {
  [key in NodeType]: string;
};

// For Gemini API search results
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be added if needed
}
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields can be added
}
