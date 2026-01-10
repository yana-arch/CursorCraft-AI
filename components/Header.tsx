import React from 'react';
import { Undo, Redo, Settings as SettingsIcon } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useEditor } from '../contexts/EditorContext';

const Header: React.FC = () => {
    const { undo, redo, canUndo, canRedo } = useProject();
    const { setIsSettingsOpen, activeTool } = useEditor();

    return (
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
                <div className="text-xs text-gray-500 border-l border-gray-700 pl-4 uppercase font-mono">
                    {activeTool}
                </div>
            </div>
        </header>
    );
};

export default Header;
