import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Trash2, Clock, Monitor, Download, Package, Search } from 'lucide-react';
import { SavedProject, getSavedProjects, saveProject, deleteProject } from '../utils/storage.ts';
import { PRESETS } from '../utils/presets.ts';
import { CURSOR_ROLES, CursorRole } from '../utils/cursorRoles';
import { generateCursorPackageZip } from '../utils/packageExporter';
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
    const { frames: currentFrames, hotspot: currentHotspot, role: currentRole, setRole } = useProject();
    const [activeTab, setActiveTab] = useState<'save' | 'load' | 'presets' | 'package'>('save');
    const [projectName, setProjectName] = useState('');
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    const [packageName, setPackageName] = useState('MyCursorPackage');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            const projects = getSavedProjects();
            setSavedProjects(projects);
        }
    }, [isOpen, activeTab]);

    // Filter logic
    const filteredProjects = savedProjects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.role && project.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredPresets = PRESETS.filter(preset =>
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = () => {
        if (!projectName.trim()) return;
        saveProject(projectName, currentFrames, currentHotspot, primaryColor, secondaryColor, currentRole);
        setProjectName('');
        setActiveTab('load'); // Switch to load tab to see result
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(id);
            setSavedProjects(getSavedProjects());
            const newSelected = new Set(selectedProjectIds);
            newSelected.delete(id);
            setSelectedProjectIds(newSelected);
        }
    };

    const toggleProjectSelection = (id: string) => {
        const newSelected = new Set(selectedProjectIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedProjectIds(newSelected);
    };

    const handleExportPackage = async () => {
        const selectedProjects = savedProjects.filter(p => selectedProjectIds.has(p.id));
        if (selectedProjects.length === 0) return;

        try {
            const blob = await generateCursorPackageZip(selectedProjects, packageName);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${packageName}.zip`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export package", error);
            alert("Failed to export package");
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
                <div className="flex border-b border-gray-800 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('save')}
                        className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors ${activeTab === 'save' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Save Current
                    </button>
                    <button
                        onClick={() => setActiveTab('load')}
                        className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors ${activeTab === 'load' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('package')}
                        className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors ${activeTab === 'package' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Create Package
                    </button>
                    <button
                        onClick={() => setActiveTab('presets')}
                        className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors ${activeTab === 'presets' ? 'text-brand-400 border-b-2 border-brand-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Presets
                    </button>
                </div>

                {/* Search Bar (visible for all tabs except 'save'?) */}
                {activeTab !== 'save' && (
                    <div className="px-6 pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${activeTab === 'presets' ? 'presets' : 'projects'}...`}
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-[300px]">
                    
                    {activeTab === 'save' && (
                        <div className="space-y-4">
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Project Name</label>
                                    <input 
                                        type="text" 
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="e.g. Neon Sword Cursor"
                                        className="w-full bg-gray-950 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Cursor Type (Role)</label>
                                    <select 
                                        value={currentRole || ''}
                                        onChange={(e) => setRole(e.target.value as CursorRole || undefined)}
                                        className="w-full bg-gray-950 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        <option value="">None (Generic)</option>
                                        {CURSOR_ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">Assigning a role helps when exporting as a cursor package.</p>
                                </div>

                                <button 
                                    onClick={handleSave}
                                    disabled={!projectName.trim()}
                                    className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-colors"
                                >
                                    <Save size={18} />
                                    <span>Save Project</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'load' && (
                        <div className="space-y-2">
                            {filteredProjects.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    {searchQuery ? 'No results found.' : 'No saved projects found.'}
                                </div>
                            ) : (
                                filteredProjects.map((project) => (
                                    <div 
                                        key={project.id}
                                        onClick={() => { onLoadProject(project); onClose(); }}
                                        className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-4 flex items-center justify-between cursor-pointer group transition-all"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center border border-gray-600">
                                                 <Monitor size={16} className="text-gray-500" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-200">{project.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center space-x-1">
                                                    <Clock size={10} />
                                                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{project.data.frames.length} Frame(s)</span>
                                                    {project.role && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-brand-400 font-medium">{project.role}</span>
                                                        </>
                                                    )}
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

                    {activeTab === 'package' && (
                        <div className="space-y-4">
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Package Name</label>
                                <div className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        value={packageName}
                                        onChange={(e) => setPackageName(e.target.value)}
                                        placeholder="My Custom Package"
                                        className="flex-1 bg-gray-950 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleExportPackage}
                                        disabled={selectedProjectIds.size === 0}
                                        className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center space-x-2"
                                    >
                                        <Download size={18} />
                                        <span>Export ({selectedProjectIds.size})</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase">Select Cursors to Include</p>
                                {filteredProjects.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10 border border-dashed border-gray-700 rounded-lg">
                                        {searchQuery ? 'No results found.' : 'Save some cursors first to create a package.'}
                                    </div>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <div 
                                            key={project.id}
                                            onClick={() => toggleProjectSelection(project.id)}
                                            className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all ${
                                                selectedProjectIds.has(project.id) 
                                                ? 'bg-brand-900/20 border-brand-500/50' 
                                                : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                    selectedProjectIds.has(project.id) 
                                                    ? 'bg-brand-500 border-brand-400' 
                                                    : 'bg-gray-950 border-gray-600'
                                                }`}>
                                                    {selectedProjectIds.has(project.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-200">{project.name}</div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {project.role || 'No Role'} • {project.data.frames.length} frames
                                                    </div>
                                                </div>
                                            </div>
                                            {project.role ? (
                                                <div className="px-2 py-0.5 bg-gray-900 rounded text-[10px] text-brand-400 font-bold border border-gray-700">
                                                    {project.role}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-red-400 italic">No Role set</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'presets' && (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredPresets.length === 0 ? (
                                <div className="col-span-2 text-center text-gray-500 py-10">No presets found.</div>
                            ) : (
                                filteredPresets.map((preset) => (
                                    <div 
                                        key={preset.id}
                                        onClick={() => { onLoadPreset(preset.frames); onClose(); }}
                                        className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 cursor-pointer transition-all flex items-center space-x-3"
                                    >
                                    <div className="w-12 h-12 bg-black/40 rounded flex items-center justify-center border border-gray-600">
                                         <Monitor size={20} className="text-brand-500" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-200">{preset.name}</div>
                                        <div className="text-xs text-gray-500">{preset.category}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;
