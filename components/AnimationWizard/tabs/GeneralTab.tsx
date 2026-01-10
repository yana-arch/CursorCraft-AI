import React from 'react';
import { ArrowLeftRight, Zap } from 'lucide-react';
import { AnimationParams, EasingType } from '../../../types';

interface GeneralTabProps {
    params: AnimationParams;
    setParams: (p: AnimationParams) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ params, setParams }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]"><span>Total Frames</span></label>
                    <input 
                        type="number" min="2" max="60" 
                        value={params.framesCount} 
                        onChange={(e) => setParams({ ...params, framesCount: parseInt(e.target.value) || 2 })} 
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" 
                    />
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
    );
};

export default GeneralTab;
