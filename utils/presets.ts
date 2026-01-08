import { Frame } from '../types';
import { createLayer, createEmptyGrid } from './layerUtils';

// Helper for unique IDs
const uuid = () => Math.random().toString(36).substr(2, 9);

// --- Drawing Helpers ---

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

// Draws a standard pointer shape
const drawPointer = (grid: string[][], color: string, offsetX = 0, offsetY = 0) => {
    const simpleArrow = [
        [0,0], 
        [0,1], [1,1],
        [0,2], [1,2], [2,2],
        [0,3], [1,3], [2,3], [3,3],
        [0,4], [1,4], [2,4], [3,4], [4,4],
        [0,5], [1,5], [2,5], [3,5], [4,5], [5,5],
        [0,6], [1,6], [2,6], [3,6],
        [0,7], [1,7], [2,7],
        [0,8], [1,8],
        [0,9],
        [3,7], [4,8], [5,9], [6,10] 
    ];

    simpleArrow.forEach(([x, y]) => {
        const tx = x + offsetX;
        const ty = y + offsetY;
        if (grid[ty] && grid[ty][tx] !== undefined) grid[ty][tx] = color;
    });
};

const drawHand = (grid: string[][], color: string, offsetX = 0, offsetY = 0) => {
    const indexFinger = [
        [4,0], [5,0], [4,1], [5,1], [4,2], [5,2], [4,3], [5,3], [4,4], [5,4], [4,5], [5,5],
    ];
    const palm = [
        [6,5], [7,5], [8,5],
        [3,6], [4,6], [5,6], [6,6], [7,6], [8,6], [9,6],
        [2,7], [3,7], [4,7], [5,7], [6,7], [7,7], [8,7], [9,7],
        [2,8], [3,8], [4,8], [5,8], [6,8], [7,8], [8,8], [9,8],
        [2,9], [3,9], [4,9], [5,9], [6,9], [7,9], [8,9], [9,9],
        [3,10], [4,10], [5,10], [6,10], [7,10], [8,10]
    ];
    const thumb = [[0,7], [1,7], [0,8], [1,8], [1,9]];

    [...indexFinger, ...palm, ...thumb].forEach(([x, y]) => {
        const tx = x + offsetX + 10;
        const ty = y + offsetY + 8;
        if (grid[ty] && grid[ty][tx] !== undefined) grid[ty][tx] = color;
    });
};

const drawQuestionMark = (grid: string[][], color: string, offsetX = 0, offsetY = 0) => {
    const points = [[2,0], [3,0], [4,0], [1,1], [5,1], [5,2], [4,3], [3,4], [3,6], [3,7]];
    points.forEach(([x, y]) => {
        const tx = x + offsetX; const ty = y + offsetY;
        if (grid[ty] && grid[ty][tx] !== undefined) grid[ty][tx] = color;
    });
};

const drawCrosshair = (grid: string[][], color: string) => {
    const cx = 15, cy = 15;
    for (let i = 0; i < 32; i++) {
        if (i < cx - 2 || i > cx + 2) if (grid[cy]) grid[cy][i] = color;
    }
    for (let i = 0; i < 32; i++) {
         if (i < cy - 2 || i > cy + 2) if (grid[i]) grid[i][cx] = color;
    }
    if (grid[cy]) grid[cy][cx] = color;
};

const drawIBeam = (grid: string[][], color: string) => {
    drawRect(grid, 12, 4, 8, 2, color); // Top
    drawRect(grid, 12, 26, 8, 2, color); // Bottom
    drawRect(grid, 15, 6, 2, 20, color); // Stem
};

const drawMoveIcon = (grid: string[][], color: string) => {
    const cx = 16, cy = 16;
    drawRect(grid, cx-1, 4, 2, 24, color); // Vert
    drawRect(grid, 4, cy-1, 24, 2, color); // Horz
    // Arrows
    const tips = [
        [[cx, 2], [cx-2, 5], [cx+2, 5]], // Top
        [[cx, 29], [cx-2, 26], [cx+2, 26]], // Bottom
        [[2, cy], [5, cy-2], [5, cy+2]], // Left
        [[29, cy], [26, cy-2], [26, cy+2]] // Right
    ];
    tips.flat().forEach(([x, y]) => {
         if(grid[y] && grid[y][x] !== undefined) grid[y][x] = color;
    });
};

