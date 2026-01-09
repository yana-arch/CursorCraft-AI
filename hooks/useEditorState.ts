import { useState, useCallback } from 'react';
import { ToolType, Point, SelectionState, AnimationSettings } from '../types';

export const useEditorState = () => {
    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');
    const [secondaryColor, setSecondaryColor] = useState('#000000');
    const [hotspot, setHotspot] = useState<Point>({ x: 0, y: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);

    // Path Deform State
    const [pathPivot, setPathPivot] = useState<Point | undefined>(undefined);
    const [pathPoints, setPathPoints] = useState<Point[]>([]);
    const [isPickingPivot, setIsPickingPivot] = useState(false);
    const [isPickingPath, setIsPickingPath] = useState(false);

    const [settings, setSettings] = useState<AnimationSettings>(() => {
        const saved = localStorage.getItem('cursorcraft_settings');
        return saved
            ? JSON.parse(saved)
            : {
                defaultMode: 'append',
                defaultFramesCount: 8,
                copyBackground: true,
            };
    });

    const saveSettings = useCallback((newSettings: AnimationSettings) => {
        setSettings(newSettings);
        localStorage.setItem('cursorcraft_settings', JSON.stringify(newSettings));
    }, []);

    const [selection, setSelection] = useState<SelectionState | null>(null);

    return {
        activeTool, setActiveTool,
        primaryColor, setPrimaryColor,
        secondaryColor, setSecondaryColor,
        hotspot, setHotspot,
        isPlaying, setIsPlaying,
        activeTab, setActiveTab,
        isLibraryOpen, setIsLibraryOpen,
        isSettingsOpen, setIsSettingsOpen,
        isWizardOpen, setIsWizardOpen,
        onionSkinEnabled, setOnionSkinEnabled,
        pathPivot, setPathPivot,
        pathPoints, setPathPoints,
        isPickingPivot, setIsPickingPivot,
        isPickingPath, setIsPickingPath,
        settings, saveSettings,
        selection, setSelection,
    };
};
