import { useCallback } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';
import { createLayer, createEmptyGrid } from '../utils/layerUtils';
import { generateId, processImageToGrid } from '../utils/imageUtils';
import { convertAIToFrames } from '../utils/aiUtils';
import { AIAnimationResponse, Frame } from '../types';

export const useAIWorkflow = () => {
    const { setHotspot, setFrames, setActiveFrameIndex, setActiveLayerId } = useProject();
    const { activeFrameIndex, setActiveTab } = useEditor();

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
                const newLayer = createLayer("Layer 1", processImageToGrid(img, i * 32, 0, 32, 32));
                newFrames.push({ id: generateId(), layers: [newLayer], duration: 100 });
            }
            setFrames((prev) => [...prev, ...newFrames]);
        };
        img.src = base64Image;
    }, [setFrames]);

    const handleAIStructuredData = useCallback((data: AIAnimationResponse) => {
        if (data.metadata.hotspot) setHotspot(data.metadata.hotspot);
        const newFrames = convertAIToFrames(data);
        setFrames(newFrames);
        setActiveFrameIndex(0);
        setActiveTab("layers");
        if (newFrames.length > 0 && newFrames[0].layers.length > 0) {
            const subjectLayer = newFrames[0].layers.find(l => l.name === 'AI Subject') || newFrames[0].layers[0];
            setActiveLayerId(subjectLayer.id);
        }
    }, [setHotspot, setFrames, setActiveFrameIndex, setActiveTab, setActiveLayerId]);

    return {
        handleApplyGeneratedImage,
        handleAIAddFrames,
        handleAIStructuredData
    };
};
