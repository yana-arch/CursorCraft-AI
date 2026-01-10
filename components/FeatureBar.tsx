import React, { useRef, useState } from 'react';
import { 
  Upload, Download, Package, FolderOpen, 
  FlipHorizontal, FlipVertical, RotateCw, 
  Layers, ChevronDown, Save, FileUp, Image as ImageIcon,
  PlusSquare
} from 'lucide-react';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';

interface FeatureBarProps {
  onExport: () => void;
  onExportInstaller: () => void;
  onImport: (file: File) => void;
  onImportAsFrame: (file: File) => void;
  onTransform: (type: 'flipH' | 'flipV' | 'rotate') => void;
}

const FeatureBar: React.FC<FeatureBarProps> = ({ 
  onExport, 
  onExportInstaller, 
  onImport, 
  onImportAsFrame,
  onTransform 
}) => {
  const { 
    activeTool, brushSize, setBrushSize, drawMode, setDrawMode,
    onionSkinEnabled, setOnionSkinEnabled,
    onionSkinOpacity, setOnionSkinOpacity,
    onionSkinRange, setOnionSkinRange,
    magicWandTolerance, setMagicWandTolerance,
    setIsLibraryOpen
  } = useEditor();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'layer' | 'frame'>('layer');
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isShapeActive = ['line', 'rect', 'circle'].includes(activeTool);
  const showBrushOptions = isShapeActive || activeTool === 'pen' || activeTool === 'eraser';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (importMode === 'layer') onImport(file);
      else onImportAsFrame(file);
    }
    // Reset input
    e.target.value = '';
  };

  const triggerImport = (mode: 'layer' | 'frame') => {
    setImportMode(mode);
    setIsImportDropdownOpen(false);
    fileInputRef.current?.click();
  };

  return (
    <div className="h-12 bg-gray-850 border-b border-gray-700 flex items-center px-4 justify-between shrink-0 z-20">
      {/* Left: Tool Options */}
      <div className="flex items-center space-x-6">
        {showBrushOptions && (
          <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Size</span>
              <div className="flex items-center space-x-2 bg-gray-900 px-2 py-1 rounded-lg border border-gray-700">
                <input 
                  type="range" min="1" max="5" step="1" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-20 accent-brand-500 bg-gray-700 h-1 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-brand-400 w-3">{brushSize}</span>
              </div>
            </div>

            {isShapeActive && activeTool !== 'line' && (
              <button 
                onClick={() => setDrawMode(drawMode === 'stroke' ? 'fill' : 'stroke')}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors group"
              >
                <span className="text-[10px] font-black text-gray-400 uppercase group-hover:text-white">{drawMode}</span>
                <ChevronDown size={10} className="text-gray-500" />
              </button>
            )}
          </div>
        )}

        {activeTool === 'magicWand' && (
          <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tolerance</span>
            <div className="flex items-center space-x-2 bg-gray-900 px-2 py-1 rounded-lg border border-gray-700">
              <input 
                type="range" min="0" max="100" step="1" 
                value={magicWandTolerance} 
                onChange={(e) => setMagicWandTolerance(parseInt(e.target.value))}
                className="w-24 accent-brand-500 bg-gray-700 h-1 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-brand-400 w-6">{magicWandTolerance}</span>
            </div>
          </div>
        )}

        <div className="h-4 w-px bg-gray-700 mx-2" />

        {/* Transform Group */}
        <div className="flex items-center space-x-1">
          <button onClick={() => onTransform('flipH')} title="Flip Horizontal (H)" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"><FlipHorizontal size={16}/></button>
          <button onClick={() => onTransform('flipV')} title="Flip Vertical (V)" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"><FlipVertical size={16}/></button>
          <button onClick={() => onTransform('rotate')} title="Rotate 90° (R)" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"><RotateCw size={16}/></button>
        </div>
      </div>

      {/* Right: Project Actions */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center group relative">
            <button
                onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
                title="Toggle Onion Skin (O)"
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    onionSkinEnabled ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
                <Layers size={14} />
                <span className="hidden sm:inline">Onion Skin</span>
            </button>

            {/* Onion Skin Advanced Popover */}
            {onionSkinEnabled && (
                <div className="absolute right-0 top-full mt-2 bg-gray-850 border border-gray-700 rounded-xl shadow-2xl p-4 z-50 min-w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase">Range</span>
                                <span className="text-[10px] text-brand-400 font-mono">{onionSkinRange} frames</span>
                            </div>
                            <input 
                                type="range" min="1" max="5" step="1"
                                value={onionSkinRange}
                                onChange={(e) => setOnionSkinRange(parseInt(e.target.value))}
                                className="w-full accent-brand-500 bg-gray-700 h-1 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase">Opacity</span>
                                <span className="text-[10px] text-brand-400 font-mono">{Math.round(onionSkinOpacity * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0.1" max="0.8" step="0.05"
                                value={onionSkinOpacity}
                                onChange={(e) => setOnionSkinOpacity(parseFloat(e.target.value))}
                                className="w-full accent-brand-500 bg-gray-700 h-1 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="h-4 w-px bg-gray-700 mx-2" />

        <input 
          type="file" ref={fileInputRef} className="hidden" 
          accept="image/png, image/jpeg, image/svg+xml"
          onChange={handleFileChange}
        />
        
        <button onClick={() => setIsLibraryOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
          <FolderOpen size={14} />
          <span className="hidden sm:inline">Library</span>
        </button>

        {/* Import Dropdown */}
        <div 
          className="relative"
          onMouseEnter={() => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); setIsImportDropdownOpen(true); }}
          onMouseLeave={() => { closeTimeoutRef.current = setTimeout(() => setIsImportDropdownOpen(false), 300); }}
        >
          <button 
            onClick={() => triggerImport('layer')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <FileUp size={14} />
            <span className="hidden sm:inline">Import</span>
            <ChevronDown size={10} className="ml-1 opacity-50" />
          </button>

          {isImportDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-1 flex flex-col min-w-[160px]">
                <button
                  onClick={() => triggerImport('layer')}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded text-left transition-colors"
                >
                  <ImageIcon size={14} className="text-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white uppercase">As New Layer</span>
                    <span className="text-[8px] text-gray-500">Add to current frame</span>
                  </div>
                </button>
                <button
                  onClick={() => triggerImport('frame')}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded text-left transition-colors border-t border-gray-750 mt-1 pt-2"
                >
                  <PlusSquare size={14} className="text-green-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white uppercase">As New Frame</span>
                    <span className="text-[8px] text-gray-500">Create dedicated frame</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700 ml-2">
          <button onClick={onExport} className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/10">
            <Download size={14} />
            <span>Export</span>
          </button>
          <button onClick={onExportInstaller} className="p-1.5 text-yellow-500 hover:text-yellow-400 transition-colors" title="Download Installer (.zip)">
            <Package size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureBar;
