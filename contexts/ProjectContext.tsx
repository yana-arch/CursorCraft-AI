import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { Frame, GridData, Point } from '../types';
import { useHistory } from '../hooks/useHistory';
import { createLayer } from '../utils/layerUtils';
import { generateId } from '../utils/imageUtils';

interface ProjectContextType {
    frames: Frame[];
    setFrames: (f: Frame[] | ((prev: Frame[]) => Frame[])) => void;
    activeFrameIndex: number;
    setActiveFrameIndex: (i: number) => void;
    activeLayerId: string;
    setActiveLayerId: (id: string) => void;
    activeFrame: Frame;
    activeLayerGrid: GridData;
    backgroundGrid: GridData;
    foregroundGrid: GridData;
    hotspot: Point;
    setHotspot: (p: Point) => void;
    
    // Actions
    updateActiveLayerGrid: (newGridOrUpdater: GridData | ((prev: GridData) => GridData)) => void;
    addLayer: () => void;
    deleteLayer: (id: string) => void;
    toggleLayerVisibility: (id: string) => void;
    updateLayerOpacity: (id: string, opacity: number) => void;
    moveLayer: (id: string, direction: 'up' | 'down') => void;
    addFrame: () => void;
    duplicateFrame: (index: number) => void;
    deleteFrame: (index: number) => void;
    resetFrames: (f: Frame[]) => void;

    // History
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Helper from layerUtils (re-implementing here to avoid circular dependency if any, 
// though we usually import from utils)
import { composeLayers, createEmptyGrid } from '../utils/layerUtils';

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const initialLayer = useMemo(() => createLayer('Layer 1'), []);
    const initialFrame: Frame = useMemo(() => ({
        id: generateId(),
        layers: [initialLayer],
        duration: 100,
    }), [initialLayer]);

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
    const [hotspot, setHotspot] = useState<Point>({ x: 0, y: 0 });

    const activeFrame = frames[activeFrameIndex] || frames[0];

    useEffect(() => {
        if (!activeFrame || !activeFrame.layers) return;
        const layerExists = activeFrame.layers.find((l) => l.id === activeLayerId);
        if (!layerExists && activeFrame.layers.length > 0) {
            setActiveLayerId(activeFrame.layers[activeFrame.layers.length - 1].id);
        }
    }, [activeFrameIndex, frames, activeFrame, activeLayerId]);

    // Computed Grids
    const { backgroundGrid, foregroundGrid, activeLayerGrid } = useMemo(() => {
        if (!activeFrame || !activeFrame.layers)
            return { activeLayerGrid: createEmptyGrid(), backgroundGrid: createEmptyGrid(), foregroundGrid: createEmptyGrid() };
        
        const activeIndex = activeFrame.layers.findIndex((l) => l.id === activeLayerId);
        if (activeIndex === -1)
            return { activeLayerGrid: createEmptyGrid(), backgroundGrid: createEmptyGrid(), foregroundGrid: createEmptyGrid() };

        return {
            activeLayerGrid: activeFrame.layers[activeIndex].grid,
            backgroundGrid: composeLayers(activeFrame.layers.slice(0, activeIndex)),
            foregroundGrid: composeLayers(activeFrame.layers.slice(activeIndex + 1)),
        };
    }, [activeFrame, activeLayerId]);

    const updateActiveLayerGrid = useCallback((newGridOrUpdater: GridData | ((prev: GridData) => GridData)) => {
        setFrames((prevFrames) => {
            if (!prevFrames[activeFrameIndex]) return prevFrames;
            const newFrames = [...prevFrames];
            const currentFrame = { ...newFrames[activeFrameIndex] };
            const layerIndex = currentFrame.layers.findIndex((l) => l.id === activeLayerId);
            if (layerIndex === -1) return prevFrames;

            const currentLayer = { ...currentFrame.layers[layerIndex] };
            if (typeof newGridOrUpdater === 'function')
                currentLayer.grid = newGridOrUpdater(currentLayer.grid);
            else currentLayer.grid = newGridOrUpdater;

            currentFrame.layers = [...currentFrame.layers];
            currentFrame.layers[layerIndex] = currentLayer;
            newFrames[activeFrameIndex] = currentFrame;
            return newFrames;
        });
    }, [activeFrameIndex, activeLayerId, setFrames]);

    const addLayer = useCallback(() => {
        setFrames((prev) => {
            if (!prev[activeFrameIndex]) return prev;
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            const newLayer = createLayer(`Layer ${frame.layers.length + 1}`);
            frame.layers = [...frame.layers, newLayer];
            newFrames[activeFrameIndex] = frame;
            setActiveLayerId(newLayer.id);
            return newFrames;
        });
    }, [activeFrameIndex, setFrames]);

    const deleteLayer = useCallback((id: string) => {
        setFrames((prev) => {
            if (!prev[activeFrameIndex]) return prev;
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            if (frame.layers.length <= 1) return prev;
            frame.layers = frame.layers.filter((l) => l.id !== id);
            newFrames[activeFrameIndex] = frame;
            return newFrames;
        });
    }, [activeFrameIndex, setFrames]);

    const toggleLayerVisibility = useCallback((id: string) => {
        setFrames((prev) => {
            if (!prev[activeFrameIndex]) return prev;
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            frame.layers = frame.layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l);
            newFrames[activeFrameIndex] = frame;
            return newFrames;
        });
    }, [activeFrameIndex, setFrames]);

