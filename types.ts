

export enum ToolId {
  SKETCH_TO_IMAGE = 'sketch-to-image',
  IMAGE_TO_SKETCH = 'image-to-sketch',
  MOODBOARD_TO_RENDER = 'moodboard-to-render',
  RENDER_ENHANCER = 'render-enhancer',
  CLOSE_UP_RENDER = 'close-up-render',
  CAMERA_ANGLE = 'camera-angle',
  MODIFY_EXTERIOR = 'modify-exterior',
  MODIFY_INTERIOR = 'modify-interior',
  FACADE_ELEVATION = '3d-to-elevation',
  PRESENTATION_BOARD = 'presentation-board',
  UPSCALE = 'upscale',
  XRAY_SECTION = 'xray-section'
}

export type OptionType = 'select' | 'slider' | 'text' | 'camera-studio' | 'crop-selector' | 'focus-point';
export type Language = 'en' | 'vi';

export interface ToolOption {
  id: string;
  label: string;
  type: OptionType;
  options?: string[]; // For select type
  min?: number;       // For slider type
  max?: number;       // For slider type
  step?: number;      // For slider type
  defaultValue?: string | number | object;
  suffix?: string;    // e.g. "px", "%", "°"
}

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  promptTemplate: string;
  model: string;
  imageSize?: '1K' | '2K' | '4K';
  options: ToolOption[];
}

export interface Annotation {
  label: string;
  description: string;
  x: number; // 0-1000
  y: number; // 0-1000
  box_2d?: number[]; // [ymin, xmin, ymax, xmax] 0-1000
}

export interface GenerationState {
  isLoading: boolean;
  resultUrl: string | null;
  resultText?: string | null;
  annotations?: Annotation[];
  error: string | null;
}

export interface HistoryItem {
  id: string;
  url: string;
  timestamp: number;
  tool: string;
  annotations?: Annotation[];
}

export type AspectRatio = 'Original' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9' | '3:2' | '2:3';
export type Resolution = 'Standard' | 'HD' | 'FHD' | '2K' | '4K' | '8K';

export interface CanvasConfig {
  ratio: AspectRatio;
  resolution: Resolution;
}

export interface CropRect {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

export interface FocusPoint {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}