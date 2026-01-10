import React, { useEffect, useState, useMemo } from 'react';
import { Monitor } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useEditor } from '../contexts/EditorContext';
import { GridData } from '../types';
import { composeLayers } from '../utils/layerUtils';

type BgType = 'light' | 'dark' | 'checker' | 'blue';

const PreviewPanel: React.FC = () => {
  const { frames, hotspot } = useProject();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [bgType, setBgType] = useState<BgType>('checker');
  
  const framesWithCompositeGrid = useMemo(() => {
      return frames.map(f => ({ id: f.id, grid: composeLayers(f.layers) }));
  }, [frames]);

  useEffect(() => {
      if (frames.length <= 1) { setCurrentFrameIndex(0); return; }
      const interval = setInterval(() => {
          setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, 150); 
      return () => clearInterval(interval);
  }, [frames.length]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grid = framesWithCompositeGrid[currentFrameIndex]?.grid;
    if (!grid) return;
    ctx.clearRect(0, 0, 32, 32);
    grid.forEach((row, y) => row.forEach((color, x) => {
        if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
    }));
    setDataUrl(canvas.toDataURL('image/png'));
  }, [framesWithCompositeGrid, currentFrameIndex]);

  const getBgStyle = () => {
      switch(bgType) {
          case 'light': return 'bg-white';
          case 'dark': return 'bg-gray-950';
          case 'blue': return 'bg-blue-600';
          case 'checker': return 'bg-checkerboard';
          default: return 'bg-gray-900';
      }
  };

  return (
    <div className="p-4 border-b border-gray-750 bg-gray-900/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-gray-400">
            <Monitor size={14} className="text-brand-400" />
            <h3 className="text-xs font-black uppercase tracking-widest">Real-size Preview</h3>
        </div>
      </div>
      <div className="space-y-4">
        <div className={`w-full h-32 rounded-xl relative overflow-hidden border border-gray-700 shadow-inner group transition-all duration-300 ${getBgStyle()}`}>
            {bgType === 'checker' && <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px' }} />}
            <div className="absolute inset-0 flex items-center justify-center cursor-crosshair" style={{ cursor: dataUrl ? `url(${dataUrl}) ${hotspot.x} ${hotspot.y}, auto` : 'default' }}>
                <div className="text-center pointer-events-none select-none opacity-20"><p className={`text-[10px] font-bold uppercase tracking-widest ${bgType === 'light' ? 'text-black' : 'text-white'}`}>Hover to test</p></div>
            </div>
            <div className="absolute bottom-2 right-2 flex space-x-1 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                {(['checker', 'light', 'dark', 'blue'] as BgType[]).map((type) => (<button key={type} onClick={() => setBgType(type)} className={`w-5 h-5 rounded-md border ${bgType === type ? 'border-brand-400 scale-110' : 'border-transparent'} ${type === 'light' ? 'bg-white' : type === 'dark' ? 'bg-gray-950' : type === 'blue' ? 'bg-blue-600' : 'bg-gray-400'}`} />))}
            </div>
        </div>
        <div className="flex items-end space-x-4 pt-2">
            <div className="flex flex-col items-center"><span className="text-[10px] text-gray-500 mb-1">1x</span><img src={dataUrl} className="w-8 h-8 border border-gray-700 bg-gray-800" style={{imageRendering: 'pixelated'}} alt="1x" /></div>
            <div className="flex flex-col items-center"><span className="text-[10px] text-gray-500 mb-1">2x</span><img src={dataUrl} className="w-16 h-16 border border-gray-700 bg-gray-800" style={{imageRendering: 'pixelated'}} alt="2x" /></div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
