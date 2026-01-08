import React from 'react';
import { Plus, Trash2, Copy, Play, Pause } from 'lucide-react';
import { Frame, GridData } from '../types';

// We accept frames that have a computed 'grid' property
interface FrameWithGrid extends Omit<Frame, 'layers'> {
    grid: GridData;
}

interface TimelineProps {
  frames: FrameWithGrid[];
  activeFrameIndex: number;
  setActiveFrameIndex: (index: number) => void;
  addFrame: () => void;
  deleteFrame: (index: number) => void;
  duplicateFrame: (index: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
}

const Timeline: React.FC<TimelineProps> = ({
  frames,
  activeFrameIndex,
  setActiveFrameIndex,
  addFrame,
  deleteFrame,
  duplicateFrame,
  isPlaying,
  togglePlay
}) => {
  
  // Helper to render mini preview of a frame
  const renderMiniPreview = (grid: GridData) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        grid.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            });
        });
    }
    return canvas.toDataURL();
  };

  return (
    <div className="h-32 bg-gray-850 border-t border-gray-750 flex flex-col shrink-0">
      {/* Controls Header */}
      <div className="h-10 px-4 border-b border-gray-750 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
           <button 
             onClick={togglePlay}
             className="flex items-center space-x-1 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'Stop' : 'Play'}</span>
           </button>
           <span className="px-2">|</span>
           <span>{frames.length} Frames</span>
           <span>•</span>
           <span>100ms / frame</span>
        </div>
        
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => duplicateFrame(activeFrameIndex)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                title="Duplicate Frame"
            >
                <Copy size={14} />
            </button>
            <button 
                onClick={() => deleteFrame(activeFrameIndex)}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded disabled:opacity-50"
                disabled={frames.length <= 1}
                title="Delete Frame"
            >
                <Trash2 size={14} />
            </button>
        </div>
      </div>

      {/* Frames Scroll Area */}
      <div className="flex-1 flex items-center overflow-x-auto px-4 space-x-3 p-3">
        {frames.map((frame, index) => (
            <div 
                key={frame.id}
                onClick={() => setActiveFrameIndex(index)}
                className={`relative group flex-shrink-0 cursor-pointer transition-all duration-200 ${
                    activeFrameIndex === index 
                        ? 'ring-2 ring-brand-500 scale-105' 
                        : 'ring-1 ring-gray-700 hover:ring-gray-500 opacity-80 hover:opacity-100'
                } rounded-md bg-gray-900 w-16 h-16 flex items-center justify-center`}
            >
                <img 
                    src={renderMiniPreview(frame.grid)} 
                    className="w-12 h-12 image-pixelated object-contain" 
                    alt={`Frame ${index + 1}`} 
                />
                <div className="absolute top-1 left-1 bg-black/50 text-[8px] px-1 rounded text-white font-mono">
                    {index + 1}
                </div>
            </div>
        ))}

        {/* Add Button */}
        <button 
            onClick={addFrame}
            className="flex-shrink-0 w-16 h-16 rounded-md border border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:text-brand-400 hover:border-brand-500 hover:bg-gray-800 transition-colors"
        >
            <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default Timeline;