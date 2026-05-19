export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'cubic' | 'quart' | 'quint' | 'back' | 'elastic' | 'bounce';

export interface Keyframe {
  id: string;
  frame: number;
  value: number;
  easing: EasingType;
}

export interface AnimationTrack {
  property: keyof FrameTransform | 'zoom' | 'parallax';
  keyframes: Keyframe[];
}

export interface FrameTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface Frame {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  index: number;
  size: number;
  type: string;
}

export interface ColorGrading {
  exposure: number;
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  vibrance: number;
  highlights: number;
  shadows: number;
}

export interface CinematicEffects {
  vignette: { enabled: boolean; intensity: number; };
  grain: { enabled: boolean; intensity: number; };
  bloom: { enabled: boolean; intensity: number; threshold: number; blur: number; };
  chromaticAberration: { enabled: boolean; intensity: number; };
  sharpen: { enabled: boolean; intensity: number; };
  pixelArt: { enabled: boolean; };
}

export interface LookPreset {
  id: string;
  name: string;
  color: ColorGrading;
  effects: CinematicEffects;
  lut?: string;
  intensity: number;
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export type LayerType = 'sequence' | 'image' | 'text' | 'solid' | 'adjustment';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  transform: FrameTransform;
  animations: AnimationTrack[];
  colorGrading: ColorGrading;
  effects: CinematicEffects;
  parallaxDepth: number;
  startTime: number; // in frames
  duration: number; // in frames
  // Type specific data
  frames?: Frame[]; // for sequence layer
  imageUrl?: string; // for image layer
  text?: string;
  characterReveal?: number; // 0 to 1
  blur?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  glowColor?: string;
  glowRadius?: number;
  textGradient?: {
    enabled: boolean;
    colors: string[];
    angle: number;
  };
  solidColor?: string;
}

export interface CameraSettings {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  focusDistance: number;
  focalRange: number;
  depthIntensity: number;
  drift: number;
  shake: number;
  smoothing: number;
  animations: AnimationTrack[];
}

export interface Composition {
  id: string;
  name: string;
  layers: Layer[];
  camera: CameraSettings;
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor: string;
  selectedLayerId?: string;
  showDepthMap?: boolean;
}

export interface ProjectSettings {
  fps: number;
  width: number;
  height: number;
  loop: boolean;
  isAutoKeyEnabled?: boolean;
  isPreviewFxEnabled?: boolean;
}

export type ExportFormat = 'mp4' | 'webp' | 'gif' | 'png-sequence' | 'sprite-sheet';

export interface Project {
  id: string;
  name: string;
  compositions: Composition[];
  activeCompositionId: string;
  settings: ProjectSettings;
  createdAt: number;
  updatedAt: number;
}

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  fps: number;
  width: number;
  height: number;
  quality?: number;
}

export interface ExportJob {
  id: string;
  format: ExportFormat;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  outputPath?: string;
  downloadUrl?: string;
  createdAt: number;
  settings: ProjectSettings;
}

export interface RenderJobRequest {
  frames: string[]; // Binary or DataURL
  settings: ProjectSettings;
  format: ExportFormat;
}
