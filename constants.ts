
import { NodeIconMap, NodeType } from './types';

export const NODE_ICONS: NodeIconMap = {
  [NodeType.Character]: "👤",
  [NodeType.Location]: "🗺️",
  [NodeType.Object]: "📦",
  [NodeType.Style]: "🎨",
  [NodeType.FX]: "✨",
  [NodeType.Vehicle]: "🚗",
  [NodeType.Camera]: "🎥",
  [NodeType.Lighting]: "💡",
  [NodeType.ColorGrading]: "🌈",
  [NodeType.PostProcessing]: "⚙️",
  [NodeType.Sound]: "🔊",
};

export const ALL_NODE_TYPES: NodeType[] = [
  NodeType.Character,
  NodeType.Location,
  NodeType.Object,
  NodeType.Style,
  NodeType.FX,
  NodeType.Vehicle,
  NodeType.Camera,
  NodeType.Lighting,
  NodeType.ColorGrading,
  NodeType.PostProcessing,
  NodeType.Sound,
];

export const INITIAL_PROJECT_NAME = "Untitled Project";

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

export const NODE_PRESETS: Record<NodeType, string[]> = {
  [NodeType.Character]: [
    "A cyberpunk protagonist with neon tattoos and a tactical jacket",
    "A weary space marine in battle-damaged armor",
    "An ethereal elven queen wearing robes of starlight",
    "A 1920s noir detective in a trench coat and fedora",
    "A futuristic robot with transparent casing and glowing internal wires"
  ],
  [NodeType.Location]: [
    "A bustling Tokyo street at night in the rain, neon reflections",
    "A serene zen garden with cherry blossoms falling",
    "An abandoned brutalist soviet bunker",
    "A mars colony habitat with red dust covering the windows",
    "A medieval throne room with stone pillars and tapestries"
  ],
  [NodeType.Object]: [
    "A glowing magical artifact hovering in mid-air",
    "A vintage 1950s jukebox with chrome accents",
    "A rusted samurai sword stuck in a stone",
    "A high-tech holographic wristwatch",
    "A bouquet of withered black roses"
  ],
  [NodeType.Style]: [
    "Oil painting, thick impasto brushstrokes, expressive style",
    "Photorealistic, 8k resolution, Unreal Engine 5 render",
    "Anime style, Studio Ghibli, vibrant colors, detailed background",
    "Black and white film photography, grainy, high contrast",
    "Low poly 3D render, flat shading, isometric view"
  ],
  [NodeType.FX]: [
    "Heavy volumetric fog rolling across the ground",
    "Magical sparks and floating embers",
    "Digital glitch artifacts and chromatic aberration",
    "Explosion debris and smoke plumes",
    "Lens flare and bokeh lights"
  ],
  [NodeType.Vehicle]: [
    "A flying DeLorean with glowing thrusters",
    "A steampunk steam engine train with brass gears",
    "A sleek matte black sports car",
    "A massive industrial mining spaceship",
    "A rustic wooden rowboat"
  ],
  [NodeType.Camera]: [
    "Shot on 35mm film, f/1.8 aperture, shallow depth of field",
    "Wide angle lens, fisheye effect, dynamic perspective",
    "Telephoto lens, 85mm portrait, background compression",
    "Macro photography, extreme close-up, high detail",
    "Dutch angle shot, cinematic motion blur"
  ],
  [NodeType.Lighting]: [
    "Cinematic Rembrandt lighting, high contrast, chiaroscuro",
    "Soft diffused morning light through curtains",
    "Neon cyberpunk lighting, pink and blue hues",
    "Harsh interrogation spotlight from above",
    "Golden hour sunlight, warm tones, long shadows"
  ],
  [NodeType.ColorGrading]: [
    "Teal and orange cinematic look",
    "Desaturated, bleached bypass, gritty war movie tone",
    "Vibrant, saturated Technicolor aesthetic",
    "Sepia tone, vintage photograph look",
    "Cool blue tones, melancholic atmosphere"
  ],
  [NodeType.PostProcessing]: [
    "Heavy film grain and vignette",
    "VHS tape tracking lines and noise",
    "Double exposure effect",
    "Halftone pattern, comic book print style",
    "Bloom and glow effects"
  ],
  [NodeType.Sound]: [
    "The hum of neon lights and distant sirens",
    "Birds chirping and wind rustling leaves",
    "Heavy industrial machinery clanking",
    "Eerie silence broken by footsteps",
    "Synthesized retro-wave bassline"
  ]
};
