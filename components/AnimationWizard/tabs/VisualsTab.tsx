import React from 'react';
import { Maximize, Sun, Palette } from 'lucide-react';
import { AnimationParams } from '../../../types';

interface VisualsTabProps {
    params: AnimationParams;
    setParams: (p: AnimationParams) => void;
}

const VisualsTab: React.FC<VisualsTabProps> = ({ params, setParams }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-4">
                    <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                        <Maximize size={14} className="text-brand-400" />
                        <span>Scale</span>
                    </label>
                    <input
                        type="number" step="0.05"
                        value={params.stepScale}
                        onChange={(e) => setParams({ ...params, stepScale: parseFloat(e.target.value) || 1 })}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                </div>
                <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-4">
                    <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                        <Sun size={14} className="text-brand-400" />
                        <span>Opacity</span>
                    </label>
                    <input
                        type="number" step="0.05" min="0" max="1"
                        value={params.stepOpacity}
                        onChange={(e) => setParams({ ...params, stepOpacity: parseFloat(e.target.value) || 1 })}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                </div>
            </div>

            <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-4">
                <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                    <Palette size={14} className="text-brand-400" />
                    <span>Hue Cycling</span>
                </label>
                <input
                    type="number"
                    value={params.stepHue}
                    onChange={(e) => setParams({ ...params, stepHue: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                />
            </div>
        </div>
    );
};

export default VisualsTab;
