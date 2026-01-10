import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Film, X, Info, RotateCw, Move, Maximize, Sun, Palette, Zap, Settings2, Wind, Crosshair, MapPin, Trash2, ArrowLeftRight, Eye } from 'lucide-react';
import { AnimationParams, AnimationSettings, EasingType, Point, SelectionState } from '../types';
import { getEasingValue } from '../utils/layerUtils';

interface AnimationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (params: AnimationParams) => void;
    settings: AnimationSettings;
    selection: SelectionState | null;
    isPickingPivot: boolean;
    setIsPickingPivot: (v: boolean) => void;
    isPickingPath: boolean;
    setIsPickingPath: (v: boolean) => void;
    pathPivot?: Point;
    pathPoints: Point[];
    setPathPoints: (p: Point[]) => void;
}

type TabType = 'general' | 'motion' | 'visuals' | 'special';

const AnimationPreview: React.FC<{ 
    selection: SelectionState, 
    params: AnimationParams, 
    pathPivot?: Point 
}> = ({ selection, params, pathPivot }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [frame, setFrame] = useState(0);
    const requestRef = useRef<number>(undefined);

    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = selection.w;
        canvas.height = selection.h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            selection.floatingPixels.forEach((row, y) => {
                row.forEach((color, x) => {
                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, 1, 1);
                    }
                });
            });
            setPreviewUrl(canvas.toDataURL());
        }
    }, [selection]);

    const animate = (time: number) => {
        const totalFrames = params.framesCount;
        const cycleMs = totalFrames * 100; 
        const t = (time % cycleMs) / cycleMs;
        setFrame(Math.floor(t * totalFrames));
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [params.framesCount]);

    const currentTransform = useMemo(() => {
        const step = frame % params.framesCount;
        const t = step / (params.framesCount - 1 || 1);
        let progressT = t;
        
        if (params.isBoomerang) {
            progressT = t <= 0.5 ? t * 2 : (1 - t) * 2;
        }

        const easedT = getEasingValue(progressT, params.easing);
        const currentAngle = (selection.angle || 0) + params.stepAngle * easedT * (params.framesCount - 1);
        
        let currentX = selection.x + params.stepX * easedT * (params.framesCount - 1);
        let currentY = selection.y + params.stepY * easedT * (params.framesCount - 1);

        if (params.pathPoints && params.pathPoints.length > 0) {
            const allPoints = [{ x: selection.x, y: selection.y }, ...params.pathPoints];
            const segmentsCount = allPoints.length - 1;
            const scaledT = easedT * segmentsCount;
            const idx = Math.min(Math.floor(scaledT), segmentsCount - 1);
            const segmentT = scaledT - idx;
            const p1 = allPoints[idx];
            const p2 = allPoints[idx + 1];
            currentX = p1.x + (p2.x - p1.x) * segmentT;
            currentY = p1.y + (p2.y - p1.y) * segmentT;
        }

        const currentScale = Math.pow(params.stepScale, easedT * (params.framesCount - 1));
        const currentOpacity = Math.pow(params.stepOpacity, easedT * (params.framesCount - 1));
        const currentHue = params.stepHue * easedT * (params.framesCount - 1);

        let swayRotation = 0;
        if (params.enableSway) {
            swayRotation = params.swayAngle * Math.sin((2 * Math.PI * step) / params.swayPeriod);
        }

        return {
            x: (currentX - selection.x) * 4, 
            y: (currentY - selection.y) * 4,
            rotate: (currentAngle - (selection.angle || 0)) + swayRotation,
            scale: currentScale,
            opacity: currentOpacity,
            hue: currentHue
        };
    }, [frame, params, selection]);

    return (
        <div className="relative w-40 h-40 bg-gray-950 border border-gray-700 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-10" 
                 style={{ 
                    backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                 }} 
            />
            <div 
                className="absolute transition-none"
                style={{
                    width: selection.w * 4,
                    height: selection.h * 4,
                    transform: `translate(${currentTransform.x}px, ${currentTransform.y}px) rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`,
                    opacity: currentTransform.opacity,
                    filter: `hue-rotate(${currentTransform.hue}deg)`,
                    imageRendering: 'pixelated'
                }}
            >
                {previewUrl && <img src={previewUrl} className="w-full h-full" alt="preview" />}
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 font-bold tracking-widest bg-black/40 px-2 py-0.5 rounded-full">
                LIVE
            </div>
        </div>
    );
};

