import React, { useMemo, useCallback } from "react";
import Toolbar from "./components/Toolbar";
import Header from "./components/Header";
import EditorCanvas from "./components/EditorCanvas";
import Timeline from "./components/Timeline";
import RightSidebar from "./components/RightSidebar";
import ProjectManager from "./components/ProjectManager";
import SettingsModal from "./components/SettingsModal";
import AnimationWizard from "./components/AnimationWizard";
import {
  Frame,
  AIAnimationResponse,
  AnimationParams,
} from "./types";
import {
  composeLayers,
  createEmptyGrid,
  createLayer,
} from "./utils/layerUtils";
import {
  generateId,
  toHexColor,
  processImageToGrid,
} from "./utils/imageUtils";
import { calculateAnimationFrames } from "./utils/animationGenerator";
import { generateCurFile } from "./utils/curEncoder";
import { generateAniFile } from "./utils/aniEncoder";
import { generateWindowsInstallerZip } from "./utils/zipEncoder";
import { SavedProject } from "./utils/storage";

import { useEditorState } from "./hooks/useEditorState";
import { useProjectState } from "./hooks/useProjectState";
import { useShortcuts } from "./hooks/useShortcuts";

function App() {
  const {
    activeTool, setActiveTool,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    hotspot, setHotspot,
    isPlaying, setIsPlaying,
    activeTab, setActiveTab,
    isLibraryOpen, setIsLibraryOpen,
    isSettingsOpen, setIsSettingsOpen,
    isWizardOpen, setIsWizardOpen,
    onionSkinEnabled, setOnionSkinEnabled,
    pathPivot, setPathPivot,
    pathPoints, setPathPoints,
    isPickingPivot, setIsPickingPivot,
    isPickingPath, setIsPickingPath,
    settings, saveSettings,
    selection, setSelection,
  } = useEditorState();

  const {
    frames, setFrames,
    undo, redo,
    resetFrames,
    canUndo, canRedo,
    activeFrameIndex, setActiveFrameIndex,
    activeLayerId, setActiveLayerId,
    activeFrame,
    updateActiveLayerGrid,
    addLayer, deleteLayer, toggleLayerVisibility, moveLayer,
    addFrame, duplicateFrame, deleteFrame,
  } = useProjectState();

  useShortcuts({
    undo,
    redo,
    setActiveTool,
    setOnionSkinEnabled,
    setIsPlaying,
  });

  // Derived State
  const compositeGrid = useMemo(
    () => (activeFrame ? composeLayers(activeFrame.layers) : createEmptyGrid()),
    [activeFrame]
  );

  const { backgroundGrid, foregroundGrid, activeLayerGrid } = useMemo(() => {
    if (!activeFrame || !activeFrame.layers)
      return {
        activeLayerGrid: createEmptyGrid(),
        backgroundGrid: createEmptyGrid(),
        foregroundGrid: createEmptyGrid(),
      };
    const activeIndex = activeFrame.layers.findIndex(
        (l) => l.id === activeLayerId
    );
    if (activeIndex === -1)
        return {
            activeLayerGrid: createEmptyGrid(),
            backgroundGrid: createEmptyGrid(),
            foregroundGrid: createEmptyGrid(),
        };
    return {
        activeLayerGrid: activeFrame.layers[activeIndex].grid,
        backgroundGrid: composeLayers(activeFrame.layers.slice(0, activeIndex)),
        foregroundGrid: composeLayers(activeFrame.layers.slice(activeIndex + 1)),
    };
  }, [activeFrame, activeLayerId]);

  const { onionSkinPrev, onionSkinNext } = useMemo(() => {
    if (!onionSkinEnabled || frames.length <= 1)
      return { onionSkinPrev: undefined, onionSkinNext: undefined };
    const prevIdx = (activeFrameIndex - 1 + frames.length) % frames.length;
    const nextIdx = (activeFrameIndex + 1) % frames.length;
    if (prevIdx === activeFrameIndex)
      return { onionSkinPrev: undefined, onionSkinNext: undefined };
    return {
      onionSkinPrev: composeLayers(frames[prevIdx].layers),
      onionSkinNext: composeLayers(frames[nextIdx].layers),
    };
  }, [frames, activeFrameIndex, onionSkinEnabled]);

  const framesWithCompositeGrid = useMemo(() => {
    return frames.map((f) => ({ ...f, grid: composeLayers(f.layers) }));
  }, [frames]);

  // Handlers
  const handleExport = useCallback(() => {
    let blob =
      framesWithCompositeGrid.length > 1
        ? generateAniFile(framesWithCompositeGrid, hotspot, "MyCursor")
        : generateCurFile(compositeGrid, hotspot);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download =
      framesWithCompositeGrid.length > 1 ? "cursor_animated.ani" : "cursor.cur";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [framesWithCompositeGrid, hotspot, compositeGrid]);

  const handleExportInstaller = useCallback(async () => {
    let blob =
      framesWithCompositeGrid.length > 1
        ? generateAniFile(framesWithCompositeGrid, hotspot, "MyCursor")
        : generateCurFile(compositeGrid, hotspot);
    const zipBlob = await generateWindowsInstallerZip(
      blob,
      "MyCursor",
      framesWithCompositeGrid.length > 1 ? "ani" : "cur"
    );
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.download = "MyCursor_Installer.zip";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [framesWithCompositeGrid, hotspot, compositeGrid]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const newGrid = processImageToGrid(img);
        const newLayer = createLayer(`Imported Image`, newGrid);
        setFrames((prev) => {
          if (!prev[activeFrameIndex]) return prev;
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
  }, [activeFrameIndex, setFrames, setActiveLayerId]);

  const handleApplyGeneratedImage = useCallback((base64Image: string) => {
    const img = new Image();
    img.onload = () => {
      const newGrid = processImageToGrid(img);
      const newLayer = createLayer(`AI Generated`, newGrid);
      setFrames((prev) => {
        if (!prev[activeFrameIndex]) return prev;
        const newFrames = [...prev];
        const frame = { ...newFrames[activeFrameIndex] };
        frame.layers = [...frame.layers, newLayer];
        newFrames[activeFrameIndex] = frame;
        return newFrames;
      });
      setActiveLayerId(newLayer.id);
      setActiveTab("layers");
    };
    img.src = base64Image;
  }, [activeFrameIndex, setFrames, setActiveLayerId, setActiveTab]);

  const handleAIAddFrames = useCallback((base64Image: string) => {
    const img = new Image();
    img.onload = () => {
      const frameCount = Math.floor(img.naturalWidth / 32);
      const newFrames: Frame[] = [];
      for (let i = 0; i < frameCount; i++) {
        const newLayer = createLayer(
          "Layer 1",
          processImageToGrid(img, i * 32, 0, 32, 32)
        );
        newFrames.push({ id: generateId(), layers: [newLayer], duration: 100 });
      }
      setFrames((prev) => [...prev, ...newFrames]);
    };
    img.src = base64Image;
  }, [setFrames]);

  const handleAIStructuredData = useCallback((data: AIAnimationResponse) => {
    if (data.metadata.hotspot) setHotspot(data.metadata.hotspot);
    const newFrames: Frame[] = data.frames.map((aiFrame) => {
      const subjectGrid = createEmptyGrid(),
        effectGrid = createEmptyGrid(),
        uiGrid = createEmptyGrid();
      aiFrame.dots.forEach((dot) => {
        if (dot.x >= 0 && dot.x < 32 && dot.y >= 0 && dot.y < 32) {
          const color = toHexColor(dot.color, dot.opacity);
          if (dot.type === "subject") subjectGrid[dot.y][dot.x] = color;
          else if (dot.type === "effect") effectGrid[dot.y][dot.x] = color;
          else uiGrid[dot.y][dot.x] = color;
        }
      });
      const layers = [
        createLayer("AI Effects", effectGrid),
        createLayer("AI Subject", subjectGrid),
      ];
      if (uiGrid.some((row) => row.some((c) => c !== "")))
        layers.push(createLayer("AI UI/Overlay", uiGrid));
      return {
        id: generateId(),
        layers,
        duration: data.metadata.fps
          ? Math.floor(1000 / data.metadata.fps)
          : 100,
      };
    });
    setFrames(newFrames);
    setActiveFrameIndex(0);
    setActiveTab("layers");
    if (newFrames.length > 0 && newFrames[0].layers.length > 1)
      setActiveLayerId(newFrames[0].layers[1].id);
  }, [setHotspot, setFrames, setActiveFrameIndex, setActiveTab, setActiveLayerId]);

  const handleLoadProject = useCallback((project: SavedProject) => {
    resetFrames(project.data.frames);
    setHotspot(project.data.hotspot);
    setPrimaryColor(project.data.primaryColor);
    setSecondaryColor(project.data.secondaryColor);
    setActiveFrameIndex(0);
    if (project.data.frames.length > 0)
      setActiveLayerId(project.data.frames[0].layers[0].id);
  }, [resetFrames, setHotspot, setPrimaryColor, setSecondaryColor, setActiveFrameIndex, setActiveLayerId]);

  const handleLoadPreset = useCallback((presetFrames: Frame[]) => {
    const newFrames = presetFrames.map((f) => ({
      ...f,
      id: generateId(),
      layers: f.layers.map((l) => ({ ...l, id: generateId() })),
    }));
    resetFrames(newFrames);
    setActiveFrameIndex(0);
    setActiveLayerId(newFrames[0].layers[0].id);
  }, [resetFrames, setActiveFrameIndex, setActiveLayerId]);

  const handleGenerateAnimation = useCallback((params: AnimationParams) => {
    if (!selection) return;
    const newFrames = calculateAnimationFrames(
      frames,
      activeFrameIndex,
      activeLayerId,
      selection,
      params,
      settings,
      pathPivot
    );
    setFrames(newFrames);
    setSelection(null);
    setIsWizardOpen(false);
    setPathPivot(undefined);
    setPathPoints([]);
    setIsPickingPivot(false);
    setIsPickingPath(false);
  }, [selection, frames, activeFrameIndex, activeLayerId, settings, pathPivot, setFrames, setSelection, setIsWizardOpen, setPathPivot, setPathPoints, setIsPickingPivot, setIsPickingPath]);

  const rotateSelection = useCallback(() => {
    if (!selection) return;
    setSelection({ ...selection, angle: (selection.angle || 0) + 90 });
  }, [selection, setSelection]);

  const handleTransform = useCallback((type: "flipH" | "flipV" | "rotate") => {
    if (selection) {
      if (type === "rotate") rotateSelection();
      return;
    }
    updateActiveLayerGrid((grid) => {
      const size = 32;
      const newGrid = createEmptyGrid();
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let nx = x,
            ny = y;
          if (type === "flipH") nx = size - 1 - x;
          if (type === "flipV") ny = size - 1 - y;
          if (type === "rotate") {
            nx = size - 1 - y;
            ny = x;
          }
          newGrid[ny][nx] = grid[y][x];
        }
      }
      return newGrid;
    });
  }, [selection, rotateSelection, updateActiveLayerGrid]);

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
        <Header
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeTool={activeTool}
        />
        <EditorCanvas
          grid={activeLayerGrid}
          setGrid={updateActiveLayerGrid}
          activeTool={activeTool}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          hotspot={hotspot}
          setHotspot={setHotspot}
          setPrimaryColor={setPrimaryColor}
          bgGrid={backgroundGrid}
          fgGrid={foregroundGrid}
          onionSkinPrev={onionSkinPrev}
          onionSkinNext={onionSkinNext}
          selection={selection}
          setSelection={setSelection}
          onRotateSelection={rotateSelection}
          onOpenWizard={() => setIsWizardOpen(true)}
          pathPivot={pathPivot}
          pathPoints={pathPoints}
          onSetPathPivot={setPathPivot}
          onAddPathPoint={(p) => setPathPoints([...pathPoints, p])}
          isPickingPivot={isPickingPivot}
          isPickingPath={isPickingPath}
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
      <RightSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        primaryColor={primaryColor}
        setPrimaryColor={setPrimaryColor}
        secondaryColor={secondaryColor}
        setSecondaryColor={setSecondaryColor}
        framesWithCompositeGrid={framesWithCompositeGrid}
        hotspot={hotspot}
        setHotspot={setHotspot}
        compositeGrid={compositeGrid}
        handleAIAddFrames={handleAIAddFrames}
        handleApplyGeneratedImage={handleApplyGeneratedImage}
        handleAIStructuredData={handleAIStructuredData}
        activeFrame={activeFrame}
        activeLayerId={activeLayerId}
        setActiveLayerId={setActiveLayerId}
        addLayer={addLayer}
        toggleLayerVisibility={toggleLayerVisibility}
        deleteLayer={deleteLayer}
        moveLayer={moveLayer}
      />
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
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />
      <AnimationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        settings={settings}
        onGenerate={handleGenerateAnimation}
        selection={selection}
        isPickingPivot={isPickingPivot}
        setIsPickingPivot={setIsPickingPivot}
        isPickingPath={isPickingPath}
        setIsPickingPath={setIsPickingPath}
        pathPivot={pathPivot}
        pathPoints={pathPoints}
        setPathPoints={setPathPoints}
      />
    </div>
  );
}

export default App;
