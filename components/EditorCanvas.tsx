import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GridData, ToolType, Point, SelectionState, DrawMode } from '../types';
import { RotateCw, Film } from 'lucide-react';
import { rotatePixelsNN, createEmptyGrid } from '../utils/layerUtils';
import { drawLine, drawRect, drawCircle, getBrushPixels } from '../utils/drawUtils';

interface EditorCanvasProps {
  grid: GridData; // This is the ACTIVE LAYER grid
  setGrid: React.Dispatch<React.SetStateAction<GridData>>;
  activeTool: ToolType;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number;
  drawMode: DrawMode;
  hotspot: Point;
  setHotspot: (p: Point) => void;
  setPrimaryColor: (c: string) => void;
  
  // New Props for Context & Features
  bgGrid?: GridData; // Composite of layers below
  fgGrid?: GridData; // Composite of layers above
  onionSkinPrev?: GridData;
  onionSkinNext?: GridData;

  // Lifted Selection Props
  selection: SelectionState | null;
  setSelection: (s: SelectionState | null) => void;
  onRotateSelection: () => void;
  onOpenWizard?: () => void;
  // Path Deform Props
  pathPivot?: Point;
  pathPoints?: Point[];
  onSetPathPivot?: (p: Point) => void;
  onAddPathPoint?: (p: Point) => void;
  isPickingPivot?: boolean;
  isPickingPath?: boolean;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  grid,
  setGrid,
  activeTool,
  primaryColor,
  secondaryColor,
  brushSize,
  drawMode,
  hotspot,
  setHotspot,
  setPrimaryColor,
  bgGrid,
  fgGrid,
  onionSkinPrev,
  onionSkinNext,
  selection,
  setSelection,
  onRotateSelection,
  onOpenWizard,
  pathPivot,
  pathPoints,
  onSetPathPivot,
  onAddPathPoint,
  isPickingPivot,
  isPickingPath
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isRotatingSelection, setIsRotatingSelection] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [previewGrid, setPreviewGrid] = useState<GridData | null>(null);
  
  // selectionBox is local (UI only during drag)
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const GRID_SIZE = 32;

  // Clear selection if tool changes away from select or magicWand
  useEffect(() => {
      if (activeTool !== 'select' && activeTool !== 'magicWand' && selection) {
          commitSelection();
      }
  }, [activeTool]);

  const commitSelection = useCallback(() => {
      if (!selection) return;

      setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          
          // 1. Rotate the floating pixels if angle != 0
          let pixelsToMerge = selection.floatingPixels;
          let targetX = selection.x;
          let targetY = selection.y;

          if (Math.abs(selection.angle % 360) > 0.1) {
              pixelsToMerge = rotatePixelsNN(selection.floatingPixels, selection.angle);
              
              // Calculate new top-left to keep the rotation centered
              // The rotatePixelsNN function returns a grid centered on the original pixels
              const newH = pixelsToMerge.length;
              const newW = pixelsToMerge[0].length;
              
              const offsetX = (newW - selection.w) / 2;
              const offsetY = (newH - selection.h) / 2;
              
              targetX -= Math.round(offsetX);
              targetY -= Math.round(offsetY);
          }

          // 2. Merge floating pixels back
          const h = pixelsToMerge.length;
          const w = pixelsToMerge[0].length;

          for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                  const gx = targetX + x;
                  const gy = targetY + y;
                  if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                      const color = pixelsToMerge[y][x];
                      if (color) {
                          newGrid[gy][gx] = color;
                      }
                  }
              }
          }
          return newGrid;
      });
      setSelection(null);
      setSelectionBox(null);
  }, [selection, setGrid, setSelection]);

  const performFloodFill = (startX: number, startY: number, replacementColor: string, currentGrid: GridData): GridData => {
    const targetColor = currentGrid[startY][startX];
    if (targetColor === replacementColor) return currentGrid;

    const newGrid = currentGrid.map(row => [...row]);
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);

        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
        if (newGrid[y][x] !== targetColor) continue;

        newGrid[y][x] = replacementColor;

        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
    }

    return newGrid;
  };

  const performMagicWandSelect = (startX: number, startY: number, currentGrid: GridData) => {
      const targetColor = currentGrid[startY][startX];
      const queue: [number, number][] = [[startX, startY]];
      const visited = new Set<string>();
      const pixels: {x: number, y: number, color: string}[] = [];

      // BFS to find connected pixels
      while (queue.length > 0) {
          const [x, y] = queue.shift()!;
          const key = `${x},${y}`;

          if (visited.has(key)) continue;
          visited.add(key);
          
          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
          if (currentGrid[y][x] !== targetColor) continue;

          pixels.push({x, y, color: currentGrid[y][x]});

          queue.push([x + 1, y]);
          queue.push([x - 1, y]);
          queue.push([x, y + 1]);
          queue.push([x, y - 1]);
      }

      if (pixels.length === 0) return;

      // Calculate bounds
      let minX = GRID_SIZE, minY = GRID_SIZE, maxX = 0, maxY = 0;
      pixels.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
      });

      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      
      const floatingPixels = Array(h).fill(null).map(() => Array(w).fill(''));
      const newGrid = currentGrid.map(row => [...row]);

      pixels.forEach(p => {
          floatingPixels[p.y - minY][p.x - minX] = p.color;
          newGrid[p.y][p.x] = ''; // Remove from source
      });

      setGrid(newGrid);
      setSelection({
          x: minX,
          y: minY,
          w, 
          h,
          floatingPixels,
          angle: 0
      });
  };

  const handleMouseDown = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (e.button !== 0 && e.button !== 2) return;

    if (isPickingPivot && onSetPathPivot) {
        onSetPathPivot({ x, y });
        return;
    }

    if (isPickingPath && onAddPathPoint) {
        onAddPathPoint({ x, y });
        return;
    }

    if (activeTool === 'select' || activeTool === 'magicWand' || activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
        // Handle shapes
        if (activeTool !== 'select' && activeTool !== 'magicWand') {
            setIsDrawing(true);
            setDragStart({ x, y });
            setPreviewGrid(createEmptyGrid());
            return;
        }

        // If clicking inside existing selection -> Move
        if (selection && 
            x >= selection.x && x < selection.x + selection.w &&
            y >= selection.y && y < selection.y + selection.h) {
            
            setIsDraggingSelection(true);
            setDragStart({ x, y });
            return;
        }
        
        // If clicking outside existing selection -> Commit then Start New
        if (selection) {
            commitSelection();
            // Fall through to start new selection/wand
        }

        if (activeTool === 'magicWand') {
            performMagicWandSelect(x, y, grid);
            return;
        }

        // Start new selection box
        setIsDrawing(true);
        setSelectionBox({ x, y, w: 1, h: 1 });
        return;
    }

    if (activeTool === 'hotspot') {
      setHotspot({ x, y });
      return;
    }

    if (activeTool === 'picker') {
        // Check floating first, then fg, then grid, then bg
        let color = '';
        if (selection && 
            x >= selection.x && x < selection.x + selection.w && 
            y >= selection.y && y < selection.y + selection.h) {
             const localX = x - selection.x;
             const localY = y - selection.y;
             color = selection.floatingPixels[localY][localX] || '';
        }
        if (!color && fgGrid) color = fgGrid[y][x];
        if (!color) color = grid[y][x];
        if (!color && bgGrid) color = bgGrid[y][x];
        
        if (color) setPrimaryColor(color);
        return;
    }

    setIsDrawing(true);
    handlePixelAction(x, y, e.button === 2);
  };

  const handleMouseEnter = (e: React.MouseEvent, x: number, y: number) => {
    if (activeTool === 'select' || activeTool === 'magicWand') {
        if (isRotatingSelection && selection) {
            // Calculate center of selection in grid coordinates
            const centerX = selection.x + selection.w / 2;
            const centerY = selection.y + selection.h / 2;
            
            // Calculate angle between center and current mouse
            // We subtract 90 degrees because the handle is at the top
            const rad = Math.atan2(y - centerY, x - centerX);
            const deg = (rad * 180) / Math.PI + 90;
            
            setSelection({
                ...selection,
                angle: deg
            });
            return;
        }

        if (isDraggingSelection && selection) {
            const dx = x - dragStart.x;
            const dy = y - dragStart.y;
            if (dx !== 0 || dy !== 0) {
                setSelection({
                    ...selection,
                    x: selection.x + dx,
                    y: selection.y + dy
                });
                setDragStart({ x, y });
            }
        } 
        return;
    }

    if (isDrawing && activeTool !== 'fill') {
      handlePixelAction(x, y, e.buttons === 2);
    }
  };

  // Improved selection box logic
  const selectionStartRef = useRef<Point | null>(null);

  const handleGlobalMouseDown = (e: any, x: number, y: number) => {
      // Don't start drawing selection if clicking on the rotate handle
      if ((e.target as HTMLElement).closest('.rotate-handle')) return;

      if (activeTool === 'select' && !selection && !isDraggingSelection) {
          selectionStartRef.current = { x, y };
      }
      handleMouseDown(e, x, y);
  };

  const handleGlobalMouseEnter = (e: any, x: number, y: number) => {
      if (activeTool === 'select' && isDrawing && selectionStartRef.current) {
          const startX = selectionStartRef.current.x;
          const startY = selectionStartRef.current.y;
          const minX = Math.min(startX, x);
          const minY = Math.min(startY, y);
          const w = Math.abs(x - startX) + 1;
          const h = Math.abs(y - startY) + 1;
          setSelectionBox({ x: minX, y: minY, w, h });
      } else if (isDrawing && ['line', 'rect', 'circle'].includes(activeTool)) {
          const pg = createEmptyGrid();
          const color = e.buttons === 2 ? secondaryColor : primaryColor;
          if (activeTool === 'line') drawLine(pg, dragStart.x, dragStart.y, x, y, color, brushSize);
          else if (activeTool === 'rect') drawRect(pg, dragStart.x, dragStart.y, x, y, color, brushSize, drawMode);
          else if (activeTool === 'circle') drawCircle(pg, dragStart.x, dragStart.y, x, y, color, brushSize, drawMode);
          setPreviewGrid(pg);
      } else {
          handleMouseEnter(e, x, y);
      }
  };

  const handleMouseUp = () => {
    if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
        if (isDrawing && previewGrid) {
            setGrid(prev => {
                const newGrid = prev.map(row => [...row]);
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        if (previewGrid[y][x]) newGrid[y][x] = previewGrid[y][x];
                    }
                }
                return newGrid;
            });
        }
        setPreviewGrid(null);
    }

    if (activeTool === 'select' || activeTool === 'magicWand') {
        setIsDraggingSelection(false);
        setIsRotatingSelection(false);
        
        if (activeTool === 'select' && isDrawing && selectionBox) {
            // Finalize selection: Extract pixels
            const floating = Array(selectionBox.h).fill(null).map(() => Array(selectionBox.w).fill(''));
            let hasPixels = false;

            const newGrid = grid.map(row => [...row]);

            for(let y=0; y<selectionBox.h; y++) {
                for(let x=0; x<selectionBox.w; x++) {
                    const gx = selectionBox.x + x;
                    const gy = selectionBox.y + y;
                    const color = grid[gy][gx];
                    if (color) {
                        floating[y][x] = color;
                        newGrid[gy][gx] = ''; // Cut from source
                        hasPixels = true;
                    }
                }
            }

            if (hasPixels) {
                setGrid(newGrid);
                setSelection({
                    x: selectionBox.x,
                    y: selectionBox.y,
                    w: selectionBox.w,
                    h: selectionBox.h,
                    floatingPixels: floating,
                    angle: 0
                });
            }
            // Clear box, show floating instead
            setSelectionBox(null);
            selectionStartRef.current = null;
        }
    }
    setIsDrawing(false);
  };

  const handlePixelAction = useCallback((x: number, y: number, isRightClick: boolean = false) => {
    setGrid((prevGrid) => {
      if (activeTool === 'fill') {
          const fillColor = isRightClick ? secondaryColor : primaryColor;
          return performFloodFill(x, y, fillColor, prevGrid);
      }

      const newGrid = prevGrid.map((row) => [...row]);
      const color = isRightClick ? secondaryColor : primaryColor;

      if (activeTool === 'eraser' || activeTool === 'pen') {
          const targetColor = activeTool === 'eraser' ? '' : color;
          if (brushSize === 1) {
              newGrid[y][x] = targetColor;
          } else {
              const pixels = getBrushPixels(x, y, brushSize);
              pixels.forEach(p => {
                  if (newGrid[p.y] && newGrid[p.y][p.x] !== undefined) {
                      newGrid[p.y][p.x] = targetColor;
                  }
              });
          }
      }
      return newGrid;
    });
  }, [activeTool, primaryColor, secondaryColor, setGrid, brushSize]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [activeTool, isDraggingSelection, isDrawing, selectionBox, grid, previewGrid]);


  // Helper to render a cell's color logic
  const getCellContent = (x: number, y: number) => {
      // 1. Preview (Drawing shapes)
      if (previewGrid && previewGrid[y][x]) return { color: previewGrid[y][x], type: 'preview' };

      // 2. Foreground
      if (fgGrid && fgGrid[y][x]) return { color: fgGrid[y][x], type: 'fg' };

      // 2. Active Layer
      if (grid[y][x]) return { color: grid[y][x], type: 'active' };

      // 3. Background
      if (bgGrid && bgGrid[y][x]) return { color: bgGrid[y][x], type: 'bg' };

      // 4. Onion Skins
      if (onionSkinNext && onionSkinNext[y][x]) return { color: onionSkinNext[y][x], type: 'onionNext' };
      if (onionSkinPrev && onionSkinPrev[y][x]) return { color: onionSkinPrev[y][x], type: 'onionPrev' };

      return null;
  };

  return (
    <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="relative shadow-2xl shadow-black/50 border border-gray-800">
        <div 
            className="grid relative"
            style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: '640px', 
                height: '640px' 
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Selection Box Overlay */}
            {selectionBox && (
                <div 
                    className="absolute border-2 border-brand-400 bg-brand-500/10 pointer-events-none z-20"
                    style={{
                        left: `${selectionBox.x * 20}px`,
                        top: `${selectionBox.y * 20}px`,
                        width: `${selectionBox.w * 20}px`,
                        height: `${selectionBox.h * 20}px`
                    }}
                />
            )}

             {/* Floating Selection Border Overlay & Controls */}
             {selection && (
                <div 
                    className="absolute border border-dashed border-white/80 pointer-events-none z-20"
                    style={{
                        left: `${selection.x * 20}px`,
                        top: `${selection.y * 20}px`,
                        width: `${selection.w * 20}px`,
                        height: `${selection.h * 20}px`,
                        transform: `rotate(${selection.angle}deg)`,
                        transformOrigin: 'center center'
                    }}
                >
                    {/* Render Floating Pixels */}
                    <div 
                        className="absolute inset-0 grid"
                        style={{
                            gridTemplateColumns: `repeat(${selection.w}, 1fr)`,
                            gridTemplateRows: `repeat(${selection.h}, 1fr)`
                        }}
                    >
                        {selection.floatingPixels.map((row, sy) => (
                            row.map((color, sx) => (
                                <div 
                                    key={`${sx}-${sy}`}
                                    style={{ backgroundColor: color }}
                                    className="w-full h-full"
                                />
                            ))
                        ))}
                    </div>

                    {/* Handles (Visual Only) */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-gray-500" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-gray-500" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-gray-500" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-gray-500" />
                    
                    {/* Rotate Handle (Functional) */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-white" />
                    <button
                        className="rotate-handle absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border border-gray-500 shadow-sm flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-gray-100 hover:scale-110 transition-transform z-50"
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsRotatingSelection(true);
                        }}
                        title="Drag to Rotate"
                    >
                        <RotateCw size={12} className="text-gray-800" />
                    </button>

                    {/* Animation Wizard Button */}
                    {onOpenWizard && (
                        <button
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-600 rounded-full border border-brand-400 shadow-lg flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-brand-500 hover:scale-110 transition-all z-50 text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenWizard();
                            }}
                            title="Auto-Animate Selection"
                        >
                            <Film size={14} fill="currentColor" />
                        </button>
                    )}
                </div>
            )}

            {Array(GRID_SIZE).fill(0).map((_, y) => (
                Array(GRID_SIZE).fill(0).map((_, x) => {
                    const content = getCellContent(x, y);
                    let displayColor = content?.color;
                    let opacity = 1;

                    // Onion Skin Opacity override
                    if (content?.type === 'onionPrev' || content?.type === 'onionNext') {
                        opacity = 0.3;
                    }
                    // Background Context Opacity override
                    if (content?.type === 'bg' || content?.type === 'fg') {
                        opacity = 0.6; // Dim context layers slightly? Optional.
                    }

                    return (
                        <div
                            key={`${x}-${y}`}
                            onMouseDown={(e) => handleGlobalMouseDown(e, x, y)}
                            onMouseEnter={(e) => handleGlobalMouseEnter(e, x, y)}
                            className={`w-full h-full border-[0.5px] border-gray-800/20 select-none relative
                                ${(x + y) % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} 
                            `}
                        >
                            {displayColor && (
                                <div 
                                    className="absolute inset-0 w-full h-full" 
                                    style={{ backgroundColor: displayColor, opacity }} 
                                />
                            )}

                             {hotspot.x === x && hotspot.y === y && (
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ring-1 ring-white shadow-sm shadow-black" />
                                 </div>
                             )}

                             {/* Path Pivot Marker */}
                             {pathPivot?.x === x && pathPivot?.y === y && (
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]">
                                     <div className="w-3 h-3 bg-brand-500 rounded-full ring-2 ring-white shadow-lg flex items-center justify-center text-[8px] text-white font-bold">X</div>
                                 </div>
                             )}

                             {/* Path Target Points Markers */}
                             {pathPoints?.map((p, idx) => (
                                 p.x === x && p.y === y && (
                                     <div key={`path-${idx}`} className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]">
                                         <div className="w-3 h-3 bg-purple-500 rounded-full ring-2 ring-white shadow-lg flex items-center justify-center text-[8px] text-white font-bold">{idx + 1}</div>
                                     </div>
                                 )
                             ))}
                         </div>

                    );
                })
            ))}
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-mono">
        {GRID_SIZE}x{GRID_SIZE} Grid | Hotspot: ({hotspot.x}, {hotspot.y})
        {activeTool === 'select' && " | Drag to move | Click top handle to Rotate"}
        {activeTool === 'magicWand' && " | Click to select connected area"}
      </div>
    </div>
  );
};

export default EditorCanvas;