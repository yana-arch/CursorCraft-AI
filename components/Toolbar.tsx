import React, { useRef } from 'react';
import { MousePointer2, Eraser, Pipette, Crosshair, Download, Grid3X3, Upload, PaintBucket, FolderOpen, BoxSelect, Layers, Wand2, RotateCw, FlipHorizontal, FlipVertical, Package } from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setTool: (t: ToolType) => void;
  onExport: () => void;
  onExportInstaller: () => void;
  onImport: (file: File) => void;
  onOpenLibrary: () => void;
  onionSkinEnabled: boolean;
  toggleOnionSkin: () => void;
  onTransform: (type: 'flipH' | 'flipV' | 'rotate') => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  setTool, 
  onExport, 
  onExportInstaller,
  onImport, 
  onOpenLibrary,
  onionSkinEnabled,
  toggleOnionSkin,
  onTransform
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <BoxSelect size={20} />, label: 'Box Select (S)' },
    { id: 'magicWand', icon: <Wand2 size={20} />, label: 'Magic Wand (W)' },
    { id: 'pen', icon: <MousePointer2 size={20} />, label: 'Pen (P)' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser (E)' },
    { id: 'fill', icon: <PaintBucket size={20} />, label: 'Bucket Fill (F)' },
    { id: 'picker', icon: <Pipette size={20} />, label: 'Picker (I)' },
    { id: 'hotspot', icon: <Crosshair size={20} />, label: 'Hotspot (H)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  return (
    <div className="w-16 bg-gray-850 border-r border-gray-750 flex flex-col items-center py-4 space-y-4 h-full z-10 custom-scrollbar overflow-y-auto">
      <div className="mb-2 shrink-0">
        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Grid3X3 size={24} className="text-white" />
        </div>
      </div>

      <div className="flex flex-col space-y-2 w-full px-2 shrink-0">
        <div className="text-xs text-gray-500 font-bold uppercase text-center mb-1">Tools</div>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
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
            onClick={toggleOnionSkin}
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
            onClick={onOpenLibrary}
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