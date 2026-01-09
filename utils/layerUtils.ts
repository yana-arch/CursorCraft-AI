import { GridData, Layer } from '../types';

export const GRID_SIZE = 32;

export const createEmptyGrid = (): GridData => 
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));

export const createLayer = (name: string, grid?: GridData): Layer => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  visible: true,
  grid: grid || createEmptyGrid()
});

// Composes all visible layers into a single grid for display/export
// Uses a simple painter's algorithm (top layer overwrites bottom)
export const composeLayers = (layers: Layer[]): GridData => {
  const result = createEmptyGrid();
  
  // Iterate layers from bottom to top
  for (const layer of layers) {
    if (!layer.visible) continue;
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = layer.grid[y][x];
        if (color) {
          result[y][x] = color;
        }
      }
    }
  }
  
  return result;
};

/**
 * Rotates a grid of pixels using Nearest Neighbor interpolation.
 * @param pixels The source grid of pixels to rotate.
 * @param angle Degrees to rotate (clockwise).
 * @returns A new grid with rotated pixels.
 */
export const rotatePixelsNN = (pixels: GridData, angle: number): GridData => {
    const h = pixels.length;
    const w = pixels[0].length;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Calculate center of the source image
    const cx = (w - 1) / 2;
    const cy = (h - 1) / 2;

    // Determine the size of the new bounding box
    // To keep it simple for pixel art selections, we can calculate the 
    // bounds of the four corners after rotation.
    const corners = [
        { x: 0, y: 0 },
        { x: w - 1, y: 0 },
        { x: 0, y: h - 1 },
        { x: w - 1, y: h - 1 }
    ];

    const rotatedCorners = corners.map(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        };
    });

    const minX = Math.floor(Math.min(...rotatedCorners.map(p => p.x)));
    const maxX = Math.ceil(Math.max(...rotatedCorners.map(p => p.x)));
    const minY = Math.floor(Math.min(...rotatedCorners.map(p => p.y)));
    const maxY = Math.ceil(Math.max(...rotatedCorners.map(p => p.y)));

    const newW = maxX - minX + 1;
    const newH = maxY - minY + 1;

    // Center of the new grid
    const ncx = (newW - 1) / 2;
    const ncy = (newH - 1) / 2;

    const result: GridData = Array(newH).fill(null).map(() => Array(newW).fill(''));

    for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
            // Map back to source coordinates (inverse rotation)
            const dx = x - ncx;
            const dy = y - ncy;

            // Rotate back
            const sx = Math.round(cx + dx * Math.cos(-rad) - dy * Math.sin(-rad));
            const sy = Math.round(cy + dx * Math.sin(-rad) + dy * Math.cos(-rad));

            if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                result[y][x] = pixels[sy][sx];
            }
        }
    }

    return result;
};