const drawResizeNS = (grid: string[][], color: string) => {
    const cx = 16;
    drawRect(grid, cx-1, 4, 2, 24, color);
    const tips = [
        [[cx, 2], [cx-2, 5], [cx+2, 5], [cx-3, 6], [cx+3, 6]], // Top
        [[cx, 29], [cx-2, 26], [cx+2, 26], [cx-3, 25], [cx+3, 25]], // Bottom
    ];
    tips.flat().forEach(([x, y]) => {
         if(grid[y] && grid[y][x] !== undefined) grid[y][x] = color;
    });
};

const drawForbidden = (grid: string[][], color: string) => {
    drawCircle(grid, 16, 16, 10, color);
    drawLine(grid, 10, 22, 22, 10, color); // Slash
};

// --- Generators ---

const generateNeonArrow = (): Frame[] => {
    const frames: Frame[] = [];
    const glowColors = ['#60a5fa', '#93c5fd', '#bfdbfe', '#93c5fd'];
    glowColors.forEach(glow => {
        const grid = createEmptyGrid();
        const tempGrid = createEmptyGrid();
        drawPointer(tempGrid, '#FFFFFF', 2, 2);
        for(let y=0; y<32; y++) {
            for(let x=0; x<32; x++) {
                if (tempGrid[y][x]) {
                    grid[y][x] = '#2563eb';
                    [[0,1],[0,-1],[1,0],[-1,0], [1,1], [1,-1], [-1,1], [-1,-1]].forEach(([dx, dy]) => {
                        const ny = y+dy, nx = x+dx;
                        if (grid[ny] && grid[ny][nx] === '' && !tempGrid[ny]?.[nx]) {
                            grid[ny][nx] = glow;
                        }
                    });
                }
            }
        }
        frames.push({ id: uuid(), duration: 120, layers: [createLayer('Neon Arrow', grid)] });
    });
    return frames;
};

const generateRainbowSpinner = (): Frame[] => {
    const frames: Frame[] = [];
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f43f5e'];
    for (let i = 0; i < 8; i++) {
        const grid = createEmptyGrid();
        colors.forEach((col, idx) => {
            const angle = ((idx + i) % 8 * 45) * (Math.PI / 180);
            const x = Math.round(16 + Math.cos(angle) * 8);
            const y = Math.round(16 + Math.sin(angle) * 8);
            if (grid[y] && grid[y][x] !== undefined) {
                grid[y][x] = col;
                if(grid[y][x+1] !== undefined) grid[y][x+1] = col;
            }
        });
        frames.push({ id: uuid(), duration: 80, layers: [createLayer('Spinner', grid)] });
    }
    return frames;
};

const generateWaitingHourglass = (): Frame[] => {
    const frames: Frame[] = [];
    for(let f=0; f<4; f++) {
        const grid = createEmptyGrid();
        const glass = '#9ca3af', sand = '#fbbf24';
        const shape = [
            [12,10], [13,10], [14,10], [15,10], [16,10], [17,10], [18,10], [19,10],
            [12,21], [13,21], [14,21], [15,21], [16,21], [17,21], [18,21], [19,21],
            [12,11], [19,11], [13,12], [18,12], [14,13], [17,13],
            [15,14], [16,14], [14,15], [17,15], [13,16], [18,16],
            [12,17], [19,17], [12,18], [19,18], [12,19], [19,19], [12,20], [19,20]
        ];
        shape.forEach(([x,y]) => { if(grid[y]) grid[y][x] = glass; });
        if(f===0) { grid[13][15]=sand; grid[13][16]=sand; grid[12][14]=sand; grid[12][17]=sand; }
        if(f===1) { grid[13][15]=sand; grid[13][16]=sand; }
        if(f===2) { grid[13][15]=sand; }
        grid[14][15]=sand; grid[15][15]=sand;
        if(f%2===0) grid[16][15]=sand;
        if(f>0) { grid[20][15]=sand; grid[20][16]=sand; }
        if(f>1) { grid[19][14]=sand; grid[19][17]=sand; }
        if(f>2) { grid[18][13]=sand; grid[18][18]=sand; }
        frames.push({ id: uuid(), duration: 250, layers: [createLayer(`Phase ${f+1}`, grid)] });
    }
    return frames;
};

