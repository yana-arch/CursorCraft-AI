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
