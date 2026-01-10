import React, { useRef, useState } from 'react';
import { MousePointer2, Eraser, Pipette, Crosshair, Download, Grid3X3, Upload, PaintBucket, FolderOpen, BoxSelect, Layers, Wand2, RotateCw, FlipHorizontal, FlipVertical, Package, Minus, Square, Circle, ChevronRight } from 'lucide-react';
import { ToolType, DrawMode } from '../types';
import { useEditor } from '../contexts/EditorContext';

interface ToolbarProps {
  onExport: () => void;
  onExportInstaller: () => void;
  onImport: (file: File) => void;
  onTransform: (type: 'flipH' | 'flipV' | 'rotate') => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onExport, 
  onExportInstaller,
  onImport, 
  onTransform
}) => {
  const { 
    activeTool, setActiveTool, 
    brushSize, setBrushSize, 
    drawMode, setDrawMode,
    setIsLibraryOpen,
    onionSkinEnabled, setOnionSkinEnabled
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);
  const [lastShapeTool, setLastShapeTool] = useState<ToolType>('rect');
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <BoxSelect size={20} />, label: 'Box Select (S)' },
    { id: 'magicWand', icon: <Wand2 size={20} />, label: 'Magic Wand (W)' },
    { id: 'pen', icon: <MousePointer2 size={20} />, label: 'Pen (P)' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser (E)' },
    { id: 'fill', icon: <PaintBucket size={20} />, label: 'Bucket Fill (F)' },
    { id: 'picker', icon: <Pipette size={20} />, label: 'Picker (I)' },
    { id: 'hotspot', icon: <Crosshair size={20} />, label: 'Hotspot (H)' },
  ];

  const shapeTools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'line', icon: <Minus size={18} className="-rotate-45" />, label: 'Line (L)' },
    { id: 'rect', icon: <Square size={18} />, label: 'Rectangle (R)' },
    { id: 'circle', icon: <Circle size={18} />, label: 'Circle (C)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  const isShapeActive = ['line', 'rect', 'circle'].includes(activeTool);
  const currentShapeIcon = shapeTools.find(t => t.id === (isShapeActive ? activeTool : lastShapeTool))?.icon;

  return (
    <div className="w-16 bg-gray-850 border-r border-gray-750 flex flex-col items-center py-4 space-y-4 h-full z-20 overflow-visible">
      <div className="mb-2 shrink-0">
        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Grid3X3 size={24} className="text-white" />
        </div>
      </div>

      <div className="flex flex-col space-y-2 w-full px-2 shrink-0">
        <div className="text-xs text-gray-500 font-bold uppercase text-center mb-1">Tools</div>
        
        {/* Main Tools */}
        {tools.slice(0, 3).map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
                setActiveTool(tool.id);
                setIsShapeDropdownOpen(false);
            }}
            title={tool.label}
            className={`p-3 rounded-lg transition-all duration-200 flex justify-center ${
              activeTool === tool.id
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-750 hover:text-white'
            }`}
          >
            {tool.icon}
          </button>
        ))}

        {/* Shape Dropdown */}
        <div 
            className="relative"
            onMouseEnter={() => {
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                setIsShapeDropdownOpen(true);
            }}
            onMouseLeave={() => {
                closeTimeoutRef.current = setTimeout(() => {
                    setIsShapeDropdownOpen(false);
                }, 300); // 300ms buffer
            }}
        >
            <button
                onClick={() => {
                    setActiveTool(lastShapeTool);
                    setIsShapeDropdownOpen(!isShapeDropdownOpen);
                }}
                title="Shapes"
                className={`p-3 rounded-lg transition-all duration-200 flex justify-center w-full relative ${
                    isShapeActive
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-gray-400 hover:bg-gray-750 hover:text-white'
                }`}
            >
                {currentShapeIcon}
                <ChevronRight size={10} className={`absolute bottom-1 right-1 transition-transform ${isShapeDropdownOpen ? 'rotate-90' : ''}`} />
            </button>

            {isShapeDropdownOpen && (
                <div className="absolute left-full top-0 pl-2 z-[100]">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-1 flex flex-col space-y-1 min-w-[120px]">
                        <div className="px-2 py-1 text-[10px] text-gray-500 font-bold uppercase border-b border-gray-700 mb-1">Select Shape</div>
                        {shapeTools.map((st) => (
                            <button
                                key={st.id}
                                onClick={() => {
                                    setActiveTool(st.id);
                                    setLastShapeTool(st.id);
                                    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                                    setIsShapeDropdownOpen(false);
                                }}
                                title={st.label}
                                className={`p-2 rounded hover:bg-gray-700 flex items-center space-x-2 transition-colors w-full text-left ${
                                    activeTool === st.id ? 'bg-gray-700 text-brand-400' : 'text-gray-300'
                                }`}
                            >
                                <span className={activeTool === st.id ? 'text-brand-400' : 'text-gray-400'}>
                                    {st.icon}
                                </span>
                                <span className="text-xs font-medium">{st.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Other Tools */}
        {tools.slice(3).map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
                setActiveTool(tool.id);
                setIsShapeDropdownOpen(false);
            }}
            title={tool.label}
            className={`p-3 rounded-lg transition-all duration-200 flex justify-center ${
              activeTool === tool.id
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-750 hover:text-white'
            }`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {(isShapeActive || activeTool === 'pen' || activeTool === 'eraser') && (
        <div className="flex flex-col space-y-2 w-full px-2 pt-2 border-t border-gray-750 shrink-0">
          <div className="text-xs text-gray-500 font-bold uppercase text-center mb-1">Options</div>
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 text-center mb-1">Size: {brushSize}</span>
              <input 
                type="range" min="1" max="5" step="1" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-brand-500 bg-gray-700 h-1 rounded-lg cursor-pointer"
              />
            </div>
            {isShapeActive && activeTool !== 'line' && (
              <button 
                onClick={() => setDrawMode(drawMode === 'stroke' ? 'fill' : 'stroke')}
                className="text-[10px] py-1 px-1 bg-gray-750 border border-gray-700 rounded hover:bg-gray-700 transition-colors text-white"
              >
                {drawMode.toUpperCase()}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2 w-full px-2 pt-2 border-t border-gray-750 shrink-0">
           <div className="text-xs text-gray-500 font-bold uppercase text-center mb-1">Layer</div>
           <div className="grid grid-cols-2 gap-1">
             <button onClick={() => onTransform('flipH')} title="Flip Horizontal" className="p-2 rounded hover:bg-gray-750 text-gray-400 hover:text-white flex justify-center"><FlipHorizontal size={16}/></button>
             <button onClick={() => onTransform('flipV')} title="Flip Vertical" className="p-2 rounded hover:bg-gray-750 text-gray-400 hover:text-white flex justify-center"><FlipVertical size={16}/></button>
             <button onClick={() => onTransform('rotate')} title="Rotate 90°" className="col-span-2 p-2 rounded hover:bg-gray-750 text-gray-400 hover:text-white flex justify-center"><RotateCw size={16}/></button>
           </div>
      </div>

      <div className="flex flex-col space-y-2 w-full px-2 pt-2 border-t border-gray-750 shrink-0">
          <div className="text-xs text-gray-500 font-bold uppercase text-center mb-1">View</div>
          <button
            onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
            title={`Onion Skin: ${onionSkinEnabled ? 'ON' : 'OFF'}`}
            className={`p-3 rounded-lg transition-all duration-200 flex justify-center ${
              onionSkinEnabled
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-750 hover:text-white'
            }`}
          >
            <Layers size={20} />
          </button>
      </div>

      <div className="mt-auto flex flex-col space-y-4 w-full px-2 pb-4 pt-4 border-t border-gray-750 shrink-0">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/png, image/jpeg, image/svg+xml"
          onChange={handleFileChange}
        />
        <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 rounded-lg flex justify-center"
            title="Import Image"
        >
            <Upload size={20} />
        </button>

        <button
            onClick={() => setIsLibraryOpen(true)}
            className="p-3 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-300 rounded-lg flex justify-center"
            title="Library & Save"
        >
            <FolderOpen size={20} />
        </button>

        <div className="flex flex-col space-y-2">
            <button
                onClick={onExport}
                className="p-3 text-green-400 hover:bg-green-900/30 hover:text-green-300 rounded-lg flex justify-center"
                title="Download File (.cur/.ani)"
            >
                <Download size={20} />
            </button>
             <button
                onClick={onExportInstaller}
                className="p-3 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300 rounded-lg flex justify-center"
                title="Download Windows Installer (.zip)"
            >
                <Package size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;