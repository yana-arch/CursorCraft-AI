import React, { useMemo, useCallback } from "react";
import Toolbar from "./components/Toolbar";
import Header from "./components/Header";
import EditorCanvas from "./components/EditorCanvas";
import Timeline from "./components/Timeline";
import RightSidebar from "./components/RightSidebar";
import ProjectManager from "./components/ProjectManager";
import SettingsModal from "./components/SettingsModal";
import AnimationWizard from "./components/AnimationWizard";
import { Frame, AnimationParams } from "./types";
import { composeLayers, createLayer } from "./utils/layerUtils";
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
    setActiveTool, setPrimaryColor, setSecondaryColor,
    isLibraryOpen, setIsLibraryOpen, setIsWizardOpen, onionSkinEnabled, setOnionSkinEnabled,
    setPathPivot, setPathPoints, setIsPickingPivot, setIsPickingPath,
    settings, selection, setSelection, pathPivot
  } = useEditor();

  const {
    frames, setFrames, resetFrames, activeFrameIndex, setActiveFrameIndex, 
    activeLayerId, setActiveLayerId,
    setHotspot, undo, redo, canUndo, canRedo
  } = useProject();

  const { handleAIAddFrames, handleApplyGeneratedImage, handleAIStructuredData } = useAIWorkflow();
  const { handleExport, handleExportInstaller } = useProjectExport();

  useShortcuts({ undo, redo, setActiveTool, setOnionSkinEnabled, setIsPlaying: () => {} });

  const { onionSkinPrev, onionSkinNext } = useMemo(() => {
    if (!onionSkinEnabled || frames.length <= 1) return { onionSkinPrev: undefined, onionSkinNext: undefined };
    const prevIdx = (activeFrameIndex - 1 + frames.length) % frames.length;
    const nextIdx = (activeFrameIndex + 1) % frames.length;
    return {
      onionSkinPrev: composeLayers(frames[prevIdx].layers),
      onionSkinNext: composeLayers(frames[nextIdx].layers),
    };
  }, [frames, activeFrameIndex, onionSkinEnabled]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const newLayer = createLayer(`Imported Image`, processImageToGrid(img));
        setFrames((prev) => {
          if (!prev[activeFrameIndex]) return prev;
          const newFrames = [...prev];
          newFrames[activeFrameIndex] = { ...newFrames[activeFrameIndex], layers: [...newFrames[activeFrameIndex].layers, newLayer] };
          return newFrames;
        });
        setActiveLayerId(newLayer.id);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [activeFrameIndex, setFrames, setActiveLayerId]);

  const handleLoadProject = useCallback((project: SavedProject) => {
    resetFrames(project.data.frames);
    setHotspot(project.data.hotspot);
    setPrimaryColor(project.data.primaryColor);
    setSecondaryColor(project.data.secondaryColor);
    setActiveFrameIndex(0);
    if (project.data.frames.length > 0) setActiveLayerId(project.data.frames[0].layers[0].id);
  }, [resetFrames, setHotspot, setPrimaryColor, setSecondaryColor, setActiveFrameIndex, setActiveLayerId]);

  const handleLoadPreset = useCallback((presetFrames: Frame[]) => {
    const newFrames = presetFrames.map((f) => ({ ...f, id: generateId(), layers: f.layers.map((l) => ({ ...l, id: generateId() })) }));
    resetFrames(newFrames);
    setActiveFrameIndex(0);
    setActiveLayerId(newFrames[0].layers[0].id);
  }, [resetFrames, setActiveFrameIndex, setActiveLayerId]);

  const handleGenerateAnimation = useCallback((params: AnimationParams) => {
    if (!selection) return;
    const newFrames = calculateAnimationFrames(frames, activeFrameIndex, activeLayerId, selection, params, settings, pathPivot);
    setFrames(newFrames);
    setSelection(null);
    setIsWizardOpen(false);
    setPathPivot(undefined);
    setPathPoints([]);
    setIsPickingPivot(false);
    setIsPickingPath(false);
  }, [selection, frames, activeFrameIndex, settings, pathPivot, setFrames, setSelection, setIsWizardOpen, setPathPivot, setPathPoints, setIsPickingPivot, setIsPickingPath]);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <Toolbar onExport={handleExport} onExportInstaller={handleExportInstaller} onImport={handleImport} onTransform={() => {}} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <EditorCanvas onionSkinPrev={onionSkinPrev} onionSkinNext={onionSkinNext} onRotateSelection={() => {}} onOpenWizard={() => setIsWizardOpen(true)} />
        <Timeline />
      </div>
      <RightSidebar handleAIAddFrames={handleAIAddFrames} handleApplyGeneratedImage={handleApplyGeneratedImage} handleAIStructuredData={handleAIStructuredData} />
      <ProjectManager isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} onLoadProject={handleLoadProject} onLoadPreset={handleLoadPreset} />
      <SettingsModal />
      <AnimationWizard onGenerate={handleGenerateAnimation} />
    </div>
  );
}

const App: React.FC = () => (
  <EditorProvider><ProjectProvider><AppInner /></ProjectProvider></EditorProvider>
);

export default App;
