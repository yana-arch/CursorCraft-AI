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
    sourceW?: number,
    sourceH?: number
): GridData => {
    const targetSize = 32;
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return createEmptyGrid();

    const sw = Math.floor(Math.max(1, sourceW || img.naturalWidth));
    const sh = Math.floor(Math.max(1, sourceH || img.naturalHeight));
    const sx = Math.floor(Math.max(0, sourceX));
    const sy = Math.floor(Math.max(0, sourceY));

    // Draw the source region into the 32x32 target canvas (scaling automatically)
    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.imageSmoothingEnabled = false; 
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
    
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
    const data = imageData.data;

    const newGrid = createEmptyGrid();

    for (let y = 0; y < targetSize; y++) {
        for (let x = 0; x < targetSize; x++) {
            const i = (y * targetSize + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a > 10) {
                const hex =
                    '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                const alphaHex = a.toString(16).padStart(2, '0');
                newGrid[y][x] = hex + (alphaHex === 'ff' ? '' : alphaHex);
            } else {
                newGrid[y][x] = '';
            }
        }
    }
    return newGrid;
};
