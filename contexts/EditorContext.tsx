import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToolType, Point, SelectionState, AnimationSettings, DrawMode } from '../types';

interface EditorContextType {
    activeTool: ToolType;
    setActiveTool: (t: ToolType) => void;
    primaryColor: string;
    setPrimaryColor: (c: string) => void;
    secondaryColor: string;
    setSecondaryColor: (c: string) => void;
    brushSize: number;
    setBrushSize: (s: number) => void;
    drawMode: DrawMode;
    setDrawMode: (m: DrawMode) => void;
    isPlaying: boolean;
    setIsPlaying: (v: boolean) => void;
    activeTab: 'properties' | 'layers';
    setActiveTab: (t: 'properties' | 'layers') => void;
    isLibraryOpen: boolean;
    setIsLibraryOpen: (v: boolean) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (v: boolean) => void;
    isWizardOpen: boolean;
    setIsWizardOpen: (v: boolean) => void;
    onionSkinEnabled: boolean;
    setOnionSkinEnabled: (v: boolean) => void;
    onionSkinOpacity: number;
    setOnionSkinOpacity: (v: number) => void;
    onionSkinRange: number;
    setOnionSkinRange: (v: number) => void;
    
    // Generic Custom Pivot State
    customPivot: Point | undefined;
    setCustomPivot: (p: Point | undefined) => void;
    isPickingCustomPivot: boolean;
    setIsPickingCustomPivot: (v: boolean) => void;

    // Path Deform State
    pathPoints: Point[];
    setPathPoints: (p: Point[]) => void;
    isPickingPath: boolean;
    setIsPickingPath: (v: boolean) => void;

    settings: AnimationSettings;
    saveSettings: (s: AnimationSettings) => void;
    selection: SelectionState | null;
    setSelection: (s: SelectionState | null) => void;
    magicWandTolerance: number;
    setMagicWandTolerance: (v: number) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');
    const [secondaryColor, setSecondaryColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(1);
    const [drawMode, setDrawMode] = useState<DrawMode>('stroke');
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);
    const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3);
    const [onionSkinRange, setOnionSkinRange] = useState(1);

    // Generic Custom Pivot State
    const [customPivot, setCustomPivot] = useState<Point | undefined>(undefined);
    const [isPickingCustomPivot, setIsPickingCustomPivot] = useState(false);

    // Path Deform State
    const [pathPoints, setPathPoints] = useState<Point[]>([]);
    const [isPickingPath, setIsPickingPath] = useState(false);

    const [settings, setSettings] = useState<AnimationSettings>(() => {
        const saved = localStorage.getItem('cursorcraft_settings');
        return saved ? JSON.parse(saved) : {
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
    const [magicWandTolerance, setMagicWandTolerance] = useState(0);

    const value: EditorContextType = {
        activeTool, setActiveTool,
        primaryColor, setPrimaryColor,
        secondaryColor, setSecondaryColor,
        brushSize, setBrushSize,
        drawMode, setDrawMode,
        isPlaying, setIsPlaying,
        activeTab, setActiveTab,
        isLibraryOpen, setIsLibraryOpen,
        isSettingsOpen, setIsSettingsOpen,
        isWizardOpen, setIsWizardOpen,
        onionSkinEnabled, setOnionSkinEnabled,
        onionSkinOpacity, setOnionSkinOpacity,
        onionSkinRange, setOnionSkinRange,
        customPivot, setCustomPivot,
        isPickingCustomPivot, setIsPickingCustomPivot,
        pathPoints, setPathPoints,
        isPickingPath, setIsPickingPath,
        settings, saveSettings,
        selection, setSelection,
        magicWandTolerance, setMagicWandTolerance
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) throw new Error('useEditor must be used within an EditorProvider');
    return context;
};
