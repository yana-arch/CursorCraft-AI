import { Frame, Layer, AIAnimationResponse, Point } from '../types';
import { createEmptyGrid, createLayer } from './layerUtils';
import { generateId, toHexColor } from './imageUtils';

/**
 * Converts the structured AI animation response into the internal Frame structure.
 * This logic is inspired by how presets are programmatically generated in utils/presets.ts,
 * but adapted for dynamic data from the Gemini API.
 */
export const convertAIToFrames = (data: AIAnimationResponse): Frame[] => {
    const { metadata, frames: aiFrames } = data;
    const fps = metadata.fps || 10;
    const duration = Math.floor(1000 / fps);

    return aiFrames.map((aiFrame) => {
        const subjectGrid = createEmptyGrid();
        const effectGrid = createEmptyGrid();
        const uiGrid = createEmptyGrid();

        aiFrame.dots.forEach((dot) => {
            // Ensure coordinates are within bounds
            if (dot.x >= 0 && dot.x < 32 && dot.y >= 0 && dot.y < 32) {
                const color = toHexColor(dot.color, dot.opacity);
                
                // Sort dots into specific functional layers
                switch (dot.type) {
                    case 'subject':
                        subjectGrid[dot.y][dot.x] = color;
                        break;
                    case 'effect':
                        effectGrid[dot.y][dot.x] = color;
                        break;
                    case 'ui':
                        uiGrid[dot.y][dot.x] = color;
                        break;
                    default:
                        subjectGrid[dot.y][dot.x] = color;
                }
            }
        });

        // Compose the layer stack. 
        // Array order: [Bottom Layer, ..., Top Layer]
        const layers: Layer[] = [];
        
        // Effects usually go behind the subject (e.g., auras)
        if (hasPixels(effectGrid)) {
            layers.push(createLayer('AI Effects', effectGrid));
        }
        
        // Subject is the core cursor extracted from the image
        layers.push(createLayer('AI Subject', subjectGrid));

        // UI/Overlay elements go on top
        if (hasPixels(uiGrid)) {
            layers.push(createLayer('AI Overlay', uiGrid));
        }

        return {
            id: generateId(),
            layers: layers, // No reverse() needed: [Effects (bottom), Subject (middle), Overlay (top)]
            duration: duration
        };
    });
};

/**
 * Helper to check if a grid has any non-transparent pixels.
 */
const hasPixels = (grid: string[][]): boolean => {
    return grid.some(row => row.some(cell => cell !== ''));
};
