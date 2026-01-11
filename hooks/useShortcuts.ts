import { useEffect } from 'react';
import { ToolType } from '../types';

interface ShortcutProps {
    undo: () => void;
    redo: () => void;
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    setOnionSkinEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
    setIsPlaying: (val: boolean | ((prev: boolean) => boolean)) => void;
    onTransform: (type: 'flipH' | 'flipV' | 'rotate') => void;
}

export const useShortcuts = ({
    undo,
    redo,
    activeTool,
    setActiveTool,
    setOnionSkinEnabled,
    setIsPlaying,
    onTransform,
}: ShortcutProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            )
                return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "z") {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                } else if (e.key === "y") {
                    e.preventDefault();
                    redo();
                }
                return;
            }
            switch (e.key.toLowerCase()) {
                case "s":
                    setActiveTool("select");
                    break;
                case "w":
                    setActiveTool("magicWand");
                    break;
                case "p":
                    setActiveTool("pen");
                    break;
                case "e":
                    setActiveTool("eraser");
                    break;
                case "f":
                    setActiveTool("fill");
                    break;
                case "i":
                    setActiveTool("picker");
                    break;
                case "h":
                    setActiveTool("hotspot");
                    break;
                case "o":
                    setOnionSkinEnabled((prev) => !prev);
                    break;
                case "r":
                    if (activeTool !== 'rect') onTransform('rotate');
                    break;
                case "x":
                    onTransform('flipH');
                    break;
                case "v":
                    onTransform('flipV');
                    break;
                case " ":

                    e.preventDefault();
                    setIsPlaying((prev) => !prev);
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo, setActiveTool, setOnionSkinEnabled, setIsPlaying, activeTool, onTransform]);
};
