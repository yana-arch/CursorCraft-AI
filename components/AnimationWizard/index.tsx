import React, { useState, useEffect } from 'react';
import { Film, X, Settings2, Move, Sun, Wind, Play } from 'lucide-react';
import { AnimationParams } from '../../types';
import { useEditor } from '../../contexts/EditorContext';
import AnimationPreview from './AnimationPreview';
import GeneralTab from './tabs/GeneralTab';
import MotionTab from './tabs/MotionTab';
import VisualsTab from './tabs/VisualsTab';
import SpecialTab from './tabs/SpecialTab';

type TabType = 'general' | 'motion' | 'visuals' | 'special';

const AnimationWizard: React.FC<{ onGenerate: (params: AnimationParams) => void }> = ({ onGenerate }) => {
    const { 
        isWizardOpen, setIsWizardOpen, settings, selection, 
        isPickingPivot, setIsPickingPivot, isPickingPath, setIsPickingPath, 
        pathPivot, pathPoints, setPathPoints 
    } = useEditor();

    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [params, setParams] = useState<AnimationParams>({
        framesCount: settings.defaultFramesCount, stepX: 0, stepY: 0, stepAngle: 0, stepScale: 1.0, stepOpacity: 1.0, stepHue: 0,
        easing: 'linear', isLoop: false, isBoomerang: false, enableSway: false, swayAngle: 15, swayPeriod: 8, swayPivot: 'left', swayRigidArea: 0, enablePathDeform: false, pathPoints: []
    });

    useEffect(() => { setParams(prev => ({ ...prev, pathPoints })); }, [pathPoints]);
    useEffect(() => { if (params.isLoop) setParams(prev => ({ ...prev, stepAngle: Number((360 / prev.framesCount).toFixed(2)) })); }, [params.isLoop, params.framesCount]);

    if (!isWizardOpen) return null;

    const renderTabButton = (id: TabType, icon: React.ReactNode, label: string) => (
        <button onClick={() => setActiveTab(id)} className={`flex items-center space-x-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === id ? 'text-brand-400 border-brand-500 bg-brand-500/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800'}`}>
            {icon}<span>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50 shrink-0">
                    <div className="flex items-center space-x-3 text-brand-400">
                        <div className="p-2 bg-brand-500/10 rounded-lg"><Film size={20} /></div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Animation Wizard</h3>
                            <p className="text-[10px] text-gray-400 font-medium">Transform selection into smooth animation</p>
                        </div>
                    </div>
                    <button onClick={() => setIsWizardOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
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
                            {activeTab === 'general' && <GeneralTab params={params} setParams={setParams} />}
                            {activeTab === 'motion' && <MotionTab params={params} setParams={setParams} isPickingPath={isPickingPath} setIsPickingPath={setIsPickingPath} setIsPickingPivot={setIsPickingPivot} pathPoints={pathPoints} setPathPoints={setPathPoints} />}
                            {activeTab === 'visuals' && <VisualsTab params={params} setParams={setParams} />}
                            {activeTab === 'special' && <SpecialTab params={params} setParams={setParams} pathPivot={pathPivot} pathPoints={pathPoints} setPathPoints={setPathPoints} isPickingPivot={isPickingPivot} setIsPickingPivot={setIsPickingPivot} setIsPickingPath={setIsPickingPath} />}
                        </div>
                    </div>

                    {/* Right: Preview */}
                    {selection && <AnimationPreview selection={selection} params={params} pathPivot={pathPivot} />}
                    {!selection && (
                        <div className="w-[320px] bg-gray-900/50 flex flex-col p-8 items-center border-l border-gray-700 shrink-0 justify-center">
                            <div className="w-40 h-40 bg-gray-950 border border-dashed border-gray-700 rounded-2xl flex items-center justify-center text-center p-6">
                                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-loose">Make a selection to preview</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-800/50 border-t border-gray-700 flex justify-end items-center shrink-0 space-x-4">
                    <button onClick={() => setIsWizardOpen(false)} className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                    <button onClick={() => onGenerate(params)} className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-brand-500/20 active:scale-95">
                        <Play size={16} fill="currentColor" /><span>Generate</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnimationWizard;
