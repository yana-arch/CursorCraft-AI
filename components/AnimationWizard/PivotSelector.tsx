import React from 'react';
import { Crosshair, MapPin } from 'lucide-react';
import { Point } from '../../types';

interface PivotSelectorProps {
    mode: 'auto' | '1x1' | '2x2' | 'custom';
    onModeChange: (mode: 'auto' | '1x1' | '2x2' | 'custom') => void;
    customPivot?: Point;
    isPicking: boolean;
    onStartPicking: () => void;
    label?: string;
}

const PivotSelector: React.FC<PivotSelectorProps> = ({ 
    mode, onModeChange, customPivot, isPicking, onStartPicking, label = "Rotation Pivot" 
}) => {
    return (
        <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center space-x-2">
                <Crosshair size={10} />
                <span>{label}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
                {(['auto', '1x1', '2x2', 'custom'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => onModeChange(m)}
                        className={`py-1.5 px-1 rounded-lg text-[9px] font-bold border transition-all ${
                            mode === m 
                            ? 'bg-brand-600 border-brand-400 text-white shadow-lg' 
                            : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                        {m.toUpperCase()}
                    </button>
                ))}
            </div>
            
            {mode === 'custom' && (
                <div className="flex items-center justify-between p-3 bg-gray-950 rounded-xl border border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-gray-500 uppercase">Selected Pivot</span>
                        <p className="text-[10px] text-brand-400 font-mono font-bold">
                            {customPivot ? `${customPivot.x}, ${customPivot.y}` : 'NOT SET'}
                        </p>
                    </div>
                    <button 
                        onClick={onStartPicking}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                            isPicking 
                            ? 'bg-brand-500 text-white animate-pulse shadow-lg shadow-brand-500/20' 
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        {isPicking ? 'Click Canvas...' : 'Pick on Canvas'}
                    </button>
                </div>
            )}

            <p className="text-[9px] text-gray-600 italic">
                {mode === 'auto' && 'Center based on selection size.'}
                {mode === '1x1' && 'Snaps to center of a middle pixel.'}
                {mode === '2x2' && 'Snaps to intersection of 4 pixels.'}
                {mode === 'custom' && 'Pick any specific pixel on the canvas.'}
            </p>
        </div>
    );
};

export default PivotSelector;
