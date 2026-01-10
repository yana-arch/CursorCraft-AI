import React from 'react';
import { RotateCw, Move, MapPin, Trash2 } from 'lucide-react';
import { AnimationParams, Point } from '../../../types';

interface MotionTabProps {
    params: AnimationParams;
    setParams: (p: AnimationParams) => void;
    isPickingPath: boolean;
    setIsPickingPath: (v: boolean) => void;
    setIsPickingPivot: (v: boolean) => void;
    pathPoints: Point[];
    setPathPoints: (p: Point[]) => void;
}

const MotionTab: React.FC<MotionTabProps> = ({ 
    params, setParams, isPickingPath, setIsPickingPath, setIsPickingPivot, pathPoints, setPathPoints 
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="space-y-6">
                <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                            <RotateCw size={14} className="text-brand-400" />
                            <span>Incremental Rotation</span>
                        </label>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" id="auto-loop"
                                checked={params.isLoop}
                                onChange={(e) => setParams({ ...params, isLoop: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-brand-500" 
                            />
                            <label htmlFor="auto-loop" className="text-[10px] text-gray-400 font-black uppercase cursor-pointer">Auto-Loop</label>
                        </div>
                    </div>
                    <input
                        type="number" step="0.5"
                        value={params.stepAngle}
                        disabled={params.isLoop}
                        onChange={(e) => setParams({ ...params, stepAngle: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-30 transition-all"
                    />
                </div>

                <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-4">
                    <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                        <Move size={14} className="text-brand-400" />
                        <span>Offset per Frame</span>
                    </label>
                    <div className="flex space-x-4">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-3.5 text-[10px] text-gray-600 font-black">X</span>
                            <input
                                type="number"
                                value={params.stepX}
                                onChange={(e) => setParams({ ...params, stepX: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                            />
                        </div>
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-3.5 text-[10px] text-gray-600 font-black">Y</span>
                            <input
                                type="number"
                                value={params.stepY}
                                onChange={(e) => setParams({ ...params, stepY: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2">
                            <MapPin size={14} className="text-brand-400" />
                            <span>Custom Movement Path</span>
                        </label>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setPathPoints([])}
                                className="p-2 text-gray-500 hover:text-red-400 bg-gray-950 border border-gray-700 rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                            <button 
                                onClick={() => { setIsPickingPath(!isPickingPath); setIsPickingPivot(false); }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isPickingPath ? 'bg-brand-500 text-white animate-pulse' : 'bg-gray-950 text-gray-400 border border-gray-700'}`}
                            >
                                {isPickingPath ? 'Pick Points...' : 'Add Points'}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-3 bg-gray-950 rounded-xl border border-gray-700 shadow-inner">
                        {pathPoints.length === 0 && <span className="text-[10px] text-gray-600 italic">No points. Click "Add Points" to define a path.</span>}
                        {pathPoints.map((p, i) => (
                            <div key={i} className="bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] px-3 py-1.5 rounded-lg font-black flex items-center space-x-2">
                                <span className="opacity-50">#{i+1}</span>
                                <span>{p.x}, {p.y}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MotionTab;
