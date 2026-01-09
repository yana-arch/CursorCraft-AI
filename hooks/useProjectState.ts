import { useState, useMemo, useCallback, useEffect } from 'react';
import { Frame, Layer, GridData } from '../types';
import { useHistory } from './useHistory';
import { createLayer, createEmptyGrid } from '../utils/layerUtils';
import { generateId } from '../utils/imageUtils';

export const useProjectState = () => {
    const initialLayer = createLayer('Layer 1');
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

    const activeFrame = frames[activeFrameIndex] || frames[0];

    useEffect(() => {
        if (!activeFrame || !activeFrame.layers) return;
        const layerExists = activeFrame.layers.find((l) => l.id === activeLayerId);
        if (!layerExists && activeFrame.layers.length > 0) {
            setActiveLayerId(activeFrame.layers[activeFrame.layers.length - 1].id);
        }
    }, [activeFrameIndex, frames, activeFrame, activeLayerId]);

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
                if (typeof newGridOrUpdater === 'function')
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

    const addLayer = useCallback(() => {
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
    }, [activeFrameIndex, setFrames]);

    const deleteLayer = useCallback((id: string) => {
        setFrames((prev) => {
            if (!prev[activeFrameIndex]) return prev;
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            if (!frame.layers || frame.layers.length <= 1) return prev;
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
            if (!frame.layers) return prev;
            frame.layers = frame.layers.map((l) =>
                l.id === id ? { ...l, visible: !l.visible } : l
            );
            newFrames[activeFrameIndex] = frame;
            return newFrames;
        });
    }, [activeFrameIndex, setFrames]);

    const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
        setFrames((prev) => {
            if (!prev[activeFrameIndex]) return prev;
            const newFrames = [...prev];
            const frame = { ...newFrames[activeFrameIndex] };
            if (!frame.layers) return prev;
            const idx = frame.layers.findIndex((l) => l.id === id);
            if (idx === -1) return prev;
            const newLayers = [...frame.layers];
            if (direction === 'up' && idx < newLayers.length - 1)
                [newLayers[idx], newLayers[idx + 1]] = [
                    newLayers[idx + 1],
                    newLayers[idx],
                ];
            else if (direction === 'down' && idx > 0)
                [newLayers[idx], newLayers[idx - 1]] = [
                    newLayers[idx - 1],
                    newLayers[idx],
                ];
            frame.layers = newLayers;
            newFrames[activeFrameIndex] = frame;
            return newFrames;
        });
    }, [activeFrameIndex, setFrames]);

    const addFrame = useCallback(() => {
        const newLayer = createLayer('Layer 1');
        const newFrameId = generateId();
        setFrames((prev) => [
            ...prev,
            { id: newFrameId, layers: [newLayer], duration: 100 },
        ]);
        setActiveFrameIndex(frames.length);
        setActiveLayerId(newLayer.id);
    }, [frames.length, setFrames]);

    const duplicateFrame = useCallback((index: number) => {
        setFrames((prev) => {
            const sourceFrame = prev[index];
            if (!sourceFrame) return prev;
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
            const newFrames = [...prev];
            newFrames.splice(index + 1, 0, newFrame);
            return newFrames;
        });
        setActiveFrameIndex(index + 1);
    }, [setFrames]);

    const deleteFrame = useCallback((index: number) => {
        setFrames((prev) => {
            if (prev.length <= 1) return prev;
            const newFrames = prev.filter((_, i) => i !== index);
            return newFrames;
        });
        setActiveFrameIndex((prevIdx) => {
            if (prevIdx >= frames.length - 1) return Math.max(0, frames.length - 2);
            return prevIdx;
        });
    }, [frames.length, setFrames]);

    return {
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
    };
};
