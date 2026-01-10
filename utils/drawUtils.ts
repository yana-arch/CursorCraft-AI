import { GridData, DrawMode } from '../types';

export const GRID_SIZE = 32;

/**
 * Gets all pixels covered by a brush of a certain size at a given coordinate.
 */
export const getBrushPixels = (x: number, y: number, size: number): { x: number, y: number }[] => {
    const pixels: { x: number, y: number }[] = [];
    const radius = (size - 1) / 2;
    
    for (let dy = -Math.floor(radius); dy <= Math.ceil(radius); dy++) {
        for (let dx = -Math.floor(radius); dx <= Math.ceil(radius); dx++) {
            pixels.push({ x: x + dx, y: y + dy });
        }
    }
    return pixels;
};

const setPixelWithBrush = (grid: string[][], x: number, y: number, color: string, brushSize: number) => {
    if (brushSize === 1) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = color;
    } else {
        const brushPixels = getBrushPixels(x, y, brushSize);
        brushPixels.forEach(p => {
            if (grid[p.y] && grid[p.y][p.x] !== undefined) grid[p.y][p.x] = color;
        });
    }
};

export const drawLine = (grid: string[][], x0: number, y0: number, x1: number, y1: number, color: string, brushSize: number = 1) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        setPixelWithBrush(grid, x0, y0, color, brushSize);
        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
};

export const drawRect = (grid: string[][], x0: number, y0: number, x1: number, y1: number, color: string, brushSize: number = 1, mode: DrawMode = 'stroke') => {
    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const w = Math.abs(x1 - x0) + 1;
    const h = Math.abs(y1 - y0) + 1;

    if (mode === 'fill') {
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                if (grid[y + j] && grid[y + j][x + i] !== undefined) grid[y + j][x + i] = color;
            }
        }
    } else {
        // Draw 4 lines for stroke
        drawLine(grid, x, y, x + w - 1, y, color, brushSize); // Top
        drawLine(grid, x, y + h - 1, x + w - 1, y + h - 1, color, brushSize); // Bottom
        drawLine(grid, x, y, x, y + h - 1, color, brushSize); // Left
        drawLine(grid, x + w - 1, y, x + w - 1, y + h - 1, color, brushSize); // Right
    }
};

export const drawCircle = (grid: string[][], x0: number, y0: number, x1: number, y1: number, color: string, brushSize: number = 1, mode: DrawMode = 'stroke') => {
    const cx = Math.floor((x0 + x1) / 2);
    const cy = Math.floor((y0 + y1) / 2);
    const rx = Math.abs(x1 - x0) / 2;
    const ry = Math.abs(y1 - y0) / 2;

    if (mode === 'fill') {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Ellipse equation: (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1
                const dx = x - cx;
                const dy = y - cy;
                if ((dx * dx) / (rx * rx || 1) + (dy * dy) / (ry * ry || 1) <= 1.05) {
                    grid[y][x] = color;
                }
            }
        }
    } else {
        // Midpoint Circle/Ellipse like drawing for stroke
        // For simplicity and cursor art, we'll use a distance check
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = (dx * dx) / (rx * rx || 1) + (dy * dy) / (ry * ry || 1);
                if (Math.abs(dist - 1) < (brushSize * 0.15 + 0.1)) {
                    setPixelWithBrush(grid, x, y, color, brushSize);
                }
            }
        }
    }
};
