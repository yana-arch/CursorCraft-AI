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
 * Rotates a grid of pixels using Nearest Neighbor interpolation around a custom pivot.
 */
export const rotatePixelsNN = (pixels: GridData, angle: number, pivot?: { x: number, y: number }): GridData => {
    const h = pixels.length;
    const w = pixels[0].length;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Center of the source image if pivot not provided
    const cx = pivot ? pivot.x : (w - 1) / 2;
    const cy = pivot ? pivot.y : (h - 1) / 2;

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

    // The pivot in the new coordinate system
    // The relative position of the pivot to the top-left corner (minX, minY)
    const ncx = cx - minX;
    const ncy = cy - minY;

    const result: GridData = Array(newH).fill(null).map(() => Array(newW).fill(''));

    for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
            const dx = x - ncx;
            const dy = y - ncy;

            const sx = Math.round(cx + dx * Math.cos(-rad) - dy * Math.sin(-rad));
            const sy = Math.round(cy + dx * Math.sin(-rad) + dy * Math.cos(-rad));

            if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                result[y][x] = pixels[sy][sx];
            }
        }
    }

    return result;
};

/**
 * Scales a grid of pixels using Nearest Neighbor interpolation.
 */
export const scalePixelsNN = (pixels: GridData, scale: number): GridData => {
    if (scale <= 0) return [['']];
    if (scale === 1) return pixels.map(row => [...row]);

    const h = pixels.length;
    const w = pixels[0].length;
    const newW = Math.max(1, Math.round(w * scale));
    const newH = Math.max(1, Math.round(h * scale));

    const result: GridData = Array(newH).fill(null).map(() => Array(newW).fill(''));

    for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
            const sx = Math.floor(x / scale);
            const sy = Math.floor(y / scale);
            if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                result[y][x] = pixels[sy][sx];
            }
        }
    }

    return result;
};

/**
 * Adjusts the opacity of hex8 colors.
 */
export const adjustOpacity = (color: string, factor: number): string => {
    if (!color || factor >= 1) return color;
    if (factor <= 0) return '';

    // Handle hex6 or hex8
    let hex = color.replace('#', '');
    let r, g, b, a = 255;

    if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        a = parseInt(hex.slice(6, 8), 16);
    } else {
        return color;
    }

    const newA = Math.round(a * factor).toString(16).padStart(2, '0');
    return `#${hex.slice(0, 6)}${newA}`;
};

/**
 * Shifts the hue of a hex8 color.
 */
export const shiftHue = (color: string, degree: number): string => {
    if (!color || degree === 0) return color;

    // Remove # and handle alpha
    let hex = color.replace('#', '');
    let r = parseInt(hex.slice(0, 2), 16) / 255;
    let g = parseInt(hex.slice(2, 4), 16) / 255;
    let b = parseInt(hex.slice(4, 6), 16) / 255;
    let a = hex.length === 8 ? hex.slice(6, 8) : 'ff';

    // RGB to HSL
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Shift Hue
    h = (h + degree / 360) % 1;
    if (h < 0) h += 1;

    // HSL to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);

    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${a}`;
};

/**
 * Easing functions
 */
export const getEasingValue = (t: number, type: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'): number => {
    switch (type) {
        case 'easeIn': return t * t;
        case 'easeOut': return t * (2 - t);
        case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default: return t;
    }
};
