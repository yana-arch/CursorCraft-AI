import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import EditorCanvas from './components/EditorCanvas';
import PreviewPanel from './components/PreviewPanel';
import ColorPalette from './components/ColorPalette';
import AIAssistant from './components/AIAssistant';
import Timeline from './components/Timeline';
import LayersPanel from './components/LayersPanel';
import ProjectManager from './components/ProjectManager';
import { GridData, ToolType, Point, Frame, Layer, AIAnimationResponse, SelectionState } from './types';
import { createLayer, composeLayers, createEmptyGrid, GRID_SIZE } from './utils/layerUtils';
import { generateCurFile } from './utils/curEncoder';
import { generateAniFile } from './utils/aniEncoder';
import { generateWindowsInstallerZip } from './utils/zipEncoder';
import { SavedProject } from './utils/storage';
import { useHistory } from './hooks/useHistory';
import { Undo, Redo } from 'lucide-react';

// Simple ID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper: Convert Hex + Opacity to Hex8 or RGBA string
const toHexColor = (hex: string, opacity: number): string => {
    // Ensure 6 digit hex
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    
    // Calculate Alpha
    const alpha = Math.round(opacity * 255);
    const alphaHex = alpha.toString(16).padStart(2, '0');
    
    return `#${cleanHex}${alphaHex}`;
};

