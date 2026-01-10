import React, { useState, useRef } from 'react';
import { MousePointer2, Eraser, Pipette, Crosshair, Grid3X3, PaintBucket, BoxSelect, Wand2, Minus, Square, Circle, ChevronRight, Lasso } from 'lucide-react';
import { ToolType } from '../types';
import { useEditor } from '../contexts/EditorContext';

const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useEditor();
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);
  const [lastShapeTool, setLastShapeTool] = useState<ToolType>('rect');
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <BoxSelect size={20} />, label: 'Box Select (S)' },
    { id: 'lasso', icon: <Lasso size={20} />, label: 'Lasso (L)' },
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

  const isShapeActive = ['line', 'rect', 'circle'].includes(activeTool);
  const currentShapeIcon = shapeTools.find(t => t.id === (isShapeActive ? activeTool : lastShapeTool))?.icon;

  return (
    <div className="w-16 bg-gray-850 border-r border-gray-750 flex flex-col items-center py-4 space-y-4 h-full z-20">
      <div className="mb-2 shrink-0">
        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Grid3X3 size={24} className="text-white" />
        </div>
      </div>

      <div className="flex flex-col space-y-2 w-full px-2 shrink-0">
        <div className="text-xs text-gray-500 font-bold uppercase text-center mb-1">Tools</div>
        
        {tools.slice(0, 3).map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id); setIsShapeDropdownOpen(false); }}
            title={tool.label}
            className={`p-3 rounded-lg transition-all duration-200 flex justify-center ${activeTool === tool.id ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-750 hover:text-white'}`}
          >
            {tool.icon}
          </button>
        ))}

        <div 
            className="relative"
            onMouseEnter={() => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); setIsShapeDropdownOpen(true); }}
            onMouseLeave={() => { closeTimeoutRef.current = setTimeout(() => setIsShapeDropdownOpen(false), 300); }}
        >
            <button
                onClick={() => { setActiveTool(lastShapeTool); setIsShapeDropdownOpen(!isShapeDropdownOpen); }}
                title="Shapes"
                className={`p-3 rounded-lg transition-all duration-200 flex justify-center w-full relative ${isShapeActive ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-750 hover:text-white'}`}
            >
                {currentShapeIcon}
                <ChevronRight size={10} className={`absolute bottom-1 right-1 transition-transform ${isShapeDropdownOpen ? 'rotate-90' : ''}`} />
            </button>

            {isShapeDropdownOpen && (
                <div className="absolute left-full top-0 pl-2 z-[100]">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-1 flex flex-col space-y-1 min-w-[120px]">
                        {shapeTools.map((st) => (
                            <button
                                key={st.id}
                                onClick={() => { setActiveTool(st.id); setLastShapeTool(st.id); if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); setIsShapeDropdownOpen(false); }}
                                className={`p-2 rounded hover:bg-gray-700 flex items-center space-x-2 transition-colors w-full text-left ${activeTool === st.id ? 'bg-gray-700 text-brand-400' : 'text-gray-300'}`}
                            >
                                <span className={activeTool === st.id ? 'text-brand-400' : 'text-gray-400'}>{st.icon}</span>
                                <span className="text-xs font-medium">{st.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {tools.slice(3).map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id); setIsShapeDropdownOpen(false); }}
            title={tool.label}
            className={`p-3 rounded-lg transition-all duration-200 flex justify-center ${activeTool === tool.id ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-750 hover:text-white'}`}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
