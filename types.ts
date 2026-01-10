

export type ToolType = 'pen' | 'eraser' | 'picker' | 'fill' | 'hotspot' | 'select' | 'magicWand' | 'line' | 'rect' | 'circle';

export type DrawMode = 'stroke' | 'fill';

export interface Point {
  x: number;
  y: number;
}

export type GridData = string[][]; // 2D array of hex colors or empty strings (transparent)

export interface Layer {
    id: string;
    name: string;
    grid: GridData;
    visible: boolean;
    opacity: number; // 0.0 to 1.0
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
    angle: number; // Current rotation in degrees
}

// --- Animation Wizard Types ---

export type AnimationMode = 'append' | 'overwrite';
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface AnimationSettings {
    defaultMode: AnimationMode;
    defaultFramesCount: number;
    copyBackground: boolean;
}

export interface AnimationParams {
    framesCount: number;
    enableRotation: boolean;
    stepAngle: number;
    enableMovement: boolean;
    stepX: number;
    stepY: number;
    enableScale: boolean;
    stepScale: number;
    enableOpacity: boolean;
    stepOpacity: number;
    enableHue: boolean;
    stepHue: number;
    easing: EasingType;
    isLoop: boolean;
    isBoomerang: boolean; // New: Move back to start
    rotationPivotMode: 'auto' | '1x1' | '2x2' | 'custom';
    rotationCustomPivot?: Point;
    // Special Effects
    enableSway: boolean;
    swayAngle: number;
    swayPeriod: number;
    swayPivot: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    swayRigidArea: number; // Pixels from pivot that don't move
    // Path-based deformation
    enablePathDeform: boolean;
    pathPivot?: Point;
    pathPoints: Point[];
}

// --- AI Structured Data Types ---

export type AICallMethod = 'drawLine' | 'drawRect' | 'drawCircle' | 'drawPointer' | 'drawHand';

export interface AICall {
    method: AICallMethod;
    params: any[]; // e.g., [x0, y0, x1, y1, color] or [x, y, w, h, color]
    layerType: 'subject' | 'effect' | 'ui';
}

export interface AIFrame {
    frame_id: number;
    calls: AICall[];
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
