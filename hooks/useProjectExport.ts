import { useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { generateCurFile } from '../utils/curEncoder';
import { generateAniFile } from '../utils/aniEncoder';
import { generateWindowsInstallerZip } from '../utils/zipEncoder';
import { composeLayers } from '../utils/layerUtils';

export const useProjectExport = () => {
    const { frames, hotspot, activeFrame } = useProject();

    const handleExport = useCallback(() => {
        const compositeGrid = activeFrame ? composeLayers(activeFrame.layers) : Array(32).fill(null).map(() => Array(32).fill(''));
        const framesWithCompositeGrid = frames.map((f) => ({ ...f, grid: composeLayers(f.layers) }));

        let blob = framesWithCompositeGrid.length > 1
            ? generateAniFile(framesWithCompositeGrid, hotspot, "MyCursor")
            : generateCurFile(compositeGrid, hotspot);
            
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = framesWithCompositeGrid.length > 1 ? "cursor_animated.ani" : "cursor.cur";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }, [frames, hotspot, activeFrame]);

    const handleExportInstaller = useCallback(async () => {
        const compositeGrid = activeFrame ? composeLayers(activeFrame.layers) : Array(32).fill(null).map(() => Array(32).fill(''));
        const framesWithCompositeGrid = frames.map((f) => ({ ...f, grid: composeLayers(f.layers) }));

        let blob = framesWithCompositeGrid.length > 1
            ? generateAniFile(framesWithCompositeGrid, hotspot, "MyCursor")
            : generateCurFile(compositeGrid, hotspot);
            
        const zipBlob = await generateWindowsInstallerZip(
            blob, "MyCursor", framesWithCompositeGrid.length > 1 ? "ani" : "cur"
        );
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.download = "MyCursor_Installer.zip";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }, [frames, hotspot, activeFrame]);

    return { handleExport, handleExportInstaller };
};
