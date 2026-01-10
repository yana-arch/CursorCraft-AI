import { Frame, Layer, AIAnimationResponse, AICall } from '../types';
import { createEmptyGrid, createLayer } from './layerUtils';
import { generateId } from './imageUtils';
import { drawLine, drawRect, drawCircle } from './drawUtils';

// --- Drawing Helpers (similar to presets.ts) ---

const drawPointer = (grid: string[][], color: string, offsetX = 0, offsetY = 0) => {
    const simpleArrow = [
        [0,0], [0,1], [1,1], [0,2], [1,2], [2,2], [0,3], [1,3], [2,3], [3,3],
        [0,4], [1,4], [2,4], [3,4], [4,4], [0,5], [1,5], [2,5], [3,5], [4,5], [5,5],
        [0,6], [1,6], [2,6], [3,6], [0,7], [1,7], [2,7], [0,8], [1,8], [0,9],
        [3,7], [4,8], [5,9], [6,10] 
    ];
    simpleArrow.forEach(([x, y]) => {
        const tx = x + offsetX; const ty = y + offsetY;
        if (grid[ty] && grid[ty][tx] !== undefined) grid[ty][tx] = color;
    });
};

const drawHand = (grid: string[][], color: string, offsetX = 0, offsetY = 0) => {
    const points = [
        [4,0], [5,0], [4,1], [5,1], [4,2], [5,2], [4,3], [5,3], [4,4], [5,4], [4,5], [5,5],
        [6,5], [7,5], [8,5], [3,6], [4,6], [5,6], [6,6], [7,6], [8,6], [9,6],
        [2,7], [3,7], [4,7], [5,7], [6,7], [7,7], [8,7], [9,7], [2,8], [3,8], [4,8], [5,8], 
        [6,8], [7,8], [8,8], [9,8], [2,9], [3,9], [4,9], [5,9], [6,9], [7,9], [8,9], [9,9],
        [3,10], [4,10], [5,10], [6,10], [7,10], [8,10], [0,7], [1,7], [0,8], [1,8], [1,9]
    ];
    points.forEach(([x, y]) => {
        const tx = x + offsetX + 10; const ty = y + offsetY + 8;
        if (grid[ty] && grid[ty][tx] !== undefined) grid[ty][tx] = color;
    });
};

/**
 * Converts the structured AI animation response into the internal Frame structure.
 */
export const convertAIToFrames = (data: AIAnimationResponse): Frame[] => {
    const { metadata, frames: aiFrames } = data;
    const fps = metadata.fps || 10;
    const duration = Math.floor(1000 / fps);

    return aiFrames.map((aiFrame) => {
        const subjectGrid = createEmptyGrid();
        const effectGrid = createEmptyGrid();
        const uiGrid = createEmptyGrid();

        aiFrame.calls.forEach((call: AICall) => {
            let targetGrid = subjectGrid;
            if (call.layerType === 'effect') targetGrid = effectGrid;
            if (call.layerType === 'ui') targetGrid = uiGrid;

            const p = call.params;
            switch (call.method) {
                case 'drawLine': 
                    drawLine(targetGrid, Number(p[0]), Number(p[1]), Number(p[2]), Number(p[3]), String(p[4]), 1); 
                    break;
                case 'drawRect': 
                    // AI gives [x, y, w, h, color]
                    drawRect(targetGrid, Number(p[0]), Number(p[1]), Number(p[0]) + Number(p[2]) - 1, Number(p[1]) + Number(p[3]) - 1, String(p[4]), 1, 'fill'); 
                    break;
                case 'drawCircle': 
                    // AI gives [cx, cy, r, color]
                    drawCircle(targetGrid, Number(p[0]) - Number(p[2]), Number(p[1]) - Number(p[2]), Number(p[0]) + Number(p[2]), Number(p[1]) + Number(p[2]), String(p[3]), 1, 'fill'); 
                    break;
                case 'drawPointer': 
                    drawPointer(targetGrid, String(p[0]), Number(p[1]), Number(p[2])); 
                    break;
                case 'drawHand': 
                    drawHand(targetGrid, String(p[0]), Number(p[1]), Number(p[2])); 
                    break;
            }
        });

        const layers: Layer[] = [];
        if (hasPixels(effectGrid)) layers.push(createLayer('AI Effects', effectGrid));
        layers.push(createLayer('AI Subject', subjectGrid));
        if (hasPixels(uiGrid)) layers.push(createLayer('AI Overlay', uiGrid));

        return {
            id: generateId(),
            layers: layers,
            duration: duration
        };
    });
};

const hasPixels = (grid: string[][]): boolean => {
    return grid.some(row => row.some(cell => cell !== ''));
};
