import React, { useEffect, useState } from 'react';
import { Monitor, Square, Columns } from 'lucide-react';
import { Frame, Point, GridData } from '../types';

interface FrameWithGrid extends Omit<Frame, 'layers'> {
    grid: GridData;
}

interface PreviewPanelProps {
  frames: FrameWithGrid[];
  hotspot: Point;
  isPlaying?: boolean; 
}

type BgType = 'light' | 'dark' | 'checker' | 'blue';

const PreviewPanel: React.FC<PreviewPanelProps> = ({ frames, hotspot }) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [bgType, setBgType] = useState<BgType>('checker');
  
  useEffect(() => {
      if (frames.length <= 1) {
          setCurrentFrameIndex(0);
          return;
      }
      const interval = setInterval(() => {
          setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, 150); 
      return () => clearInterval(interval);
  }, [frames.length]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grid = frames[currentFrameIndex]?.grid;
    if (!grid) return;

    ctx.clearRect(0, 0, 32, 32);
    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
      });
    });
    setDataUrl(canvas.toDataURL('image/png'));
  }, [frames, currentFrameIndex]);

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
        {frames.length > 1 && (
            <span className="text-[9px] font-black bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">
                {frames.length} FPS
            </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Main Preview Box */}
        <div className={`w-full h-32 rounded-xl relative overflow-hidden border border-gray-700 shadow-inner group transition-all duration-300 ${getBgStyle()}`}>
            {bgType === 'checker' && (
                <div className="absolute inset-0 opacity-10" 
                     style={{ 
                        backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)',
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                     }} 
                />
            )}
            
            <div 
                className="absolute inset-0 flex items-center justify-center cursor-crosshair"
                style={{ 
                    cursor: dataUrl ? `url(${dataUrl}) ${hotspot.x} ${hotspot.y}, auto` : 'default'
                 }}
            >
                <div className="text-center pointer-events-none select-none">
                    <p className={`text-[10px] font-bold uppercase tracking-widest opacity-20 ${bgType === 'light' ? 'text-black' : 'text-white'}`}>
                        Hover to test cursor
                    </p>
                    <div className="mt-2 flex justify-center space-x-4 opacity-40">
                        <div className={`w-8 h-2 rounded-full ${bgType === 'light' ? 'bg-black/10' : 'bg-white/10'}`} />
                        <div className={`w-12 h-2 rounded-full ${bgType === 'light' ? 'bg-black/10' : 'bg-white/10'}`} />
                    </div>
                </div>
            </div>

            {/* Background Selector Overlay */}
            <div className="absolute bottom-2 right-2 flex space-x-1 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {(['checker', 'light', 'dark', 'blue'] as BgType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setBgType(type)}
                        className={`w-5 h-5 rounded-md border transition-all ${
                            bgType === type ? 'border-brand-400 scale-110 shadow-lg' : 'border-transparent hover:border-white/30'
                        } ${
                            type === 'light' ? 'bg-white' : type === 'dark' ? 'bg-gray-950' : type === 'blue' ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                        title={`${type} background`}
                    />
                ))}
            </div>
        </div>

        {/* Size Comparisons */}
        <div className="flex items-end space-x-4 pt-2">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 mb-1">1x</span>
                <img src={dataUrl} className="w-8 h-8 border border-gray-700 bg-gray-800" style={{imageRendering: 'pixelated'}} alt="1x" />
            </div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 mb-1">2x</span>
                <img src={dataUrl} className="w-16 h-16 border border-gray-700 bg-gray-800" style={{imageRendering: 'pixelated'}} alt="2x" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
