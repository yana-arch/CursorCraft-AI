import React from 'react';
import { RotateCw, Move, MapPin, Trash2, ArrowLeftRight } from 'lucide-react';
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
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center space-x-2">
                        <ArrowLeftRight size={12} />
                        <span>Playback Mode</span>
                    </label>
                    <div 
                        className="flex items-center space-x-4 bg-gray-950 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors cursor-pointer group" 
                        onClick={() => setParams({ ...params, isBoomerang: !params.isBoomerang })}
                    >
                        <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-10 h-6 rounded-full relative transition-all ${params.isBoomerang ? 'bg-brand-600' : 'bg-gray-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${params.isBoomerang ? 'right-1' : 'left-1'}`} />
                            </div>
                            <div>
                                <p className="text-xs text-white font-bold">Boomerang Effect</p>
                                <p className="text-[10px] text-gray-500">Back & forth ping-pong loop</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-6 bg-gray-800/30 rounded-2xl border transition-all ${params.enableRotation ? 'border-brand-500/50 shadow-lg shadow-brand-500/5' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <input 
                                type="checkbox" id="enable-rotation"
                                checked={params.enableRotation}
                                onChange={(e) => setParams({ ...params, enableRotation: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-brand-500 focus:ring-brand-500" 
                            />
                            <label htmlFor="enable-rotation" className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2 cursor-pointer">
                                <RotateCw size={14} className={params.enableRotation ? 'text-brand-400' : 'text-gray-500'} />
                                <span>Incremental Rotation</span>
                            </label>
                        </div>
                        {params.enableRotation && (
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" id="auto-loop"
                                    checked={params.isLoop}
                                    onChange={(e) => setParams({ ...params, isLoop: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-brand-500" 
                                />
                                <label htmlFor="auto-loop" className="text-[10px] text-gray-400 font-black uppercase cursor-pointer">Auto-Loop</label>
                            </div>
                        )}
                    </div>
                    {params.enableRotation && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95">
                            <input
                                type="number" step="0.5"
                                value={params.stepAngle}
                                disabled={params.isLoop}
                                onChange={(e) => setParams({ ...params, stepAngle: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-30 transition-all"
                            />

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Rotation Pivot</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['auto', '1x1', '2x2'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setParams({ ...params, rotationPivotMode: mode })}
                                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                                                params.rotationPivotMode === mode 
                                                ? 'bg-brand-600 border-brand-400 text-white shadow-lg' 
                                                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                                            }`}
                                        >
                                            {mode === 'auto' ? 'Auto' : mode === '1x1' ? '1x1' : '2x2'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-gray-600 italic">
                                    {params.rotationPivotMode === 'auto' && 'Auto-calculate mathematical center.'}
                                    {params.rotationPivotMode === '1x1' && 'Rotate around a single center pixel.'}
                                    {params.rotationPivotMode === '2x2' && 'Rotate around the intersection of 4 pixels.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-6 bg-gray-800/30 rounded-2xl border transition-all ${params.enableMovement ? 'border-brand-500/50 shadow-lg shadow-brand-500/5' : 'border-gray-700'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                        <input 
                            type="checkbox" id="enable-movement"
                            checked={params.enableMovement}
                            onChange={(e) => setParams({ ...params, enableMovement: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-brand-500 focus:ring-brand-500" 
                        />
                        <label htmlFor="enable-movement" className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] flex items-center space-x-2 cursor-pointer">
                            <Move size={14} className={params.enableMovement ? 'text-brand-400' : 'text-gray-500'} />
                            <span>Incremental Movement</span>
                        </label>
                    </div>
                    
                    {params.enableMovement && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95">
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

                            <div className="space-y-4 pt-2 border-t border-gray-700/50">
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default MotionTab;
