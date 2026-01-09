import React, { useState, useEffect, useMemo, useCallback } from "react";
import Toolbar from "./components/Toolbar";
import EditorCanvas from "./components/EditorCanvas";
import PreviewPanel from "./components/PreviewPanel";
import ColorPalette from "./components/ColorPalette";
import AIAssistant from "./components/AIAssistant";
import Timeline from "./components/Timeline";
import LayersPanel from "./components/LayersPanel";
import ProjectManager from "./components/ProjectManager";
import SettingsModal from "./components/SettingsModal";
import AnimationWizard from "./components/AnimationWizard";
import {
  GridData,
  ToolType,
  Point,
  Frame,
  Layer,
  AIAnimationResponse,
  SelectionState,
  AnimationSettings,
  AnimationParams,
} from "./types";
import {
  createLayer,
  composeLayers,
  createEmptyGrid,
  rotatePixelsNN,
  scalePixelsNN,
  adjustOpacity,
  shiftHue,
  getEasingValue,
  GRID_SIZE,
} from "./utils/layerUtils";
import { generateCurFile } from "./utils/curEncoder";
import { generateAniFile } from "./utils/aniEncoder";
import { generateWindowsInstallerZip } from "./utils/zipEncoder";
import { SavedProject } from "./utils/storage";
import { useHistory } from "./hooks/useHistory";
import { Undo, Redo, Settings as SettingsIcon } from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);

const toHexColor = (hex: string, opacity: number): string => {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const alpha = Math.round(opacity * 255);
  const alphaHex = alpha.toString(16).padStart(2, "0");
  return `#${cleanHex}${alphaHex}`;
};

