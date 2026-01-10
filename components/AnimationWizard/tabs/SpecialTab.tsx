import React from 'react';
import { Wind, MapPin, Trash2 } from 'lucide-react';
import { AnimationParams, Point } from '../../../types';

interface SpecialTabProps {
    params: AnimationParams;
    setParams: (p: AnimationParams) => void;
    pathPivot?: Point;
    pathPoints: Point[];
    setPathPoints: (p: Point[]) => void;
    isPickingPivot: boolean;
    setIsPickingPivot: (v: boolean) => void;
    setIsPickingPath: (v: boolean) => void;
}

const SpecialTab: React.FC<SpecialTabProps> = ({ 
    params, setParams, pathPivot, pathPoints, setPathPoints, isPickingPivot, setIsPickingPivot, setIsPickingPath 
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
                                <p className="text-[10px] text-brand-400 font-mono">{pathPivot ? `${pathPivot.x}, ${pathPivot.y}` : 'NOT SET'}</p>
                            </div>
                            <button 
                                onClick={() => { setIsPickingPivot(!isPickingPivot); setIsPickingPath(false); }} 
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isPickingPivot ? 'bg-brand-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                            >
                                {isPickingPivot ? 'Click Canvas' : 'Pick Pivot'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-500 uppercase">Step 2: Target Sequence</span>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => setPathPoints([])}
                                        className="p-2 text-gray-500 hover:text-red-400 bg-gray-950 border border-gray-700 rounded-lg"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <button 
                                        onClick={() => { setIsPickingPath(true); setIsPickingPivot(false); }} 
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
