import React from 'react';

interface ColorPaletteProps {
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  secondaryColor: string;
  setSecondaryColor: (c: string) => void;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080',
  '#800000', '#808000', '#008000', '#800080', '#008080',
  '#000080', '#3B82F6', '#EF4444', '#10B981', '#F59E0B'
];

const ColorPalette: React.FC<ColorPaletteProps> = ({
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor
}) => {
  return (
    <div className="p-4 border-b border-gray-750">
      <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Colors</h3>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-1">Primary</label>
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-600">
                <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                />
            </div>
        </div>
        <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-1">Right Click</label>
             <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-600">
                <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setPrimaryColor(color)}
            onContextMenu={(e) => {
                e.preventDefault();
                setSecondaryColor(color);
            }}
            className="w-6 h-6 rounded hover:scale-110 transition-transform border border-gray-700"
            style={{ backgroundColor: color }}
            title={`Left: Primary, Right: Secondary\n${color}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;