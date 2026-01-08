import { CursorProject, Frame, Point } from '../types';

const STORAGE_KEY = 'cursorcraft_projects';

export interface SavedProject {
    id: string;
    name: string;
    updatedAt: number;
    data: {
        frames: Frame[];
        hotspot: Point;
        primaryColor: string;
        secondaryColor: string;
    };
}

export const getSavedProjects = (): SavedProject[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load projects", e);
        return [];
    }
};

export const saveProject = (
    name: string,
    frames: Frame[],
    hotspot: Point,
    primaryColor: string,
    secondaryColor: string,
    existingId?: string
): SavedProject => {
    const projects = getSavedProjects();
    const now = Date.now();
    
    const newProject: SavedProject = {
        id: existingId || Math.random().toString(36).substr(2, 9),
        name,
        updatedAt: now,
        data: {
            frames,
            hotspot,
            primaryColor,
            secondaryColor
        }
    };

    let updatedProjects;
    if (existingId) {
        updatedProjects = projects.map(p => p.id === existingId ? newProject : p);
    } else {
        updatedProjects = [newProject, ...projects];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    return newProject;
};

export const deleteProject = (id: string) => {
    const projects = getSavedProjects();
    const updated = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
