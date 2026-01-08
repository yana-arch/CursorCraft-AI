import React, { useEffect, useState } from 'react';
import { Frame, Point, GridData } from '../types';

// We updated Frame in types.ts but for props here we expect objects that have a 'grid' property
// which we construct in App.tsx (framesWithCompositeGrid)
interface FrameWithGrid extends Omit<Frame, 'layers'> {
    grid: GridData;
}

interface PreviewPanelProps {
  frames: FrameWithGrid[];
  hotspot: Point;
  isPlaying?: boolean; 
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ frames, hotspot }) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [dataUrl, setDataUrl] = useState<string>('');
  
  // Animation Loop
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

  // Render current frame to Data URL
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

  return (
    <div className="p-4 border-b border-gray-750">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase">Live Preview</h3>
        {frames.length > 1 && (
            <span className="text-[10px] bg-brand-900/50 text-brand-400 px-1.5 py-0.5 rounded border border-brand-800">
                ANIMATED
            </span>
        )}
      </div>

      {/* Preview Boxes */}
      <div className="space-y-4">
        
        {/* Light Mode Preview */}
        <div className="w-full h-24 bg-gray-200 rounded-lg relative overflow-hidden group cursor-crosshair border border-gray-600">
            <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-bold uppercase">Light UI</div>
            <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ 
                    cursor: dataUrl ? `url(${dataUrl}) ${hotspot.x} ${hotspot.y}, auto` : 'default'
                 }}
            >
               <button className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm text-xs text-gray-800 pointer-events-auto hover:bg-gray-50">
                   Hover Me
               </button>
            </div>
        </div>

        {/* Dark Mode Preview */}
        <div className="w-full h-24 bg-gray-900 rounded-lg relative overflow-hidden group cursor-crosshair border border-gray-700">
             <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-bold uppercase">Dark UI</div>
             <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center"
                style={{ 
                    cursor: dataUrl ? `url(${dataUrl}) ${hotspot.x} ${hotspot.y}, auto` : 'default'
                 }}
            >
               <button className="px-3 py-1 bg-brand-600 rounded shadow-sm text-xs text-white pointer-events-auto hover:bg-brand-500">
                   Hover Me
               </button>
            </div>
        </div>

        {/* Size Comparisons */}
        <div className="flex items-end space-x-4 pt-2">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 mb-1">1x</span>
                <img src={dataUrl} className="w-8 h-8 border border-gray-700 bg-gray-800" style={{imageRendering: 'pixelated'}} />
            </div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 mb-1">2x</span>
                <img src={dataUrl} className="w-16 h-16 border border-gray-700 bg-gray-800" style={{imageRendering: 'pixelated'}} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;