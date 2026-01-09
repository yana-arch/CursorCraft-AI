import { GridData } from '../types';
import { createEmptyGrid } from './layerUtils';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const toHexColor = (hex: string, opacity: number): string => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split('')
            .map((c) => c + c)
            .join('');
    }
    const alpha = Math.round(opacity * 255);
    const alphaHex = alpha.toString(16).padStart(2, '0');
    return `#${cleanHex}${alphaHex}`;
};

export const processImageToGrid = (
    img: HTMLImageElement,
    sourceX = 0,
    sourceY = 0,
    width = 32,
    height = 32
): GridData => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return createEmptyGrid();

    ctx.drawImage(img, sourceX, sourceY, width, height, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const newGrid = createEmptyGrid();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a > 10) {
                const hex =
                    '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                const alphaHex = a.toString(16).padStart(2, '0');
                newGrid[y][x] = hex + alphaHex;
            } else {
                newGrid[y][x] = '';
            }
        }
    }
    return newGrid;
};