    const updateLayerOpacity = useCallback((id: string, opacity: number) => {
        setFrames((prev) => {
            if (!prev[activeFrameIndex]) return prev;
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            frame.layers = frame.layers.map((l) => l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l);
            newFrames[activeFrameIndex] = frame;
            return newFrames;
        });
    }, [activeFrameIndex, setFrames]);

    const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
        setFrames((prev) => {
            if (!prev[activeFrameIndex]) return prev;
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            const idx = frame.layers.findIndex((l) => l.id === id);
            if (idx === -1) return prev;
            const newLayers = [...frame.layers];
            if (direction === 'up' && idx < newLayers.length - 1)
                [newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]];
            else if (direction === 'down' && idx > 0)
                [newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]];
            frame.layers = newLayers;
            newFrames[activeFrameIndex] = frame;
            return newFrames;
        });
    }, [activeFrameIndex, setFrames]);

    const addFrame = useCallback(() => {
        const newLayer = createLayer('Layer 1');
        const newFrameId = generateId();
        setFrames((prev) => [...prev, { id: newFrameId, layers: [newLayer], duration: 100 }]);
        setActiveFrameIndex(frames.length);
        setActiveLayerId(newLayer.id);
    }, [frames.length, setFrames]);

    const duplicateFrame = useCallback((index: number) => {
        setFrames((prev) => {
            const sourceFrame = prev[index];
            if (!sourceFrame) return prev;
            const newLayers = sourceFrame.layers.map((l) => ({
                ...l, id: generateId(), grid: l.grid.map((row) => [...row]),
            }));
            const newFrame = { id: generateId(), layers: newLayers, duration: sourceFrame.duration };
            const newFrames = [...prev];
            newFrames.splice(index + 1, 0, newFrame);
            return newFrames;
        });
        setActiveFrameIndex(index + 1);
    }, [setFrames]);

    const deleteFrame = useCallback((index: number) => {
        setFrames((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== index);
        });
        setActiveFrameIndex((prevIdx) => prevIdx >= frames.length - 1 ? Math.max(0, frames.length - 2) : prevIdx);
    }, [frames.length, setFrames]);

    const value = {
        frames, setFrames, activeFrameIndex, setActiveFrameIndex, activeLayerId, setActiveLayerId,
        activeFrame, activeLayerGrid, backgroundGrid, foregroundGrid,
        hotspot, setHotspot,
        updateActiveLayerGrid, addLayer, deleteLayer, toggleLayerVisibility, updateLayerOpacity, moveLayer,
        addFrame, duplicateFrame, deleteFrame, resetFrames,
        undo, redo, canUndo, canRedo
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error('useProject must be used within a ProjectProvider');
    return context;
};
