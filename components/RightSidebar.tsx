import React from 'react';
import ColorPalette from './ColorPalette';
import PreviewPanel from './PreviewPanel';
import AIAssistant from './AIAssistant';
import LayersPanel from './LayersPanel';
import { AIAnimationResponse } from '../types';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';

interface RightSidebarProps {
    handleAIAddFrames: (base64: string) => void;
    handleApplyGeneratedImage: (base64: string) => void;
    handleAIStructuredData: (data: AIAnimationResponse) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
    handleAIAddFrames,
    handleApplyGeneratedImage,
    handleAIStructuredData,
}) => {
    const { activeTab, setActiveTab } = useEditor();
    const { activeLayerGrid } = useProject();

    return (
        <div className="w-72 bg-gray-850 border-l border-gray-750 flex flex-col z-10 shrink-0">
            <div className="flex border-b border-gray-750">
                <button
                    onClick={() => setActiveTab("properties")}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === "properties" ? "text-brand-400 border-b-2 border-brand-500 bg-gray-800" : "text-gray-500 hover:text-gray-300"}`}
                >
                    Properties
                </button>
                <button
                    onClick={() => setActiveTab("layers")}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === "layers" ? "text-brand-400 border-b-2 border-brand-500 bg-gray-800" : "text-gray-500 hover:text-gray-300"}`}
                >
                    Layers
                </button>
            </div>
            {activeTab === "properties" ? (
                <>
                    <ColorPalette />
                    <PreviewPanel />
                    <AIAssistant
                        currentGrid={activeLayerGrid}
                        onAddFrames={handleAIAddFrames}
                        onApplyImage={handleApplyGeneratedImage}
                        onApplyStructuredAI={handleAIStructuredData}
                    />

                </>
            ) : (
                <LayersPanel />
            )}
        </div>
    );
};

export default RightSidebar;