const AnimationWizard: React.FC<AnimationWizardProps> = ({ 
    isOpen, onClose, onGenerate, settings, selection,
    isPickingPivot, setIsPickingPivot, isPickingPath, setIsPickingPath, 
    pathPivot, pathPoints = [], setPathPoints 
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [params, setParams] = useState<AnimationParams>({
        framesCount: settings.defaultFramesCount,
        stepX: 0,
        stepY: 0,
        stepAngle: 0,
        stepScale: 1.0,
        stepOpacity: 1.0,
        stepHue: 0,
        easing: 'linear',
        isLoop: false,
        isBoomerang: false,
        enableSway: false,
        swayAngle: 15,
        swayPeriod: 8,
        swayPivot: 'left',
        swayRigidArea: 0,
        enablePathDeform: false,
        pathPoints: []
    });

    useEffect(() => {
        setParams(prev => ({ ...prev, pathPoints }));
    }, [pathPoints]);

    useEffect(() => {
        if (params.isLoop) {
            setParams(prev => ({ ...prev, stepAngle: Number((360 / prev.framesCount).toFixed(2)) }));
        }
    }, [params.isLoop, params.framesCount]);

    if (!isOpen) return null;

    const renderTabButton = (id: TabType, icon: React.ReactNode, label: string) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeTab === id 
                ? 'text-brand-400 border-brand-500 bg-brand-500/5' 
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50 shrink-0">
                    <div className="flex items-center space-x-3 text-brand-400">
                        <div className="p-2 bg-brand-500/10 rounded-lg">
                            <Film size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Animation Wizard</h3>
                            <p className="text-[10px] text-gray-400 font-medium">Transform selection into smooth animation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* Left: Controls */}
                    <div className="flex-1 flex flex-col border-r border-gray-700 bg-gray-900/20">
                        <div className="flex border-b border-gray-700 shrink-0 px-2">
                            {renderTabButton('general', <Settings2 size={14} />, 'General')}
                            {renderTabButton('motion', <Move size={14} />, 'Motion')}
                            {renderTabButton('visuals', <Sun size={14} />, 'Visuals')}
                            {renderTabButton('special', <Wind size={14} />, 'Special')}
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            {activeTab === 'general' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center space-x-2">
                                                <span>Total Frames</span>
                                            </label>
                                            <input
                                                type="number" min="2" max="60"
                                                value={params.framesCount}
                                                onChange={(e) => setParams({ ...params, framesCount: parseInt(e.target.value) || 2 })}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center space-x-2">
                                                <ArrowLeftRight size={12} />
                                                <span>Playback Mode</span>
                                            </label>
                                            <div className="flex items-center space-x-4 bg-gray-950 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors cursor-pointer group"
                                                 onClick={() => setParams({ ...params, isBoomerang: !params.isBoomerang })}>
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

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center space-x-2">
                                                <Zap size={12} />
                                                <span>Interpolation</span>
                                            </label>
                                            <select
                                                value={params.easing}
                                                onChange={(e) => setParams({ ...params, easing: e.target.value as EasingType })}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all appearance-none"
                                            >
                                                <option value="linear">Linear (Constant Speed)</option>
                                                <option value="easeIn">Ease In (Accelerate)</option>
                                                <option value="easeOut">Ease Out (Decelerate)</option>
                                                <option value="easeInOut">Ease In-Out (Smooth)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'motion' && (
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
                            )}

                            {activeTab === 'visuals' && (
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
                            )}

                            {activeTab === 'special' && (
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
                                                        <p className="text-[10px] text-brand-400 font-mono">
                                                            {pathPivot ? `${pathPivot.x}, ${pathPivot.y}` : 'NOT SET'}
                                                        </p>
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
                                                                onClick={() => { setIsPickingPath(!isPickingPath); setIsPickingPivot(false); }}
                                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isPickingPath ? 'bg-purple-500 text-white animate-pulse' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}
                                                            >
                                                                {isPickingPath ? 'Click Targets' : 'Add Targets'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-3 bg-gray-950 rounded-xl border border-gray-700">
                                                        {pathPoints.length === 0 && <span className="text-[10px] text-gray-600 italic">Add points to see the bend.</span>}
                                                        {pathPoints.map((p, i) => (
                                                            <div key={i} className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] px-3 py-1.5 rounded-lg font-black flex items-center space-x-2">
                                                                <span className="opacity-50">T{i+1}</span>
                                                                <span>{p.x}, {p.y}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Real-time Preview Panel */}
                    <div className="w-[320px] bg-gray-900/50 flex flex-col p-8 items-center border-l border-gray-700 shrink-0">
                        <div className="w-full flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2 text-gray-400 uppercase tracking-[0.2em] text-[10px] font-black">
                                <Eye size={12} className="text-brand-400" />
                                <span>Real-time Preview</span>
                            </div>
                        </div>
                        
                        {selection ? (
                            <AnimationPreview selection={selection} params={params} pathPivot={pathPivot} />
                        ) : (
                            <div className="w-40 h-40 bg-gray-950 border border-dashed border-gray-700 rounded-2xl flex items-center justify-center text-center p-6">
                                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-loose">Make a selection to preview</span>
                            </div>
                        )}

                        <div className="mt-8 w-full space-y-6">
                            <div className="p-5 bg-gray-800/50 rounded-2xl border border-gray-700 shadow-xl">
                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">Sequence Stats</div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 font-medium">Frames:</span>
                                        <span className="text-white font-black bg-brand-500/20 px-2 py-0.5 rounded-md">{params.framesCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 font-medium">Easing:</span>
                                        <span className="text-white font-black italic">{params.easing}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 font-medium">Points:</span>
                                        <span className="text-white font-black">{pathPoints.length} set</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 text-gray-500">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                <p className="text-[10px] leading-relaxed font-medium">
                                    Preview is an approximation. Final render will use pixel-perfect algorithms.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-800/50 border-t border-gray-700 flex justify-end items-center shrink-0 space-x-4">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={() => onGenerate(params)}
                        className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-brand-500/20 active:scale-95"
                    >
                        <Play size={16} fill="currentColor" />
                        <span>Generate</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnimationWizard;
