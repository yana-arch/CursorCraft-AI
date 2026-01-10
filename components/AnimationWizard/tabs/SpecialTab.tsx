import React from 'react';
import { Wind, MapPin, Trash2 } from 'lucide-react';
import { AnimationParams, Point } from '../../../types';

interface SpecialTabProps {
    params: AnimationParams;
    setParams: (p: AnimationParams) => void;
    customPivot?: Point;
    pathPoints: Point[];
    setPathPoints: (p: Point[]) => void;
    isPickingCustomPivot: boolean;
    setIsPickingCustomPivot: (v: boolean) => void;
    setIsPickingPath: (v: boolean) => void;
}

const SpecialTab: React.FC<SpecialTabProps> = ({ 
    params, setParams, customPivot, pathPoints, setPathPoints, isPickingCustomPivot, setIsPickingCustomPivot, setIsPickingPath 
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-6">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                        <Wind size={14} className="text-brand-400" />
                        <span>Dynamic Sway</span>
                    </label>
                    <button
                        onClick={() => setParams({ ...params, enableSway: !params.enableSway })}
                        className={`w-12 h-6 rounded-full relative transition-all ${params.enableSway ? 'bg-brand-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${params.enableSway ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                {params.enableSway && (
                    <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Amplitude (°)</span>
                            <input
                                type="number"
                                value={params.swayAngle}
                                onChange={(e) => setParams({ ...params, swayAngle: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                            />
                        </div>
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Period (frames)</span>
                            <input
                                type="number" min="2"
                                value={params.swayPeriod}
                                onChange={(e) => setParams({ ...params, swayPeriod: parseInt(e.target.value) || 2 })}
                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                            />
                        </div>

                        <div className="space-y-1 col-span-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rigid Root Area</span>
                                <span className="text-[10px] text-brand-400 font-mono font-bold bg-brand-500/10 px-2 py-0.5 rounded">{params.swayRigidArea}px</span>
                            </div>
                            <input
                                type="range" min="0" max="16" step="1"
                                value={params.swayRigidArea}
                                onChange={(e) => setParams({ ...params, swayRigidArea: parseInt(e.target.value) })}
                                className="w-full accent-brand-500 bg-gray-950 h-1.5 rounded-lg appearance-none cursor-pointer border border-gray-700"
                            />
                            <p className="text-[9px] text-gray-600 mt-1 italic">Number of pixels from the pivot that remain stationary.</p>
                        </div>

                        <div className="space-y-3 col-span-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Pivot Point (Fixed Root)</span>
                            <div className="flex justify-center">
                                <div className="grid grid-cols-3 gap-2 bg-gray-900 p-3 rounded-xl border border-gray-700">
                                    {[
                                        { id: 'top-left', label: '↖' },
                                        { id: 'top', label: '↑' },
                                        { id: 'top-right', label: '↗' },
                                        { id: 'left', label: '←' },
                                        { id: 'center', label: '•' },
                                        { id: 'right', label: '→' },
                                        { id: 'bottom-left', label: '↙' },
                                        { id: 'bottom', label: '↓' },
                                        { id: 'bottom-right', label: '↘' },
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setParams({ ...params, swayPivot: p.id as any })}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${
                                                params.swayPivot === p.id 
                                                ? 'bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-500/40 scale-110 z-10' 
                                                : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                                            }`}
                                            title={p.id}
                                        >
                                            <span className="text-lg font-bold">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                            <MapPin size={14} className="text-purple-400" />
                            <span>Path Bending (IK)</span>
                        </label>
                        <p className="text-[9px] text-gray-500 italic">Bend selection to reach target points (Great for tails!)</p>
                    </div>
                    <button
                        onClick={() => setParams({ ...params, enablePathDeform: !params.enablePathDeform })}
                        className={`w-12 h-6 rounded-full relative transition-all ${params.enablePathDeform ? 'bg-brand-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${params.enablePathDeform ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                {params.enablePathDeform && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-700">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-500 uppercase">Step 1: Root Pivot</span>
                                <p className="text-[10px] text-brand-400 font-mono">{customPivot ? `${customPivot.x}, ${customPivot.y}` : 'NOT SET'}</p>
                            </div>
                            <button 
                                onClick={() => { setIsPickingCustomPivot(!isPickingCustomPivot); setIsPickingPath(false); }} 
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isPickingCustomPivot ? 'bg-brand-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                            >
                                {isPickingCustomPivot ? 'Click Canvas' : 'Pick Pivot'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-500 uppercase">Step 2: Target Sequence</span>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => setPathPoints([])}
                                        className="p-2 text-gray-500 hover:text-red-400 bg-gray-950 border border-gray-700 rounded-lg transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <button 
                                        onClick={() => { setIsPickingPath(true); setIsPickingCustomPivot(false); }} 
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all bg-gray-900 text-gray-400 border border-gray-700`}
                                    >
                                        Add Targets
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-3 bg-gray-950 rounded-xl border border-gray-700">
                                {pathPoints.length === 0 && <span className="text-[10px] text-gray-600 italic">Add points to see the bend.</span>}
                                {pathPoints.map((p, i) => (
                                    <div key={i} className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] px-3 py-1.5 rounded-lg font-black flex items-center space-x-2">
                                        <span className="opacity-50">T{i+1}</span><span>{p.x}, {p.y}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpecialTab;
