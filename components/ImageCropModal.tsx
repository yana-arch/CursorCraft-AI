import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Move, Maximize2 } from 'lucide-react';

interface ImageCropModalProps {
    imageSrc: string;
    onConfirm: (crop: { x: number, y: number, size: number }) => void;
    onCancel: () => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageSrc, onConfirm, onCancel }) => {
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0, size: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImgElement(img);
            // Default crop: square in the center
            const minDim = Math.min(img.naturalWidth, img.naturalHeight);
            setCrop({
                x: (img.naturalWidth - minDim) / 2,
                y: (img.naturalHeight - minDim) / 2,
                size: minDim
            });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    useEffect(() => {
        if (!imgElement || !containerRef.current) return;
        const container = containerRef.current;
        const s = Math.min(
            (container.clientWidth - 40) / imgElement.naturalWidth,
            (container.clientHeight - 40) / imgElement.naturalHeight
        );
        setScale(s);
    }, [imgElement]);

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
        e.preventDefault();
        if (type === 'move') setIsDragging(true);
        else setIsResizing(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging && !isResizing) return;
        if (!imgElement) return;

        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;

        if (isDragging) {
            setCrop(prev => ({
                ...prev,
                x: Math.round(Math.max(0, Math.min(imgElement.naturalWidth - prev.size, prev.x + dx))),
                y: Math.round(Math.max(0, Math.min(imgElement.naturalHeight - prev.size, prev.y + dy)))
            }));
        } else if (isResizing) {
            const delta = Math.max(dx, dy); // Keep square
            setCrop(prev => {
                const newSize = Math.round(Math.max(32, Math.min(
                    imgElement.naturalWidth - prev.x,
                    imgElement.naturalHeight - prev.y,
                    prev.size + delta
                )));
                return { ...prev, size: newSize };
            });
        }
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    if (!imgElement || !scale || isNaN(scale)) return null;

    const displayW = Math.max(0, imgElement.naturalWidth * scale);
    const displayH = Math.max(0, imgElement.naturalHeight * scale);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-8" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <div className="bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-w-5xl w-full max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800 shrink-0">
                    <div className="flex items-center space-x-3 text-brand-400">
                        <Maximize2 size={20} />
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Crop Image</h3>
                            <p className="text-[10px] text-gray-400 font-medium">Select a square area to convert into 32x32 pixels</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div ref={containerRef} className="flex-1 bg-gray-900 flex items-center justify-center relative min-h-[400px] overflow-hidden p-10">
                    <div className="relative" style={{ width: `${displayW}px`, height: `${displayH}px` }}>
                        {/* Base Image */}
                        <img src={imageSrc} style={{ width: `${displayW}px`, height: `${displayH}px` }} alt="to crop" className="opacity-40 select-none" draggable={false} />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                        {/* Crop Area */}
                        <div 
                            className="absolute border-2 border-brand-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move group"
                            style={{
                                left: `${crop.x * scale}px`,
                                top: `${crop.y * scale}px`,
                                width: `${crop.size * scale}px`,
                                height: `${crop.size * scale}px`
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'move')}
                        >
                            {/* Grid helpers */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                                {[...Array(9)].map((_, i) => <div key={i} className="border border-white/20" />)}
                            </div>

                            {/* Resize Handle */}
                            <div 
                                className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center cursor-se-resize shadow-lg hover:scale-110 transition-transform"
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize'); }}
                            >
                                <Maximize2 size={12} className="text-white rotate-90" />
                            </div>

                            {/* Center Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Move size={24} className="text-brand-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-800/50 border-t border-gray-700 flex justify-between items-center shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase">Selection Info</span>
                        <span className="text-xs font-mono text-brand-400">{Math.round(crop.size)} x {Math.round(crop.size)} px</span>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(crop)}
                            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-brand-500/20 active:scale-95"
                        >
                            <Check size={16} />
                            <span>Confirm & Import</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;
