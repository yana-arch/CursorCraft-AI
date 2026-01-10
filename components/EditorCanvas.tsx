import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCw, Film } from 'lucide-react';
import { rotatePixelsNN, createEmptyGrid } from '../utils/layerUtils';
import { drawLine, drawRect, drawCircle, getBrushPixels } from '../utils/drawUtils';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';
import { GridData, Point } from '../types';

interface EditorCanvasProps {
  onionSkinPrev?: GridData;
  onionSkinNext?: GridData;
  onRotateSelection: () => void;
  onOpenWizard?: () => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  onionSkinPrev,
  onionSkinNext,
  onRotateSelection,
  onOpenWizard
}) => {
  const {
    activeTool,
    primaryColor, setPrimaryColor,
    secondaryColor,
    brushSize,
    drawMode,
    selection, setSelection,
    pathPivot, setPathPivot,
    pathPoints, setPathPoints,
    isPickingPivot,
    isPickingPath,
  } = useEditor();

  const {
    activeLayerGrid: grid,
    updateActiveLayerGrid: setGrid,
    backgroundGrid: bgGrid,
    foregroundGrid: fgGrid,
    hotspot, setHotspot,
  } = useProject();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isRotatingSelection, setIsRotatingSelection] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [previewGrid, setPreviewGrid] = useState<GridData | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const GRID_SIZE = 32;
  const selectionStartRef = useRef<Point | null>(null);

  // Clear selection if tool changes
  useEffect(() => {
      if (activeTool !== 'select' && activeTool !== 'magicWand' && selection) {
          commitSelection();
      }
  }, [activeTool]);

  const commitSelection = useCallback(() => {
      if (!selection) return;

      setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          let pixelsToMerge = selection.floatingPixels;
          let targetX = selection.x;
          let targetY = selection.y;

          if (Math.abs(selection.angle % 360) > 0.1) {
              pixelsToMerge = rotatePixelsNN(selection.floatingPixels, selection.angle);
              const newH = pixelsToMerge.length;
              const newW = pixelsToMerge[0].length;
              const offsetX = (newW - selection.w) / 2;
              const offsetY = (newH - selection.h) / 2;
              targetX -= Math.round(offsetX);
              targetY -= Math.round(offsetY);
          }

          const h = pixelsToMerge.length;
          const w = pixelsToMerge[0].length;

          for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                  const gx = targetX + x;
                  const gy = targetY + y;
                  if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                      const color = pixelsToMerge[y][x];
                      if (color) newGrid[gy][gx] = color;
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
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return newGrid;
  };

  const performMagicWandSelect = (startX: number, startY: number, currentGrid: GridData) => {
      const targetColor = currentGrid[startY][startX];
      const queue: [number, number][] = [[startX, startY]];
      const visited = new Set<string>();
      const pixels: {x: number, y: number, color: string}[] = [];
      while (queue.length > 0) {
          const [x, y] = queue.shift()!;
          const key = `${x},${y}`;
          if (visited.has(key)) continue;
          visited.add(key);
          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
          if (currentGrid[y][x] !== targetColor) continue;
          pixels.push({x, y, color: currentGrid[y][x]});
          queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      if (pixels.length === 0) return;
      let minX = GRID_SIZE, minY = GRID_SIZE, maxX = 0, maxY = 0;
      pixels.forEach(p => {
          if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      });
      const w = maxX - minX + 1, h = maxY - minY + 1;
      const floatingPixels = Array(h).fill(null).map(() => Array(w).fill(''));
      const newGrid = currentGrid.map(row => [...row]);
      pixels.forEach(p => {
          floatingPixels[p.y - minY][p.x - minX] = p.color;
          newGrid[p.y][p.x] = '';
      });
      setGrid(newGrid);
      setSelection({ x: minX, y: minY, w, h, floatingPixels, angle: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (e.button !== 0 && e.button !== 2) return;

    if (isPickingPivot) { setPathPivot({ x, y }); return; }
    if (isPickingPath) { setPathPoints([...pathPoints, { x, y }]); return; }

    if (activeTool === 'select' || activeTool === 'magicWand' || activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
        if (activeTool !== 'select' && activeTool !== 'magicWand') {
            setIsDrawing(true); setDragStart({ x, y });
            setPreviewGrid(createEmptyGrid()); return;
        }
        if (selection && x >= selection.x && x < selection.x + selection.w && y >= selection.y && y < selection.y + selection.h) {
            setIsDraggingSelection(true); setDragStart({ x, y }); return;
        }
        if (selection) commitSelection();
        if (activeTool === 'magicWand') { performMagicWandSelect(x, y, grid); return; }
        setIsDrawing(true); setSelectionBox({ x, y, w: 1, h: 1 }); return;
    }

    if (activeTool === 'hotspot') { setHotspot({ x, y }); return; }
    if (activeTool === 'picker') {
        let color = '';
        if (selection && x >= selection.x && x < selection.x + selection.w && y >= selection.y && y < selection.y + selection.h) {
             color = selection.floatingPixels[y - selection.y][x - selection.x] || '';
        }
        if (!color && fgGrid) color = fgGrid[y][x];
        if (!color) color = grid[y][x];
        if (!color && bgGrid) color = bgGrid[y][x];
        if (color) setPrimaryColor(color); return;
    }

    setIsDrawing(true); handlePixelAction(x, y, e.button === 2);
  };

  const handleMouseEnter = (e: React.MouseEvent, x: number, y: number) => {
    if (activeTool === 'select' || activeTool === 'magicWand') {
        if (isRotatingSelection && selection) {
            const centerX = selection.x + selection.w / 2, centerY = selection.y + selection.h / 2;
            const rad = Math.atan2(y - centerY, x - centerX);
            setSelection({ ...selection, angle: (rad * 180) / Math.PI + 90 });
            return;
        }
        if (isDraggingSelection && selection) {
            const dx = x - dragStart.x, dy = y - dragStart.y;
            if (dx !== 0 || dy !== 0) {
                setSelection({ ...selection, x: selection.x + dx, y: selection.y + dy });
                setDragStart({ x, y });
            }
        } 
        return;
    }
    if (isDrawing && activeTool !== 'fill') handlePixelAction(x, y, e.buttons === 2);
  };

  const handleGlobalMouseDown = (e: any, x: number, y: number) => {
      if ((e.target as HTMLElement).closest('.rotate-handle')) return;
      if (activeTool === 'select' && !selection && !isDraggingSelection) selectionStartRef.current = { x, y };
      handleMouseDown(e, x, y);
  };

  const handleGlobalMouseEnter = (e: any, x: number, y: number) => {
      if (activeTool === 'select' && isDrawing && selectionStartRef.current) {
          const startX = selectionStartRef.current.x, startY = selectionStartRef.current.y;
          setSelectionBox({ x: Math.min(startX, x), y: Math.min(startY, y), w: Math.abs(x - startX) + 1, h: Math.abs(y - startY) + 1 });
      } else if (isDrawing && ['line', 'rect', 'circle'].includes(activeTool)) {
          const pg = createEmptyGrid();
          const color = e.buttons === 2 ? secondaryColor : primaryColor;
          if (activeTool === 'line') drawLine(pg, dragStart.x, dragStart.y, x, y, color, brushSize);
          else if (activeTool === 'rect') drawRect(pg, dragStart.x, dragStart.y, x, y, color, brushSize, drawMode);
          else if (activeTool === 'circle') drawCircle(pg, dragStart.x, dragStart.y, x, y, color, brushSize, drawMode);
          setPreviewGrid(pg);
      } else handleMouseEnter(e, x, y);
  };

  const handleMouseUp = () => {
    if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
        if (isDrawing && previewGrid) {
            setGrid(prev => {
                const newGrid = prev.map(row => [...row]);
                for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) if (previewGrid[y][x]) newGrid[y][x] = previewGrid[y][x];
                return newGrid;
            });
        }
        setPreviewGrid(null);
    }
    if (activeTool === 'select' || activeTool === 'magicWand') {
        setIsDraggingSelection(false); setIsRotatingSelection(false);
        if (activeTool === 'select' && isDrawing && selectionBox) {
            const floating = Array(selectionBox.h).fill(null).map(() => Array(selectionBox.w).fill(''));
            let hasPx = false; const newGrid = grid.map(row => [...row]);
            for(let y=0; y<selectionBox.h; y++) for(let x=0; x<selectionBox.w; x++) {
                const gx = selectionBox.x + x, gy = selectionBox.y + y, color = grid[gy][gx];
                if (color) { floating[y][x] = color; newGrid[gy][gx] = ''; hasPx = true; }
            }
            if (hasPx) { setGrid(newGrid); setSelection({ x: selectionBox.x, y: selectionBox.y, w: selectionBox.w, h: selectionBox.h, floatingPixels: floating, angle: 0 }); }
            setSelectionBox(null); selectionStartRef.current = null;
        }
    }
    setIsDrawing(false);
  };

  const handlePixelAction = useCallback((x: number, y: number, isRightClick: boolean = false) => {
    setGrid((prevGrid) => {
      if (activeTool === 'fill') return performFloodFill(x, y, isRightClick ? secondaryColor : primaryColor, prevGrid);
      const newGrid = prevGrid.map((row) => [...row]);
      const targetColor = activeTool === 'eraser' ? '' : (isRightClick ? secondaryColor : primaryColor);
      if (brushSize === 1) newGrid[y][x] = targetColor;
      else getBrushPixels(x, y, brushSize).forEach(p => { if (newGrid[p.y] && newGrid[p.y][p.x] !== undefined) newGrid[p.y][p.x] = targetColor; });
      return newGrid;
    });
  }, [activeTool, primaryColor, secondaryColor, setGrid, brushSize]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [activeTool, isDraggingSelection, isDrawing, selectionBox, grid, previewGrid]);

  const getCellContent = (x: number, y: number) => {
      if (previewGrid && previewGrid[y][x]) return { color: previewGrid[y][x], type: 'preview' };
      if (fgGrid && fgGrid[y][x]) return { color: fgGrid[y][x], type: 'fg' };
      if (grid[y][x]) return { color: grid[y][x], type: 'active' };
      if (bgGrid && bgGrid[y][x]) return { color: bgGrid[y][x], type: 'bg' };
      if (onionSkinNext && onionSkinNext[y][x]) return { color: onionSkinNext[y][x], type: 'onionNext' };
      if (onionSkinPrev && onionSkinPrev[y][x]) return { color: onionSkinPrev[y][x], type: 'onionPrev' };
      return null;
  };

  return (
    <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="relative shadow-2xl shadow-black/50 border border-gray-800">
        <div className="grid relative" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, width: '640px', height: '640px' }} onContextMenu={(e) => e.preventDefault()}>
            {selectionBox && <div className="absolute border-2 border-brand-400 bg-brand-500/10 pointer-events-none z-20" style={{ left: `${selectionBox.x * 20}px`, top: `${selectionBox.y * 20}px`, width: `${selectionBox.w * 20}px`, height: `${selectionBox.h * 20}px` }} />}
            {selection && (
                <div className="absolute border border-dashed border-white/80 pointer-events-none z-20" style={{ left: `${selection.x * 20}px`, top: `${selection.y * 20}px`, width: `${selection.w * 20}px`, height: `${selection.h * 20}px`, transform: `rotate(${selection.angle}deg)`, transformOrigin: 'center center' }}>
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${selection.w}, 1fr)`, gridTemplateRows: `repeat(${selection.h}, 1fr)` }}>
                        {selection.floatingPixels.map((row, sy) => row.map((color, sx) => <div key={`${sx}-${sy}`} style={{ backgroundColor: color }} className="w-full h-full" />))}
                    </div>
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-gray-500" /><div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-gray-500" /><div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-gray-500" /><div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-gray-500" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-white" />
                    <button className="rotate-handle absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border border-gray-500 shadow-sm flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-gray-100 hover:scale-110 transition-transform z-50" onMouseDown={(e) => { e.stopPropagation(); setIsRotatingSelection(true); }} title="Drag to Rotate"><RotateCw size={12} className="text-gray-800" /></button>
                    {onOpenWizard && <button className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-600 rounded-full border border-brand-400 shadow-lg flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-brand-500 hover:scale-110 transition-all z-50 text-white" onClick={(e) => { e.stopPropagation(); onOpenWizard(); }} title="Auto-Animate Selection"><Film size={14} fill="currentColor" /></button>}
                </div>
            )}
            {Array(GRID_SIZE).fill(0).map((_, y) => Array(GRID_SIZE).fill(0).map((_, x) => {
                const content = getCellContent(x, y);
                let opacity = content?.type === 'onionPrev' || content?.type === 'onionNext' ? 0.3 : (content?.type === 'bg' || content?.type === 'fg' ? 0.6 : 1);
                return (
                    <div key={`${x}-${y}`} onMouseDown={(e) => handleGlobalMouseDown(e, x, y)} onMouseEnter={(e) => handleGlobalMouseEnter(e, x, y)} className={`w-full h-full border-[0.5px] border-gray-800/20 select-none relative ${(x + y) % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}>
                        {content?.color && <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: content.color, opacity }} />}
                        {hotspot.x === x && hotspot.y === y && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ring-1 ring-white shadow-sm shadow-black" /></div>}
                        {pathPivot?.x === x && pathPivot?.y === y && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]"><div className="w-3 h-3 bg-brand-500 rounded-full ring-2 ring-white shadow-lg flex items-center justify-center text-[8px] text-white font-bold">X</div></div>}
                        {pathPoints?.map((p, idx) => p.x === x && p.y === y && (<div key={`path-${idx}`} className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]"><div className="w-3 h-3 bg-purple-500 rounded-full ring-2 ring-white shadow-lg flex items-center justify-center text-[8px] text-white font-bold">{idx + 1}</div></div>))}
                    </div>
                );
            }))}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-mono">{GRID_SIZE}x{GRID_SIZE} Grid | Hotspot: ({hotspot.x}, {hotspot.y}){activeTool === 'select' && " | Drag to move | Click top handle to Rotate"}{activeTool === 'magicWand' && " | Click to select connected area"}</div>
    </div>
  );
};

export default EditorCanvas;