function App() {
  const initialLayer = createLayer("Layer 1");
  const initialFrame: Frame = {
    id: generateId(),
    layers: [initialLayer],
    duration: 100,
  };

  const {
    state: frames,
    set: setFrames,
    undo,
    redo,
    reset: resetFrames,
    canUndo,
    canRedo,
  } = useHistory<Frame[]>([initialFrame]);

  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [activeLayerId, setActiveLayerId] = useState<string>(initialLayer.id);
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#000000");
  const [hotspot, setHotspot] = useState<Point>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"properties" | "layers">(
    "properties"
  );
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);

  // Path Deform State
  const [pathPivot, setPathPivot] = useState<Point | undefined>(undefined);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [isPickingPivot, setIsPickingPivot] = useState(false);
  const [isPickingPath, setIsPickingPath] = useState(false);

  const [settings, setSettings] = useState<AnimationSettings>(() => {
    const saved = localStorage.getItem("cursorcraft_settings");
    return saved
      ? JSON.parse(saved)
      : {
          defaultMode: "append",
          defaultFramesCount: 8,
          copyBackground: true,
        };
  });

  const saveSettings = (newSettings: AnimationSettings) => {
    setSettings(newSettings);
    localStorage.setItem("cursorcraft_settings", JSON.stringify(newSettings));
  };

  const [selection, setSelection] = useState<SelectionState | null>(null);
  const activeFrame = frames[activeFrameIndex] || frames[0];

  useEffect(() => {
    if (!activeFrame || !activeFrame.layers) return;
    const layerExists = activeFrame.layers.find((l) => l.id === activeLayerId);
    if (!layerExists && activeFrame.layers.length > 0) {
      setActiveLayerId(activeFrame.layers[activeFrame.layers.length - 1].id);
    }
  }, [activeFrameIndex, frames, activeFrame, activeLayerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key === "y") {
          e.preventDefault();
          redo();
        }
        return;
      }
      switch (e.key.toLowerCase()) {
        case "s":
          setActiveTool("select");
          break;
        case "w":
          setActiveTool("magicWand");
          break;
        case "p":
          setActiveTool("pen");
          break;
        case "e":
          setActiveTool("eraser");
          break;
        case "f":
          setActiveTool("fill");
          break;
        case "i":
          setActiveTool("picker");
          break;
        case "h":
          setActiveTool("hotspot");
          break;
        case "o":
          setOnionSkinEnabled((prev) => !prev);
          break;
        case " ":
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const compositeGrid = useMemo(
    () => (activeFrame ? composeLayers(activeFrame.layers) : createEmptyGrid()),
    [activeFrame]
  );

  const { activeLayerGrid, backgroundGrid, foregroundGrid } = useMemo(() => {
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

  const updateActiveLayerGrid = useCallback(
    (newGridOrUpdater: GridData | ((prev: GridData) => GridData)) => {
      setFrames((prevFrames) => {
        if (!prevFrames[activeFrameIndex]) return prevFrames;
        const newFrames = [...prevFrames];
        const currentFrame = { ...newFrames[activeFrameIndex] };
        if (!currentFrame.layers) return prevFrames;
        const layerIndex = currentFrame.layers.findIndex(
          (l) => l.id === activeLayerId
        );
        if (layerIndex === -1) return prevFrames;
        const currentLayer = { ...currentFrame.layers[layerIndex] };
        if (typeof newGridOrUpdater === "function")
          currentLayer.grid = newGridOrUpdater(currentLayer.grid);
        else currentLayer.grid = newGridOrUpdater;
        currentFrame.layers = [...currentFrame.layers];
        currentFrame.layers[layerIndex] = currentLayer;
        newFrames[activeFrameIndex] = currentFrame;
        return newFrames;
      });
    },
    [activeFrameIndex, activeLayerId, setFrames]
  );

  const handleAddLayer = () => {
    setFrames((prev) => {
      if (!prev[activeFrameIndex]) return prev;
      const newFrames = [...prev];
      const frame = { ...newFrames[activeFrameIndex] };
      if (!frame.layers) return prev;
      const newLayer = createLayer(`Layer ${frame.layers.length + 1}`);
      frame.layers = [...frame.layers, newLayer];
      newFrames[activeFrameIndex] = frame;
      setActiveLayerId(newLayer.id);
      return newFrames;
    });
  };

  const deleteLayer = (id: string) => {
    setFrames((prev) => {
      if (!prev[activeFrameIndex]) return prev;
      const newFrames = [...prev];
      const frame = { ...newFrames[activeFrameIndex] };
      if (!frame.layers || frame.layers.length <= 1) return prev;
      frame.layers = frame.layers.filter((l) => l.id !== id);
      newFrames[activeFrameIndex] = frame;
      return newFrames;
    });
  };

  const toggleLayerVisibility = (id: string) => {
    setFrames((prev) => {
      if (!prev[activeFrameIndex]) return prev;
      const newFrames = [...prev];
      const frame = { ...newFrames[activeFrameIndex] };
      if (!frame.layers) return prev;
      frame.layers = frame.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      );
      newFrames[activeFrameIndex] = frame;
      return newFrames;
    });
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    setFrames((prev) => {
      if (!prev[activeFrameIndex]) return prev;
      const newFrames = [...prev];
      const frame = { ...newFrames[activeFrameIndex] };
      if (!frame.layers) return prev;
      const idx = frame.layers.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const newLayers = [...frame.layers];
      if (direction === "up" && idx < newLayers.length - 1)
        [newLayers[idx], newLayers[idx + 1]] = [
          newLayers[idx + 1],
          newLayers[idx],
        ];
      else if (direction === "down" && idx > 0)
        [newLayers[idx], newLayers[idx - 1]] = [
          newLayers[idx - 1],
          newLayers[idx],
        ];
      frame.layers = newLayers;
      newFrames[activeFrameIndex] = frame;
      return newFrames;
    });
  };

  const rotateSelection = useCallback(() => {
    if (!selection) return;
    setSelection({ ...selection, angle: (selection.angle || 0) + 90 });
  }, [selection]);

  const handleTransform = (type: "flipH" | "flipV" | "rotate") => {
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
  };

  const addFrame = () => {
    const newLayer = createLayer("Layer 1");
    const newFrameId = generateId();
    setFrames((prev) => [
      ...prev,
      { id: newFrameId, layers: [newLayer], duration: 100 },
    ]);
    setActiveFrameIndex(frames.length);
    setActiveLayerId(newLayer.id);
  };

  const duplicateFrame = (index: number) => {
    const sourceFrame = frames[index];
    if (!sourceFrame) return;
    const newLayers = sourceFrame.layers.map((l) => ({
      ...l,
      id: generateId(),
      grid: l.grid.map((row) => [...row]),
    }));
    const newFrame = {
      id: generateId(),
      layers: newLayers,
      duration: sourceFrame.duration,
    };
    setFrames((prev) => {
      const newFrames = [...prev];
      newFrames.splice(index + 1, 0, newFrame);
      return newFrames;
    });
    setActiveFrameIndex(index + 1);
    setActiveLayerId(newLayers[newLayers.length - 1].id);
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    setFrames((prev) => prev.filter((_, i) => i !== index));
    if (activeFrameIndex >= frames.length - 1)
      setActiveFrameIndex(Math.max(0, frames.length - 2));
  };

  const handleExport = () => {
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
  };

  const handleExportInstaller = async () => {
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
  };

  const processImageToGrid = (
    img: HTMLImageElement,
    sourceX = 0,
    sourceY = 0,
    width = 32,
    height = 32
  ): GridData => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
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
          const hex =
            "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          const alphaHex = a.toString(16).padStart(2, "0");
          newGrid[y][x] = hex + alphaHex;
        } else {
          newGrid[y][x] = "";
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
  };

  const handleApplyGeneratedImage = (base64Image: string) => {
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
  };

  const handleAIAddFrames = (base64Image: string) => {
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
  };

  const handleAIStructuredData = (data: AIAnimationResponse) => {
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
  };

  const handleLoadProject = (project: SavedProject) => {
    resetFrames(project.data.frames);
    setHotspot(project.data.hotspot);
    setPrimaryColor(project.data.primaryColor);
    setSecondaryColor(project.data.secondaryColor);
    setActiveFrameIndex(0);
    if (project.data.frames.length > 0)
      setActiveLayerId(project.data.frames[0].layers[0].id);
  };

  const handleLoadPreset = (presetFrames: Frame[]) => {
    const newFrames = presetFrames.map((f) => ({
      ...f,
      id: generateId(),
      layers: f.layers.map((l) => ({ ...l, id: generateId() })),
    }));
    resetFrames(newFrames);
    setActiveFrameIndex(0);
    setActiveLayerId(newFrames[0].layers[0].id);
  };

  const handleGenerateAnimation = (params: AnimationParams) => {
    if (!selection) return;
    const {
      framesCount,
      stepX,
      stepY,
      stepAngle,
      stepScale,
      stepOpacity,
      stepHue,
      easing,
      enableSway,
      swayAngle,
      swayPeriod,
      swayPivot,
      swayRigidArea,
      enablePathDeform,
      pathPoints,
    } = params;
    const { defaultMode, copyBackground } = settings;

    setFrames((prevFrames) => {
      if (!prevFrames[activeFrameIndex]) return prevFrames;
      let newFrames = [...prevFrames];
      const sourceFrame = prevFrames[activeFrameIndex];
      if (!sourceFrame.layers) return prevFrames;
      const layerIndex = sourceFrame.layers.findIndex(
        (l) => l.id === activeLayerId
      );
      if (layerIndex === -1) return prevFrames;

      const createTransformedLayer = (step: number) => {
        const t = step / (framesCount - 1);
        const easedT = getEasingValue(t, easing);
        let currentAngle =
          selection.angle + stepAngle * easedT * (framesCount - 1);
        let currentX = selection.x + stepX * easedT * (framesCount - 1),
          currentY = selection.y + stepY * easedT * (framesCount - 1);
        let currentScale = Math.pow(stepScale, easedT * (framesCount - 1)),
          currentOpacity = Math.pow(stepOpacity, easedT * (framesCount - 1));
        let currentHue = stepHue * easedT * (framesCount - 1);

        if (enableSway)
          currentAngle +=
            swayAngle * Math.sin((2 * Math.PI * step) / swayPeriod);

        let pixelsToMerge = selection.floatingPixels;
        if (Math.abs(currentScale - 1) > 0.01)
          pixelsToMerge = scalePixelsNN(pixelsToMerge, currentScale);

        let pivot = undefined;
        if (enableSway) {
          switch (swayPivot) {
            case "left":
              pivot = { x: 0, y: selection.h / 2 };
              break;
            case "right":
              pivot = { x: selection.w - 1, y: selection.h / 2 };
              break;
            case "top":
              pivot = { x: selection.w / 2, y: 0 };
              break;
            case "bottom":
              pivot = { x: selection.w / 2, y: selection.h - 1 };
              break;
            case "center":
              pivot = { x: selection.w / 2, y: selection.h / 2 };
              break;
            case "top-left":
              pivot = { x: 0, y: 0 };
              break;
            case "top-right":
              pivot = { x: selection.w - 1, y: 0 };
              break;
            case "bottom-left":
              pivot = { x: 0, y: selection.h - 1 };
              break;
            case "bottom-right":
              pivot = { x: selection.w - 1, y: selection.h - 1 };
              break;
          }
        }

        if (enablePathDeform && pathPivot && pathPoints.length > 0) {
          const targetPoint = pathPoints[Math.min(step, pathPoints.length - 1)];
          const dx = targetPoint.x - pathPivot.x,
            dy = targetPoint.y - pathPivot.y;
          currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          pivot = {
            x: pathPivot.x - selection.x,
            y: pathPivot.y - selection.y,
          };
        }

        if (
          Math.abs(currentAngle % 360) > 0.1 ||
          enableSway ||
          enablePathDeform
        )
          pixelsToMerge = rotatePixelsNN(pixelsToMerge, currentAngle, pivot);

        let finalX = currentX,
          finalY = currentY;
        const newH = pixelsToMerge.length,
          newW = pixelsToMerge[0].length;

        if ((enableSway || enablePathDeform) && pivot) {
          const rad = (currentAngle * Math.PI) / 180,
            cos = Math.cos(rad),
            sin = Math.sin(rad);
          const corners = [
            { x: 0, y: 0 },
            { x: selection.w - 1, y: 0 },
            { x: 0, y: selection.h - 1 },
            { x: selection.w - 1, y: selection.h - 1 },
          ];
          const rotatedCorners = corners.map((p) => {
            const dx = p.x - pivot.x,
              dy = p.y - pivot.y;
            return {
              x: pivot.x + dx * cos - dy * sin,
              y: pivot.y + dx * sin + dy * cos,
            };
          });
          const minX = Math.min(...rotatedCorners.map((p) => p.x)),
            minY = Math.min(...rotatedCorners.map((p) => p.y));
          finalX -= pivot.x - minX;
          finalY -= pivot.y - minY;
          finalX += pivot.x;
          finalY += pivot.y;
        } else {
          finalX -= (newW - selection.w) / 2;
          finalY -= (newH - selection.h) / 2;
        }

        const newGrid = sourceFrame.layers[layerIndex].grid.map((row) => [
          ...row,
        ]);
        for (let y = 0; y < newH; y++) {
          for (let x = 0; x < newW; x++) {
            const gx = Math.round(finalX) + x,
              gy = Math.round(finalY) + y;
            if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
              let color = pixelsToMerge[y][x];
              if (color) {
                if (Math.abs(currentHue % 360) > 0.1)
                  color = shiftHue(color, currentHue);
                if (currentOpacity < 0.99)
                  color = adjustOpacity(color, currentOpacity);
                newGrid[gy][gx] = color;
              }
            }
          }
        }
        if (enableSway && swayRigidArea > 0 && pivot) {
          for (let sy = 0; sy < selection.h; sy++) {
            for (let sx = 0; sx < selection.w; sx++) {
              const dist = Math.sqrt(
                Math.pow(sx - pivot.x, 2) + Math.pow(sy - pivot.y, 2)
              );
              if (dist <= swayRigidArea) {
                const gx = Math.round(selection.x + sx),
                  gy = Math.round(selection.y + sy);
                if (
                  selection.floatingPixels[sy][sx] &&
                  gx >= 0 &&
                  gx < GRID_SIZE &&
                  gy >= 0 &&
                  gy < GRID_SIZE
                )
                  newGrid[gy][gx] = selection.floatingPixels[sy][sx];
              }
            }
          }
        }
        return createLayer(sourceFrame.layers[layerIndex].name, newGrid);
      };

      const bakeInto = (idx: number, step: number) => {
        const layer = createTransformedLayer(step);
        const frame = { ...newFrames[idx] };
        frame.layers = [...frame.layers];
        if (layerIndex < frame.layers.length) frame.layers[layerIndex] = layer;
        else frame.layers.push(layer);
        newFrames[idx] = frame;
      };

      bakeInto(activeFrameIndex, 0);
      if (defaultMode === "append") {
        const generated = [];
        for (let i = 1; i < framesCount; i++) {
          const layer = createTransformedLayer(i);
          const layers = copyBackground
            ? sourceFrame.layers.map((l, idx) =>
                idx === layerIndex
                  ? layer
                  : {
                      ...l,
                      id: generateId(),
                      grid: l.grid.map((row) => [...row]),
                    }
              )
            : [layer];
          generated.push({
            id: generateId(),
            layers,
            duration: sourceFrame.duration,
          });
        }
        newFrames.splice(activeFrameIndex + 1, 0, ...generated);
      } else {
        for (let i = 1; i < framesCount; i++) {
          if (activeFrameIndex + i < newFrames.length)
            bakeInto(activeFrameIndex + i, i);
          else {
            const layer = createTransformedLayer(i);
            const layers = copyBackground
              ? sourceFrame.layers.map((l, idx) =>
                  idx === layerIndex
                    ? layer
                    : {
                        ...l,
                        id: generateId(),
                        grid: l.grid.map((row) => [...row]),
                      }
                )
              : [layer];
            newFrames.push({
              id: generateId(),
              layers,
              duration: sourceFrame.duration,
            });
          }
        }
      }
      return newFrames;
    });
    setSelection(null);
    setIsWizardOpen(false);
    setPathPivot(undefined);
    setPathPoints([]);
    setIsPickingPivot(false);
    setIsPickingPath(false);
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
            <h1 className="font-bold text-sm tracking-wide">
              CursorCraft{" "}
              <span className="text-brand-500 text-xs px-1 py-0.5 bg-brand-900/30 rounded">
                BETA
              </span>
            </h1>
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
            <div className="flex items-center space-x-1 border-l border-gray-700 pl-4">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
                title="Settings"
              >
                <SettingsIcon size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-500 border-l border-gray-700 pl-4">
              {activeTool === "select" && "Select (S)"}{" "}
              {activeTool === "magicWand" && "Magic Wand (W)"}{" "}
              {activeTool === "pen" && "Pen (P)"}{" "}
              {activeTool === "eraser" && "Eraser (E)"}{" "}
              {activeTool === "fill" && "Fill (F)"}
            </div>
          </div>
        </header>
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
      <div className="w-72 bg-gray-850 border-l border-gray-750 flex flex-col z-10 shrink-0">
        <div className="flex border-b border-gray-750">
          <button
            onClick={() => setActiveTab("properties")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === "properties"
                ? "text-brand-400 border-b-2 border-brand-500 bg-gray-800"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab("layers")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === "layers"
                ? "text-brand-400 border-b-2 border-brand-500 bg-gray-800"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Layers
          </button>
        </div>
        {activeTab === "properties" ? (
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
            layers={activeFrame?.layers || []}
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
