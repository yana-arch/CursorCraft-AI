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
                <div className={`p-6 bg-gray-800/30 rounded-2xl border transition-all ${params.enableScale ? 'border-brand-500/50 shadow-lg shadow-brand-500/5' : 'border-gray-700'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                        <input 
                            type="checkbox" id="enable-scale"
                            checked={params.enableScale}
                            onChange={(e) => setParams({ ...params, enableScale: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-brand-500" 
                        />
                        <label htmlFor="enable-scale" className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2 cursor-pointer">
                            <Maximize size={14} className={params.enableScale ? 'text-brand-400' : 'text-gray-500'} />
                            <span>Scale</span>
                        </label>
                    </div>
                    {params.enableScale && (
                        <input
                            type="number" step="0.05"
                            value={params.stepScale}
                            onChange={(e) => setParams({ ...params, stepScale: parseFloat(e.target.value) || 1 })}
                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        />
                    )}
                </div>

                <div className={`p-6 bg-gray-800/30 rounded-2xl border transition-all ${params.enableOpacity ? 'border-brand-500/50 shadow-lg shadow-brand-500/5' : 'border-gray-700'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                        <input 
                            type="checkbox" id="enable-opacity"
                            checked={params.enableOpacity}
                            onChange={(e) => setParams({ ...params, enableOpacity: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-brand-500" 
                        />
                        <label htmlFor="enable-opacity" className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2 cursor-pointer">
                            <Sun size={14} className={params.enableOpacity ? 'text-brand-400' : 'text-gray-500'} />
                            <span>Opacity</span>
                        </label>
                    </div>
                    {params.enableOpacity && (
                        <input
                            type="number" step="0.05" min="0" max="1"
                            value={params.stepOpacity}
                            onChange={(e) => setParams({ ...params, stepOpacity: parseFloat(e.target.value) || 1 })}
                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        />
                    )}
                </div>
            </div>

            <div className={`p-6 bg-gray-800/30 rounded-2xl border transition-all ${params.enableHue ? 'border-brand-500/50 shadow-lg shadow-brand-500/5' : 'border-gray-700'}`}>
                <div className="flex items-center space-x-3 mb-4">
                    <input 
                        type="checkbox" id="enable-hue"
                        checked={params.enableHue}
                        onChange={(e) => setParams({ ...params, enableHue: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-brand-500" 
                    />
                    <label htmlFor="enable-hue" className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2 cursor-pointer">
                        <Palette size={14} className={params.enableHue ? 'text-brand-400' : 'text-gray-500'} />
                        <span>Hue Cycling</span>
                    </label>
                </div>
                {params.enableHue && (
                    <input
                        type="number"
                        value={params.stepHue}
                        onChange={(e) => setParams({ ...params, stepHue: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                    />
                )}
            </div>
        </div>
    );
};

export default VisualsTab;