const generateTappingHand = (): Frame[] => {
    const frames: Frame[] = [];
    const skin = '#fca5a5';
    let grid = createEmptyGrid();
    drawHand(grid, skin, 0, 0);
    frames.push({ id: uuid(), duration: 200, layers: [createLayer('Up', grid)] });
    grid = createEmptyGrid();
    drawHand(grid, skin, 0, 1);
    frames.push({ id: uuid(), duration: 200, layers: [createLayer('Down', grid)] });
    return frames;
};

const generateBouncingHelp = (): Frame[] => {
    const frames: Frame[] = [];
    const bounceY = [0, -1, -2, -1];
    bounceY.forEach((by, idx) => {
        const grid = createEmptyGrid();
        drawPointer(grid, '#FFFFFF', 2, 6);
        drawQuestionMark(grid, '#fbbf24', 18, 6 + by);
        frames.push({ id: uuid(), duration: 150, layers: [createLayer(`Bounce ${idx}`, grid)] });
    });
    return frames;
};

const generateWorking = (): Frame[] => {
    const frames: Frame[] = [];
    for(let i=0; i<8; i++) {
        const grid = createEmptyGrid();
        drawPointer(grid, '#FFFFFF', 0, 0);
        const angle = (i * 45) * (Math.PI / 180);
        const x = Math.round(20 + Math.cos(angle) * 5);
        const y = Math.round(12 + Math.sin(angle) * 5);
        if(grid[y] && grid[y][x] !== undefined) grid[y][x] = '#ef4444';
        frames.push({ id: uuid(), duration: 100, layers: [createLayer('Working', grid)] });
    }
    return frames;
};

// Static presets
const createStaticArrow = (color: string) => {
    const grid = createEmptyGrid();
    drawPointer(grid, color, 2, 2);
    return [{ id: uuid(), duration: 100, layers: [createLayer('Base', grid)] }];
};

const createStaticCrosshair = (color: string) => {
    const grid = createEmptyGrid();
    drawCrosshair(grid, color);
    return [{ id: uuid(), duration: 100, layers: [createLayer('Base', grid)] }];
};

const createStaticSystem = (type: 'ibeam' | 'move' | 'resize_ns' | 'forbidden') => {
    const grid = createEmptyGrid();
    const color = '#f3f4f6'; // Light gray/Whiteish
    if (type === 'ibeam') drawIBeam(grid, color);
    if (type === 'move') drawMoveIcon(grid, color);
    if (type === 'resize_ns') drawResizeNS(grid, color);
    if (type === 'forbidden') drawForbidden(grid, '#ef4444');
    return [{ id: uuid(), duration: 100, layers: [createLayer('Base', grid)] }];
};

export const PRESETS = [
    { id: 'preset_neon_pulse', name: 'Neon Pulse', category: 'Animated', frames: generateNeonArrow() },
    { id: 'preset_rainbow_spin', name: 'Rainbow Spin', category: 'Animated', frames: generateRainbowSpinner() },
    { id: 'preset_hourglass', name: 'Busy Hourglass', category: 'Animated', frames: generateWaitingHourglass() },
    { id: 'preset_working', name: 'Working BG', category: 'Animated', frames: generateWorking() },
    { id: 'preset_hand_tap', name: 'Tapping Hand', category: 'Animated', frames: generateTappingHand() },
    { id: 'preset_help_bounce', name: 'Help Select', category: 'Animated', frames: generateBouncingHelp() },
    { id: 'preset_arrow_classic', name: 'Classic Blue', category: 'Static', frames: createStaticArrow('#3b82f6') },
    { id: 'preset_arrow_white', name: 'Standard White', category: 'Static', frames: createStaticArrow('#ffffff') },
    { id: 'preset_crosshair_red', name: 'Sniper Red', category: 'Static', frames: createStaticCrosshair('#ef4444') },
    { id: 'preset_ibeam', name: 'Text Select', category: 'System', frames: createStaticSystem('ibeam') },
    { id: 'preset_move', name: 'Move', category: 'System', frames: createStaticSystem('move') },
    { id: 'preset_resize_ns', name: 'Resize V', category: 'System', frames: createStaticSystem('resize_ns') },
    { id: 'preset_forbidden', name: 'Unavailable', category: 'System', frames: createStaticSystem('forbidden') },
];
