import React from 'react';
import { Layers, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Layer } from '../types';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  addLayer: () => void;
  toggleLayerVisibility: (id: string) => void;
  deleteLayer: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  setActiveLayerId,
  addLayer,
  toggleLayerVisibility,
  deleteLayer,
  moveLayer
}) => {
  // Layers are stored bottom-to-top in array (0 is background), 
  // but usually rendered top-to-bottom in UI list (index N is top).
  const reversedLayers = [...layers].reverse();

  return (
    <div className="flex flex-col h-full bg-gray-850">
      <div className="flex items-center justify-between p-3 border-b border-gray-750">
        <div className="flex items-center space-x-2 text-gray-400">
          <Layers size={14} />
          <span className="text-xs font-bold uppercase">Layers</span>
        </div>
        <button 
          onClick={addLayer}
          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          title="Add New Layer"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {reversedLayers.map((layer, index) => {
           // We need original index for operations
           const originalIndex = layers.length - 1 - index;
           
           return (
            <div 
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border ${
                activeLayerId === layer.id 
                  ? 'bg-brand-900/40 border-brand-600/50' 
                  : 'bg-gray-800 border-transparent hover:bg-gray-750'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className={`text-gray-500 hover:text-gray-300 ${!layer.visible && 'opacity-50'}`}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span className={`text-xs truncate select-none ${activeLayerId === layer.id ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {layer.name}
                </span>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col">
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                        disabled={originalIndex === layers.length - 1}
                        className="text-gray-500 hover:text-white disabled:opacity-30"
                    >
                        <ChevronUp size={10} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                        disabled={originalIndex === 0}
                        className="text-gray-500 hover:text-white disabled:opacity-30"
                    >
                        <ChevronDown size={10} />
                    </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  disabled={layers.length <= 1}
                  className="p-1 text-gray-500 hover:text-red-400 disabled:opacity-30"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-2 text-[10px] text-gray-600 text-center border-t border-gray-750">
        {layers.length} Layer{layers.length > 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default LayersPanel;