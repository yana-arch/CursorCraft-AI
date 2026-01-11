import JSZip from 'jszip';
import { SavedProject } from './storage';
import { generateCurFile } from './curEncoder';
import { generateAniFile } from './aniEncoder';
import { composeLayers } from './layerUtils';

export const generateCursorPackageZip = async (projects: SavedProject[], packageName: string): Promise<Blob> => {
    const zip = new JSZip();
    const folder = zip.folder(packageName);

    if (!folder) throw new Error("Failed to create folder in ZIP");

    for (const project of projects) {
        const frames = project.data.frames;
        const hotspot = project.data.hotspot;
        const role = project.role || 'default';
        
        // Use role as filename, or fallback to name if role is not set or duplicated
        const fileName = `${role}`;
        
        let cursorBlob: Blob;
        
        if (frames.length > 1) {
            const framesWithCompositeGrid = frames.map((f) => ({ 
                ...f, 
                grid: composeLayers(f.layers) 
            }));
            cursorBlob = generateAniFile(framesWithCompositeGrid, hotspot, project.name);
        } else {
            const compositeGrid = composeLayers(frames[0].layers);
            cursorBlob = generateCurFile(compositeGrid, hotspot);
        }

        const extension = frames.length > 1 ? '.ani' : '.cur';
        folder.file(fileName + extension, cursorBlob);
    }

    // Optional: Add a simple install.inf if we want to be fancy, 
    // but the user just asked for grouping into a folder/package.
    
    return await zip.generateAsync({ type: 'blob' });
};
