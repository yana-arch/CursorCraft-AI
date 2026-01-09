import React, { useState, useEffect } from 'react';
import { Play, Film, X, Info, RotateCw, Move, Maximize, Sun, Palette, Zap, Settings2, Wind, Crosshair, MapPin, Trash2 } from 'lucide-react';
import { AnimationParams, AnimationSettings, EasingType, Point } from '../types';

interface AnimationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (params: AnimationParams) => void;
    settings: AnimationSettings;
    // Selection for initial values
    selection?: any;
    // Path Picking state communication
    isPickingPivot: boolean;
    setIsPickingPivot: (v: boolean) => void;
    isPickingPath: boolean;
    setIsPickingPath: (v: boolean) => void;
    pathPivot?: Point;
    pathPoints: Point[];
    setPathPoints: (p: Point[]) => void;
}

type TabType = 'general' | 'motion' | 'visuals' | 'special';

const AnimationWizard: React.FC<AnimationWizardProps> = ({ 
    isOpen, onClose, onGenerate, settings, 
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
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[480px] bg-gray-850 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 shrink-0">
                    <div className="flex items-center space-x-2 text-brand-400">
                        <Film size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Animation Wizard</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex bg-gray-900 border-b border-gray-700 shrink-0">
                    {renderTabButton('general', <Settings2 size={14} />, 'General')}
                    {renderTabButton('motion', <Move size={14} />, 'Motion')}
                    {renderTabButton('visuals', <Sun size={14} />, 'Visuals')}
                    {renderTabButton('special', <Wind size={14} />, 'Special')}
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
                            <div className="flex items-start space-x-3 p-3 bg-brand-900/20 border border-brand-500/30 rounded-lg">
                                <Info size={16} className="text-brand-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-300 leading-relaxed">
                                    Define the duration and timing of your animation sequence. 
                                    Mode: <span className="text-brand-400 font-bold">{settings.defaultMode.toUpperCase()}</span>.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                                        <span>Total Frames to Generate</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="60"
                                        value={params.framesCount}
                                        onChange={(e) => setParams({ ...params, framesCount: parseInt(e.target.value) || 2 })}
                                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                                        <Zap size={12} />
                                        <span>Movement Easing</span>
                                    </label>
                                    <select
                                        value={params.easing}
                                        onChange={(e) => setParams({ ...params, easing: e.target.value as EasingType })}
                                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                    >
                                        <option value="linear">Linear (Constant)</option>
                                        <option value="easeIn">Ease In (Accelerate)</option>
                                        <option value="easeOut">Ease Out (Decelerate)</option>
                                        <option value="easeInOut">Ease In-Out (Smooth)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'motion' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
                            <div className="space-y-4">
                                {/* Rotation Step */}
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center space-x-2">
                                            <RotateCw size={14} className="text-brand-400" />
                                            <span>Incremental Rotation</span>
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={params.stepAngle}
                                            disabled={params.isLoop}
                                            onChange={(e) => setParams({ ...params, stepAngle: parseFloat(e.target.value) || 0 })}
                                            className={`w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500 ${params.isLoop ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                        <label className="absolute right-3 top-2 flex items-center space-x-1 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={params.isLoop}
                                                onChange={(e) => setParams({ ...params, isLoop: e.target.checked })}
                                                className="w-3 h-3 rounded border-gray-700 bg-gray-900 text-brand-500 focus:ring-brand-500" 
                                            />
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">Auto-Loop</span>
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic">Rotate the selection by this many degrees on each new frame.</p>
                                </div>

                                {/* Movement Steps */}
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
                                    <label className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center space-x-2">
                                        <Move size={14} className="text-brand-400" />
                                        <span>Incremental Movement</span>
                                    </label>
                                    <div className="flex space-x-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-2 top-2 text-[10px] text-gray-600">X</span>
                                            <input
                                                type="number"
                                                value={params.stepX}
                                                onChange={(e) => setParams({ ...params, stepX: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-6 pr-2 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <span className="absolute left-2 top-2 text-[10px] text-gray-600">Y</span>
                                            <input
                                                type="number"
                                                value={params.stepY}
                                                onChange={(e) => setParams({ ...params, stepY: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-6 pr-2 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic">Move the selection by this many pixels on each new frame.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'visuals' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
                            <div className="space-y-4">
                                {/* Scale & Opacity */}
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2 border-b border-gray-700 pb-2 mb-2">
                                        <label className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center space-x-2">
                                            <Maximize size={14} className="text-brand-400" />
                                            <span>Transform Effects</span>
                                        </label>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Scale Factor</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                value={params.stepScale}
                                                onChange={(e) => setParams({ ...params, stepScale: parseFloat(e.target.value) || 1 })}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                            />
                                            <span className="absolute right-3 top-2 text-[10px] text-gray-600">x</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Opacity Factor</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                min="0"
                                                max="1"
                                                value={params.stepOpacity}
                                                onChange={(e) => setParams({ ...params, stepOpacity: parseFloat(e.target.value) || 1 })}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                            />
                                            <span className="absolute right-3 top-2 text-[10px] text-gray-600">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Hue Shift */}
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
                                    <label className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center space-x-2">
                                        <Palette size={14} className="text-brand-400" />
                                        <span>Color Cycling</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={params.stepHue}
                                            onChange={(e) => setParams({ ...params, stepHue: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                        />
                                        <span className="absolute right-3 top-2 text-[10px] text-gray-600">deg</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic">Shift the color hue on each frame (rainbow effect).</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'special' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
                            <div className="space-y-4">
                                {/* Sway Effect */}
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center space-x-2">
                                            <Wind size={14} className="text-brand-400" />
                                            <span>Sway / Tail Wagging</span>
                                        </label>
                                        <button
                                            onClick={() => setParams({ ...params, enableSway: !params.enableSway })}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${params.enableSway ? 'bg-brand-600' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${params.enableSway ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {params.enableSway && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Amplitude (°)</span>
                                                <input
                                                    type="number"
                                                    value={params.swayAngle}
                                                    onChange={(e) => setParams({ ...params, swayAngle: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Cycle Period (frames)</span>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    value={params.swayPeriod}
                                                    onChange={(e) => setParams({ ...params, swayPeriod: parseInt(e.target.value) || 2 })}
                                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                                                />
                                            </div>

                                            <div className="space-y-1 col-span-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Rigid Root Area (px)</span>
                                                    <span className="text-[10px] text-brand-400 font-mono">{params.swayRigidArea}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="16"
                                                    value={params.swayRigidArea}
                                                    onChange={(e) => setParams({ ...params, swayRigidArea: parseInt(e.target.value) })}
                                                    className="w-full accent-brand-500 bg-gray-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <p className="text-[9px] text-gray-600 mt-1">Number of pixels from the pivot that remain stationary.</p>
                                            </div>

                                            <div className="col-span-2 space-y-2">

                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Pivot Point (Fixed Root)</span>
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

                                {/* Path-based Deformation */}
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center space-x-2">
                                                <MapPin size={14} className="text-purple-400" />
                                                <span>Path Bending (IK)</span>
                                            </label>
                                            <p className="text-[10px] text-gray-500 italic">Advanced: Bend tail to reach target points.</p>
                                        </div>
                                        <button
                                            onClick={() => setParams({ ...params, enablePathDeform: !params.enablePathDeform })}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${params.enablePathDeform ? 'bg-brand-600' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${params.enablePathDeform ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {params.enablePathDeform && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95">
                                            {/* Step 1: Pick Pivot */}
                                            <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-700">
                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Step 1: Root Pivot (X)</span>
                                                    <p className="text-[9px] text-brand-400 font-mono">
                                                        {pathPivot ? `(${pathPivot.x}, ${pathPivot.y})` : 'Not set'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setIsPickingPivot(!isPickingPivot);
                                                        setIsPickingPath(false);
                                                    }}
                                                    className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${isPickingPivot ? 'bg-brand-500 text-white animate-pulse' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                                >
                                                    {isPickingPivot ? 'Click on Canvas' : 'Pick on Canvas'}
                                                </button>
                                            </div>

                                            {/* Step 2: Pick Target Points */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Step 2: Target Points (N)</span>
                                                    <div className="flex space-x-1">
                                                        <button 
                                                            onClick={() => setPathPoints([])}
                                                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                                            title="Clear points"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setIsPickingPath(!isPickingPath);
                                                                setIsPickingPivot(false);
                                                            }}
                                                            className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${isPickingPath ? 'bg-purple-500 text-white animate-pulse' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                                        >
                                                            {isPickingPath ? 'Click Targets' : 'Add Targets'}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar p-1">
                                                    {pathPoints.length === 0 && <span className="text-[9px] text-gray-600 italic">No target points added yet.</span>}
                                                    {pathPoints.map((p, i) => (
                                                        <div key={i} className="bg-gray-900 border border-purple-500/30 text-purple-400 text-[9px] px-2 py-1 rounded-md font-mono">
                                                            N{i+1}: {p.x},{p.y}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] text-gray-500 leading-relaxed">
                                                    * Selection will bend to reach each point N sequence.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex justify-between items-center shrink-0">
                    <p className="text-[10px] text-gray-500 max-w-[200px]">
                        The selected object will be transformed across {params.framesCount} frames.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onGenerate(params)}
                            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-brand-500/20"
                        >
                            <Play size={16} fill="currentColor" />
                            <span>Generate</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimationWizard;
