import React, { useMemo, useCallback } from "react";
import Toolbar from "./components/Toolbar";
import Header from "./components/Header";
import FeatureBar from "./components/FeatureBar";
import EditorCanvas from "./components/EditorCanvas";
import Timeline from "./components/Timeline";
import RightSidebar from "./components/RightSidebar";
import ProjectManager from "./components/ProjectManager";
import SettingsModal from "./components/SettingsModal";
import AnimationWizard from "./components/AnimationWizard";
import ImageCropModal from "./components/ImageCropModal";
import { Frame, AnimationParams } from "./types";
import { createLayer, createEmptyGrid, composeLayers, adjustOpacity } from "./utils/layerUtils";
import { generateId, processImageToGrid } from "./utils/imageUtils";
import { calculateAnimationFrames } from "./utils/animationGenerator";
import { SavedProject } from "./utils/storage";

import { useShortcuts } from "./hooks/useShortcuts";
import { useAIWorkflow } from "./hooks/useAIWorkflow";
import { useProjectExport } from "./hooks/useProjectExport";
import { ProjectProvider, useProject } from "./contexts/ProjectContext";
import { EditorProvider, useEditor } from "./contexts/EditorContext";

function AppInner() {
  const {
    activeTool, setActiveTool, setPrimaryColor, setSecondaryColor,
    isLibraryOpen, setIsLibraryOpen, setIsSettingsOpen, setIsWizardOpen, 
    onionSkinEnabled, setOnionSkinEnabled, onionSkinOpacity, onionSkinRange,
    customPivot, setCustomPivot, setPathPoints, setIsPickingCustomPivot, setIsPickingPath,
    settings, selection, setSelection
  } = useEditor();

  const {
    frames, setFrames, resetFrames, activeFrameIndex, setActiveFrameIndex, 
    activeLayerId, setActiveLayerId,
    setHotspot, role, setRole, undo, redo, canUndo, canRedo,
    updateActiveLayerGrid,
  } = useProject();

  const [pendingCrop, setPendingCrop] = React.useState<{ src: string, mode: 'layer' | 'frame' } | null>(null);

  const { handleAIAddFrames, handleApplyGeneratedImage, handleAIStructuredData } = useAIWorkflow();
  const { handleExport, handleExportInstaller } = useProjectExport();

  const handleTransform = useCallback((type: "flipH" | "flipV" | "rotate") => {
    if (selection) {
      if (type === "rotate") {
        setSelection({ ...selection, angle: (selection.angle || 0) + 90 });
      } else if (type === "flipH") {
        const flipped = selection.floatingPixels.map(row => [...row].reverse());
        setSelection({ ...selection, floatingPixels: flipped });
      } else if (type === "flipV") {
        const flipped = [...selection.floatingPixels].reverse().map(row => [...row]);
        setSelection({ ...selection, floatingPixels: flipped });
      }
      return;
    }
    updateActiveLayerGrid((grid) => {
      const size = 32;
      const newGrid = createEmptyGrid();
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let nx = x, ny = y;
          if (type === "flipH") nx = size - 1 - x;
          else if (type === "flipV") ny = size - 1 - y;
          else if (type === "rotate") {
            nx = size - 1 - y;
            ny = x;
          }
          newGrid[ny][nx] = grid[y][x];
        }
      }
      return newGrid;
    });
  }, [selection, setSelection, updateActiveLayerGrid]);

  useShortcuts({ undo, redo, activeTool, setActiveTool, setOnionSkinEnabled, setIsPlaying: () => {}, onTransform: handleTransform });

  const { onionSkinPrev, onionSkinNext } = useMemo(() => {
    if (!onionSkinEnabled || frames.length <= 1) return { onionSkinPrev: undefined, onionSkinNext: undefined };
    
    const mergeOnionGrids = (direction: 'prev' | 'next') => {
        const composite = createEmptyGrid();
        for (let i = 1; i <= onionSkinRange; i++) {
            const idx = direction === 'prev' 
                ? (activeFrameIndex - i + frames.length) % frames.length
                : (activeFrameIndex + i) % frames.length;
            
            if (idx === activeFrameIndex) break;
            if (!frames[idx]) continue;
            
            const frameGrid = composeLayers(frames[idx].layers);
            const decay = Math.pow(0.5, i - 1); 
            const finalAlpha = onionSkinOpacity * decay;

            frameGrid.forEach((row, y) => row.forEach((color, x) => {
                if (color && !composite[y][x]) {
                    composite[y][x] = adjustOpacity(color, finalAlpha);
                }
            }));
        }
        return composite;
    };

    return {
      onionSkinPrev: mergeOnionGrids('prev'),
      onionSkinNext: mergeOnionGrids('next'),
    };
  }, [frames, activeFrameIndex, onionSkinEnabled, onionSkinOpacity, onionSkinRange]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPendingCrop({ src: e.target.result as string, mode: 'layer' });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImportAsFrame = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPendingCrop({ src: e.target.result as string, mode: 'frame' });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirmCrop = useCallback((crop: { x: number, y: number, size: number }) => {
    if (!pendingCrop) return;
    const img = new Image();
    img.onload = () => {
      const newGrid = processImageToGrid(img, crop.x, crop.y, crop.size, crop.size);
      const mode = pendingCrop.mode;
      
      if (mode === 'layer') {
        const newLayer = createLayer(`Imported`, newGrid);
        setFrames((prev) => {
          const newFrames = [...prev];
          if (!newFrames[activeFrameIndex]) return prev;
          newFrames[activeFrameIndex] = { 
            ...newFrames[activeFrameIndex], 
            layers: [...newFrames[activeFrameIndex].layers, newLayer] 
          };
          return newFrames;
        });
        // We delay this slightly to ensure the layer exists in the state if there's any sync check
        setTimeout(() => setActiveLayerId(newLayer.id), 0);
      } else {
        const newLayer = createLayer(`Layer 1`, newGrid);
        const newFrame: Frame = { id: generateId(), layers: [newLayer], duration: 100 };
        setFrames((prev) => [...prev, newFrame]);
        // Same for frame index
        setTimeout(() => {
            setActiveFrameIndex(frames.length);
            setActiveLayerId(newLayer.id);
        }, 0);
      }
      setPendingCrop(null);
    };
    img.src = pendingCrop.src;
  }, [pendingCrop, activeFrameIndex, setFrames, setActiveLayerId, setActiveFrameIndex, frames.length]);

  const handleLoadProject = useCallback((project: SavedProject) => {
    resetFrames(project.data.frames);
    setHotspot(project.data.hotspot);
    setRole(project.role);
    setPrimaryColor(project.data.primaryColor);
    setSecondaryColor(project.data.secondaryColor);
    setActiveFrameIndex(0);
    if (project.data.frames.length > 0) setActiveLayerId(project.data.frames[0].layers[0].id);
  }, [resetFrames, setHotspot, setRole, setPrimaryColor, setSecondaryColor, setActiveFrameIndex, setActiveLayerId]);

  const handleLoadPreset = useCallback((presetFrames: Frame[]) => {
    const newFrames = presetFrames.map((f) => ({ ...f, id: generateId(), layers: f.layers.map((l) => ({ ...l, id: generateId() })) }));
    resetFrames(newFrames);
    setActiveFrameIndex(0);
    setActiveLayerId(newFrames[0].layers[0].id);
  }, [resetFrames, setActiveFrameIndex, setActiveLayerId]);

  const handleGenerateAnimation = useCallback((params: AnimationParams) => {
    if (!selection) return;
    const newFrames = calculateAnimationFrames(frames, activeFrameIndex, activeLayerId, selection, params, settings, customPivot);
    setFrames(newFrames);
    setSelection(null);
    setIsWizardOpen(false);
    setCustomPivot(undefined);
    setPathPoints([]);
    setIsPickingCustomPivot(false);
    setIsPickingPath(false);
  }, [selection, frames, activeFrameIndex, activeLayerId, settings, customPivot, setFrames, setSelection, setIsWizardOpen, setCustomPivot, setPathPoints, setIsPickingCustomPivot, setIsPickingPath]);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <FeatureBar onExport={handleExport} onExportInstaller={handleExportInstaller} onImport={handleImport} onImportAsFrame={handleImportAsFrame} onTransform={handleTransform} />
        <EditorCanvas onionSkinPrev={onionSkinPrev} onionSkinNext={onionSkinNext} onRotateSelection={() => {}} onOpenWizard={() => setIsWizardOpen(true)} />
        <Timeline />
      </div>
      <RightSidebar handleAIAddFrames={handleAIAddFrames} handleApplyGeneratedImage={handleApplyGeneratedImage} handleAIStructuredData={handleAIStructuredData} />
      <ProjectManager isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} onLoadProject={handleLoadProject} onLoadPreset={handleLoadPreset} />
      <SettingsModal />
      <AnimationWizard onGenerate={handleGenerateAnimation} />
      {pendingCrop && (
        <ImageCropModal 
          imageSrc={pendingCrop.src} 
          onConfirm={handleConfirmCrop} 
          onCancel={() => setPendingCrop(null)} 
        />
      )}
    </div>
  );
}

const App: React.FC = () => (
  <EditorProvider><ProjectProvider><AppInner /></ProjectProvider></EditorProvider>
);

export default App;
