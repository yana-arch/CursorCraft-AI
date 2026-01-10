import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Trash2, Clock, Monitor } from 'lucide-react';
import { SavedProject, getSavedProjects, saveProject, deleteProject } from '../utils/storage.ts';
import { PRESETS } from '../utils/presets.ts';
import { Frame, Point } from '../types';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';

interface ProjectManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadProject: (project: SavedProject) => void;
    onLoadPreset: (frames: Frame[]) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
    isOpen,
    onClose,
    onLoadProject,
    onLoadPreset
}) => {
    const { primaryColor, secondaryColor } = useEditor();
    const { frames: currentFrames, hotspot: currentHotspot } = useProject();
    const [activeTab, setActiveTab] = useState<'save' | 'load' | 'presets'>('save');
    const [projectName, setProjectName] = useState('');
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSavedProjects(getSavedProjects());
        }
    }, [isOpen, activeTab]);

    const handleSave = () => {
        if (!projectName.trim()) return;
        saveProject(projectName, currentFrames, currentHotspot, primaryColor, secondaryColor);
        setProjectName('');
        setActiveTab('load'); // Switch to load tab to see result
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(id);
            setSavedProjects(getSavedProjects());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <FolderOpen className="text-brand-500" size={20} />
                        <span>Project Manager</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('save')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'save' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Save Current
                    </button>
                    <button
                        onClick={() => setActiveTab('load')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'load' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('presets')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'presets' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Presets Library
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-[300px]">
                    
                    {activeTab === 'save' && (
                        <div className="space-y-4">
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Project Name</label>
                                <div className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="e.g. Neon Sword Cursor"
                                        className="flex-1 bg-gray-950 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleSave}
                                        disabled={!projectName.trim()}
                                        className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2"
                                    >
                                        <Save size={18} />
                                        <span>Save</span>
                                    </button>
                                </div>
                            </div>
                            <div className="text-center text-gray-500 text-sm mt-8">
                                <p>Projects are saved to your browser's local storage.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'load' && (
                        <div className="space-y-2">
                            {savedProjects.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">No saved projects found.</div>
                            ) : (
                                savedProjects.map((project) => (
                                    <div 
                                        key={project.id}
                                        onClick={() => { onLoadProject(project); onClose(); }}
                                        className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-4 flex items-center justify-between cursor-pointer group transition-all"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center border border-gray-600">
                                                 {/* Simple preview of first frame's top layer center pixel color if exists, or just icon */}
                                                 <Monitor size={16} className="text-gray-500" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-200">{project.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center space-x-1">
                                                    <Clock size={10} />
                                                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{project.data.frames.length} Frame(s)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(project.id, e)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'presets' && (
                        <div className="grid grid-cols-2 gap-3">
                            {PRESETS.map((preset) => (
                                <div 
                                    key={preset.id}
                                    onClick={() => { onLoadPreset(preset.frames); onClose(); }}
                                    className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 cursor-pointer transition-all flex items-center space-x-3"
                                >
                                    <div className="w-12 h-12 bg-black/40 rounded flex items-center justify-center border border-gray-600">
                                         {/* We could render a mini canvas here, but for now icon */}
                                         <Monitor size={20} className="text-brand-500" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-200">{preset.name}</div>
                                        <div className="text-xs text-gray-500">{preset.category}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;
