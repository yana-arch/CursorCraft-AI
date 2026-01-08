

export type ToolType = 'pen' | 'eraser' | 'picker' | 'fill' | 'hotspot' | 'select' | 'magicWand';

export interface Point {
  x: number;
  y: number;
}

export type GridData = string[][]; // 2D array of hex colors or empty strings (transparent)

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  grid: GridData;
}

export interface Frame {
  id: string;
  layers: Layer[]; // Frames now contain multiple layers
  duration: number; // in ms
}

export interface CursorProject {
  name: string;
  frames: Frame[];
  activeFrameIndex: number;
  hotspot: Point;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface SelectionState {
    x: number;
    y: number;
    w: number;
    h: number;
    floatingPixels: GridData; // The cut pixels
}

// --- AI Structured Data Types ---

export interface AIDot {
    x: number;
    y: number;
    color: string; // Hex
    type: 'subject' | 'effect' | 'ui';
    opacity: number; // 0.0 to 1.0
}

export interface AIFrame {
    frame_id: number;
    dots: AIDot[];
}

export interface AIAnimationMetadata {
    grid_size: number;
    total_frames: number;
    fps: number;
    hotspot: Point;
}

export interface AIAnimationResponse {
    metadata: AIAnimationMetadata;
    frames: AIFrame[];
}