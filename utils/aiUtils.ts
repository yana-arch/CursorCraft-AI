import { Frame, Layer, AIAnimationResponse, AICall } from '../types';
import { createEmptyGrid, createLayer } from './layerUtils';
import { generateId } from './imageUtils';

// --- Drawing Helpers (similar to presets.ts) ---

const drawLine = (grid: string[][], x0: number, y0: number, x1: number, y1: number, color: string) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while(true) {
        if (grid[y0] && grid[y0][x0] !== undefined) grid[y0][x0] = color;
        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2*err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
};

const drawRect = (grid: string[][], x: number, y: number, w: number, h: number, color: string) => {
    for(let i=0; i<w; i++) {
        for(let j=0; j<h; j++) {
            if(grid[y+j] && grid[y+j][x+i] !== undefined) grid[y+j][x+i] = color;
        }
    }
};

const drawCircle = (grid: string[][], cx: number, cy: number, r: number, color: string) => {
    for(let y=0; y<32; y++) {
        for(let x=0; x<32; x++) {
            if(Math.abs(Math.sqrt(Math.pow(x-cx, 2) + Math.pow(y-cy, 2)) - r) < 0.8) {
                grid[y][x] = color;
            }
        }
    }
};

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
                case 'drawLine': drawLine(targetGrid, Number(p[0]), Number(p[1]), Number(p[2]), Number(p[3]), String(p[4])); break;
                case 'drawRect': drawRect(targetGrid, Number(p[0]), Number(p[1]), Number(p[2]), Number(p[3]), String(p[4])); break;
                case 'drawCircle': drawCircle(targetGrid, Number(p[0]), Number(p[1]), Number(p[2]), String(p[3])); break;
                case 'drawPointer': drawPointer(targetGrid, String(p[0]), Number(p[1]), Number(p[2])); break;
                case 'drawHand': drawHand(targetGrid, String(p[0]), Number(p[1]), Number(p[2])); break;
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
