import React from 'react';
import ColorPalette from './ColorPalette';
import PreviewPanel from './PreviewPanel';
import AIAssistant from './AIAssistant';
import LayersPanel from './LayersPanel';
import { Frame, AIAnimationResponse, Point, GridData } from '../types';

interface RightSidebarProps {
    activeTab: 'properties' | 'layers';
    setActiveTab: (tab: 'properties' | 'layers') => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    secondaryColor: string;
    setSecondaryColor: (color: string) => void;
    framesWithCompositeGrid: (Frame & { grid: GridData })[];
    hotspot: Point;
    setHotspot: (p: Point) => void;
    compositeGrid: GridData;
    handleAIAddFrames: (base64: string) => void;
    handleApplyGeneratedImage: (base64: string) => void;
    handleAIStructuredData: (data: AIAnimationResponse) => void;
    activeFrame: Frame;
    activeLayerId: string;
    setActiveLayerId: (id: string) => void;
    addLayer: () => void;
    toggleLayerVisibility: (id: string) => void;
    updateLayerOpacity: (id: string, opacity: number) => void;
    deleteLayer: (id: string) => void;
    moveLayer: (id: string, direction: 'up' | 'down') => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
    activeTab, setActiveTab,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    framesWithCompositeGrid,
    hotspot, setHotspot,
    compositeGrid,
    handleAIAddFrames,
    handleApplyGeneratedImage,
    handleAIStructuredData,
    activeFrame,
    activeLayerId, setActiveLayerId,
    addLayer,
    toggleLayerVisibility,
    updateLayerOpacity,
    deleteLayer,
    moveLayer,
}) => {
    return (
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
                    addLayer={addLayer}
                    toggleLayerVisibility={toggleLayerVisibility}
                    updateLayerOpacity={updateLayerOpacity}
                    deleteLayer={deleteLayer}
                    moveLayer={moveLayer}
                />
            )}
        </div>
    );
};

export default RightSidebar;