function App() {
  // --- History Management for Frames ---
  const initialLayer = createLayer("Layer 1");
  const initialFrame: Frame = { 
    id: generateId(), 
    layers: [initialLayer], 
    duration: 100 
  };

  const {
      state: frames,
      set: setFrames,
      undo,
      redo,
      reset: resetFrames,
      canUndo,
      canRedo
  } = useHistory<Frame[]>([initialFrame]);

  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [activeLayerId, setActiveLayerId] = useState<string>(initialLayer.id);

  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#000000');
  const [hotspot, setHotspot] = useState<Point>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);
  
  // Selection State (Lifted from EditorCanvas)
  const [selection, setSelection] = useState<SelectionState | null>(null);

  // Safe access to active frame
  const activeFrame = frames[activeFrameIndex] || frames[0];

  // Sync activeLayerId
  useEffect(() => {
    if (!activeFrame) return;
    const layerExists = activeFrame.layers.find(l => l.id === activeLayerId);
    if (!layerExists && activeFrame.layers.length > 0) {
        setActiveLayerId(activeFrame.layers[activeFrame.layers.length - 1].id);
    }
  }, [activeFrameIndex, frames, activeFrame, activeLayerId]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                redo();
            }
            return;
        }

        switch(e.key.toLowerCase()) {
            case 's': setActiveTool('select'); break;
            case 'w': setActiveTool('magicWand'); break;
            case 'p': setActiveTool('pen'); break;
            case 'e': setActiveTool('eraser'); break;
            case 'f': setActiveTool('fill'); break;
            case 'i': setActiveTool('picker'); break;
            case 'h': setActiveTool('hotspot'); break;
            case 'o': setOnionSkinEnabled(prev => !prev); break;
            case ' ': 
                e.preventDefault();
                setIsPlaying(prev => !prev); 
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);


  const compositeGrid = useMemo(() => activeFrame ? composeLayers(activeFrame.layers) : createEmptyGrid(), [activeFrame]);
  
  // Calculate separated grids for the canvas (Active vs Context)
  const { activeLayerGrid, backgroundGrid, foregroundGrid } = useMemo(() => {
    if (!activeFrame) return { activeLayerGrid: createEmptyGrid(), backgroundGrid: createEmptyGrid(), foregroundGrid: createEmptyGrid() };
    
    const activeIndex = activeFrame.layers.findIndex(l => l.id === activeLayerId);
    if (activeIndex === -1) return { activeLayerGrid: createEmptyGrid(), backgroundGrid: createEmptyGrid(), foregroundGrid: createEmptyGrid() };

    // Layers below (background context)
    const bgLayers = activeFrame.layers.slice(0, activeIndex);
    // Layers above (foreground context)
    const fgLayers = activeFrame.layers.slice(activeIndex + 1);
    
    return {
        activeLayerGrid: activeFrame.layers[activeIndex].grid,
        backgroundGrid: composeLayers(bgLayers),
        foregroundGrid: composeLayers(fgLayers)
    }
  }, [activeFrame, activeLayerId]);

  // Onion Skin Grids
  const { onionSkinPrev, onionSkinNext } = useMemo(() => {
      if (!onionSkinEnabled || frames.length <= 1) return { onionSkinPrev: undefined, onionSkinNext: undefined };
      
      const prevIdx = (activeFrameIndex - 1 + frames.length) % frames.length;
      const nextIdx = (activeFrameIndex + 1) % frames.length;
      
      // We only show if not same as current (e.g. single frame loop)
      if (prevIdx === activeFrameIndex) return { onionSkinPrev: undefined, onionSkinNext: undefined };

      return {
          onionSkinPrev: composeLayers(frames[prevIdx].layers),
          onionSkinNext: composeLayers(frames[nextIdx].layers)
      };

  }, [frames, activeFrameIndex, onionSkinEnabled]);

  const framesWithCompositeGrid = useMemo(() => {
      return frames.map(f => ({
          ...f,
          grid: composeLayers(f.layers)
      }));
  }, [frames]);


  const updateActiveLayerGrid = useCallback((newGridOrUpdater: GridData | ((prev: GridData) => GridData)) => {
      setFrames(prevFrames => {
          const newFrames = [...prevFrames];
          const currentFrame = { ...newFrames[activeFrameIndex] };
          
          const layerIndex = currentFrame.layers.findIndex(l => l.id === activeLayerId);
          if (layerIndex === -1) return prevFrames;

          const currentLayer = { ...currentFrame.layers[layerIndex] };
          
          if (typeof newGridOrUpdater === 'function') {
              currentLayer.grid = newGridOrUpdater(currentLayer.grid);
          } else {
              currentLayer.grid = newGridOrUpdater;
          }
          
          currentFrame.layers = [...currentFrame.layers];
          currentFrame.layers[layerIndex] = currentLayer;
          newFrames[activeFrameIndex] = currentFrame;
          
          return newFrames;
      });
  }, [activeFrameIndex, activeLayerId, setFrames]);

  // --- Layer Management ---
  const handleAddLayer = () => {
      const newLayer = createLayer(`Layer ${activeFrame.layers.length + 1}`);
      setFrames(prev => {
          const newFrames = [...prev];
          const frame = { ...newFrames[activeFrameIndex] };
          frame.layers = [...frame.layers, newLayer];
          newFrames[activeFrameIndex] = frame;
          return newFrames;
      });
      setActiveLayerId(newLayer.id);
  };

  const deleteLayer = (id: string) => {
     setFrames(prev => {
         const newFrames = [...prev];
         const frame = { ...newFrames[activeFrameIndex] };
         if (frame.layers.length <= 1) return prev;
         
         frame.layers = frame.layers.filter(l => l.id !== id);
         newFrames[activeFrameIndex] = frame;
         return newFrames;
     });
  };

  const toggleLayerVisibility = (id: string) => {
      setFrames(prev => {
          const newFrames = [...prev];
          const frame = { ...newFrames[activeFrameIndex] };
          frame.layers = frame.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
          newFrames[activeFrameIndex] = frame;
          return newFrames;
      });
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
      setFrames(prev => {
          const newFrames = [...prev];
          const frame = { ...newFrames[activeFrameIndex] };
          const idx = frame.layers.findIndex(l => l.id === id);
          if (idx === -1) return prev;

          const newLayers = [...frame.layers];
          if (direction === 'up' && idx < newLayers.length - 1) {
              [newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]];
          } else if (direction === 'down' && idx > 0) {
              [newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]];
          }
          
          frame.layers = newLayers;
          newFrames[activeFrameIndex] = frame;
          return newFrames;
      });
  };

  const rotateSelection = useCallback(() => {
    if (!selection) return;

    // Rotate the floating pixels 90 deg clockwise
    const oldW = selection.w;
    const oldH = selection.h;
    const newW = oldH;
    const newH = oldW;
    
    const newPixels = Array(newH).fill(null).map(() => Array(newW).fill(''));
    
    for (let y = 0; y < oldH; y++) {
        for (let x = 0; x < oldW; x++) {
            // Clockwise: (x, y) -> (h - 1 - y, x) relative to new grid
            // Destination x = (oldH - 1 - y)
            // Destination y = x
            if (selection.floatingPixels[y][x]) {
                newPixels[x][oldH - 1 - y] = selection.floatingPixels[y][x];
            }
        }
    }

    setSelection({
        ...selection,
        w: newW,
        h: newH,
        floatingPixels: newPixels
    });
  }, [selection]);

  const handleTransform = (type: 'flipH' | 'flipV' | 'rotate') => {
      // If there is an active selection, only transform that selection
      if (selection) {
          if (type === 'rotate') {
              rotateSelection();
          } else {
             // Implement Flip for selection if needed later, currently only rotate requested
             // For now, if user clicks flip, we can either ignore or implement flip on selection
          }
          return;
      }

      // Otherwise transform entire grid
      updateActiveLayerGrid((grid) => {
          const size = 32;
          const newGrid = createEmptyGrid();
          for (let y = 0; y < size; y++) {
              for (let x = 0; x < size; x++) {
                  let nx = x, ny = y;
                  if (type === 'flipH') nx = size - 1 - x;
                  if (type === 'flipV') ny = size - 1 - y;
                  if (type === 'rotate') { nx = size - 1 - y; ny = x; } // 90deg clockwise
                  
                  newGrid[ny][nx] = grid[y][x];
              }
          }
          return newGrid;
      });
  };

  // --- Frame Management ---
  const addFrame = () => {
      const newLayer = createLayer("Layer 1");
      const newFrameId = generateId();
      setFrames(prev => [...prev, { 
          id: newFrameId, 
          layers: [newLayer], 
          duration: 100 
      }]);
      setActiveFrameIndex(frames.length); 
      setActiveLayerId(newLayer.id);
  };

  const duplicateFrame = (index: number) => {
      const sourceFrame = frames[index];
      const newLayers = sourceFrame.layers.map(l => ({
          ...l,
          id: generateId(),
          layers: l.grid.map(row => [...row])
      }));

      const newFrame = {
          id: generateId(),
          layers: newLayers,
          duration: sourceFrame.duration
      };
      
      setFrames(prev => {
          const newFrames = [...prev];
          newFrames.splice(index + 1, 0, newFrame);
          return newFrames;
      });
      setActiveFrameIndex(index + 1);
      setActiveLayerId(newLayers[newLayers.length-1].id);
  };

  const deleteFrame = (index: number) => {
      if (frames.length <= 1) return;
      setFrames(prev => prev.filter((_, i) => i !== index));
      if (activeFrameIndex >= frames.length - 1) {
          setActiveFrameIndex(Math.max(0, frames.length - 2));
      }
  };

  // --- I/O & Load ---
  const handleExport = () => {
      let blob: Blob;
      let filename: string;

      if (framesWithCompositeGrid.length > 1) {
          blob = generateAniFile(framesWithCompositeGrid, hotspot, "MyCursor");
          filename = "cursor_animated.ani";
      } else {
          blob = generateCurFile(compositeGrid, hotspot);
          filename = "cursor.cur";
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleExportInstaller = async () => {
      let blob: Blob;
      let type: 'cur' | 'ani';
      if (framesWithCompositeGrid.length > 1) {
          blob = generateAniFile(framesWithCompositeGrid, hotspot, "MyCursor");
          type = 'ani';
      } else {
          blob = generateCurFile(compositeGrid, hotspot);
          type = 'cur';
      }

      const zipBlob = await generateWindowsInstallerZip(blob, "MyCursor", type);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = "MyCursor_Installer.zip";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
  };

  const processImageToGrid = (img: HTMLImageElement, sourceX = 0, sourceY = 0, width = 32, height = 32): GridData => {
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
                 // Preserve Alpha for hex8
                 const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                 const alphaHex = a.toString(16).padStart(2, '0');
                 newGrid[y][x] = hex + alphaHex;
             } else {
                 newGrid[y][x] = '';
             }
         }
     }
     return newGrid;
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const newGrid = processImageToGrid(img);
            const newLayer = createLayer(`Imported Image`, newGrid);
            setFrames(prev => {
                const newFrames = [...prev];
                const frame = { ...newFrames[activeFrameIndex] };
                frame.layers = [...frame.layers, newLayer];
                newFrames[activeFrameIndex] = frame;
                return newFrames;
            });
            setActiveLayerId(newLayer.id);
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyGeneratedImage = (base64Image: string) => {
    const img = new Image();
    img.onload = () => {
        const newGrid = processImageToGrid(img);
        const newLayer = createLayer(`AI Generated`, newGrid);
        setFrames(prev => {
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            frame.layers = [...frame.layers, newLayer];
            newFrames[activeFrameIndex] = frame;
            return newFrames;
        });
        setActiveLayerId(newLayer.id);
        setActiveTab('layers');
    };
    img.src = base64Image;
  };

  const handleAIAddFrames = (base64Image: string) => {
    const img = new Image();
    img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const frameCount = Math.floor(w / 32);
        const newFrames: Frame[] = [];
        for (let i = 0; i < frameCount; i++) {
            const newLayer = createLayer("Layer 1", processImageToGrid(img, i * 32, 0, 32, 32));
            newFrames.push({
                id: generateId(),
                layers: [newLayer],
                duration: 100
            });
        }
        setFrames(prev => [...prev, ...newFrames]);
    };
    img.src = base64Image;
  };

  // --- NEW: Handle Structured AI Data ---
  const handleAIStructuredData = (data: AIAnimationResponse) => {
      // 1. Set Hotspot
      if (data.metadata.hotspot) {
          setHotspot(data.metadata.hotspot);
      }

      // 2. Parse Frames
      const newFrames: Frame[] = data.frames.map((aiFrame) => {
          const subjectGrid = createEmptyGrid();
          const effectGrid = createEmptyGrid();
          const uiGrid = createEmptyGrid();

          aiFrame.dots.forEach(dot => {
              if (dot.x >= 0 && dot.x < 32 && dot.y >= 0 && dot.y < 32) {
                  const finalColor = toHexColor(dot.color, dot.opacity);
                  if (dot.type === 'subject') {
                      subjectGrid[dot.y][dot.x] = finalColor;
                  } else if (dot.type === 'effect') {
                      effectGrid[dot.y][dot.x] = finalColor;
                  } else {
                      uiGrid[dot.y][dot.x] = finalColor;
                  }
              }
          });

          // Create Layers: Effect (Bottom), Subject (Middle), UI (Top - optional)
          const layers: Layer[] = [];
          
          // Only add layers if they have content to keep things clean, 
          // OR always add 'Effect' and 'Subject' for consistency.
          
          const effectLayer = createLayer("AI Effects", effectGrid);
          layers.push(effectLayer);

          const subjectLayer = createLayer("AI Subject", subjectGrid);
          layers.push(subjectLayer);

          // Check if UI grid has pixels
          const hasUI = uiGrid.some(row => row.some(cell => cell !== ''));
          if (hasUI) {
              layers.push(createLayer("AI UI/Overlay", uiGrid));
          }

          return {
              id: generateId(),
              layers: layers,
              duration: data.metadata.fps ? Math.floor(1000 / data.metadata.fps) : 100
          };
      });

      // Replace frames or append? Let's replace for a fresh start concept.
      setFrames(newFrames);
      setActiveFrameIndex(0);
      setActiveTab('layers'); // Switch to layers tab so user sees the separation
      if (newFrames.length > 0 && newFrames[0].layers.length > 1) {
          // Select Subject by default (usually index 1 if effect is 0)
          setActiveLayerId(newFrames[0].layers[1].id);
      }
  };

  const handleLoadProject = (project: SavedProject) => {
    resetFrames(project.data.frames);
    setHotspot(project.data.hotspot);
    setPrimaryColor(project.data.primaryColor);
    setSecondaryColor(project.data.secondaryColor);
    setActiveFrameIndex(0);
    if (project.data.frames.length > 0 && project.data.frames[0].layers.length > 0) {
        setActiveLayerId(project.data.frames[0].layers[0].id);
    }
  };

  const handleLoadPreset = (presetFrames: Frame[]) => {
      const newFrames = presetFrames.map(f => ({
          ...f,
          id: generateId(),
          layers: f.layers.map(l => ({ ...l, id: generateId() }))
      }));
      resetFrames(newFrames);
      setActiveFrameIndex(0);
      setActiveLayerId(newFrames[0].layers[0].id);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <Toolbar 
        activeTool={activeTool} 
        setTool={setActiveTool} 
        onExport={handleExport}
        onExportInstaller={handleExportInstaller}
        onImport={handleImport}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onionSkinEnabled={onionSkinEnabled}
        toggleOnionSkin={() => setOnionSkinEnabled(!onionSkinEnabled)}
        onTransform={handleTransform}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-gray-800 flex items-center px-4 justify-between bg-gray-850 shrink-0">
           <div className="flex items-center space-x-2">
               <h1 className="font-bold text-sm tracking-wide">CursorCraft <span className="text-brand-500 text-xs px-1 py-0.5 bg-brand-900/30 rounded">BETA</span></h1>
           </div>
           
           <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={undo}
                        disabled={!canUndo}
                        className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded hover:bg-gray-700 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={16} />
                    </button>
                    <button 
                        onClick={redo}
                        disabled={!canRedo}
                        className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded hover:bg-gray-700 transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={16} />
                    </button>
                </div>

               <div className="text-xs text-gray-500 border-l border-gray-700 pl-4">
                   {activeTool === 'select' && 'Select (S)'}
                   {activeTool === 'magicWand' && 'Magic Wand (W)'}
                   {activeTool === 'pen' && 'Pen (P)'}
                   {activeTool === 'eraser' && 'Eraser (E)'}
                   {activeTool === 'fill' && 'Fill (F)'}
               </div>
           </div>
        </header>
        
        <EditorCanvas 
            grid={activeLayerGrid} // Pass ACTIVE layer for editing
            setGrid={updateActiveLayerGrid}
            activeTool={activeTool}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            hotspot={hotspot}
            setHotspot={setHotspot}
            setPrimaryColor={setPrimaryColor}
            // Context props
            bgGrid={backgroundGrid}
            fgGrid={foregroundGrid}
            onionSkinPrev={onionSkinPrev}
            onionSkinNext={onionSkinNext}
            // Selection Logic
            selection={selection}
            setSelection={setSelection}
            onRotateSelection={rotateSelection}
        />

        <Timeline 
            frames={framesWithCompositeGrid}
            activeFrameIndex={activeFrameIndex}
            setActiveFrameIndex={setActiveFrameIndex}
            addFrame={addFrame}
            deleteFrame={deleteFrame}
            duplicateFrame={duplicateFrame}
            isPlaying={isPlaying}
            togglePlay={() => setIsPlaying(!isPlaying)}
        />
      </div>

      <div className="w-72 bg-gray-850 border-l border-gray-750 flex flex-col z-10 shrink-0">
        <div className="flex border-b border-gray-750">
            <button 
                onClick={() => setActiveTab('properties')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'properties' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Properties
            </button>
            <button 
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'layers' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Layers
            </button>
        </div>

        {activeTab === 'properties' ? (
            <>
                <ColorPalette 
                    primaryColor={primaryColor} 
                    setPrimaryColor={setPrimaryColor}
                    secondaryColor={secondaryColor}
                    setSecondaryColor={setSecondaryColor}
                />
                <PreviewPanel frames={framesWithCompositeGrid} hotspot={hotspot} />
                <AIAssistant 
                    currentGrid={compositeGrid} 
                    setHotspot={setHotspot} 
                    onAddFrames={handleAIAddFrames}
                    onApplyImage={handleApplyGeneratedImage}
                    onApplyStructuredAI={handleAIStructuredData} 
                />
            </>
        ) : (
            <LayersPanel 
                layers={activeFrame.layers}
                activeLayerId={activeLayerId}
                setActiveLayerId={setActiveLayerId}
                addLayer={handleAddLayer}
                toggleLayerVisibility={toggleLayerVisibility}
                deleteLayer={deleteLayer}
                moveLayer={moveLayer}
            />
        )}
      </div>

      <ProjectManager 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        currentFrames={frames}
        currentHotspot={hotspot}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onLoadProject={handleLoadProject}
        onLoadPreset={handleLoadPreset}
      />
    </div>
  );
}

export default App;