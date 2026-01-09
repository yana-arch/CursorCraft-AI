import React from 'react';
import { X, Save, Settings as SettingsIcon } from 'lucide-react';
import { AnimationSettings, AnimationMode } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AnimationSettings;
    onSave: (settings: AnimationSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = React.useState<AnimationSettings>(settings);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-96 bg-gray-850 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                    <div className="flex items-center space-x-2 text-brand-400">
                        <SettingsIcon size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Editor Settings</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Animation Mode */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Default Animation Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['append', 'overwrite'] as AnimationMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setLocalSettings({ ...localSettings, defaultMode: mode })}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                                        localSettings.defaultMode === mode
                                            ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 italic">
                            {localSettings.defaultMode === 'append' 
                                ? 'New frames will be added after the current frame.' 
                                : 'Existing frames will be updated or new ones created if needed.'}
                        </p>
                    </div>

                    {/* Default Frames Count */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Default Frames Count</label>
                        <input
                            type="number"
                            min="2"
                            max="60"
                            value={localSettings.defaultFramesCount}
                            onChange={(e) => setLocalSettings({ ...localSettings, defaultFramesCount: parseInt(e.target.value) || 8 })}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>

                    {/* Copy Background Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-gray-200">Sync Background</div>
                            <div className="text-[10px] text-gray-500">Copy context layers to new frames</div>
                        </div>
                        <button
                            onClick={() => setLocalSettings({ ...localSettings, copyBackground: !localSettings.copyBackground })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.copyBackground ? 'bg-brand-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.copyBackground ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-brand-500/20"
                    >
                        <Save size={16} />
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
