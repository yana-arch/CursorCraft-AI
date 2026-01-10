import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye } from 'lucide-react';
import { AnimationParams, SelectionState, Point } from '../../types';
import { getEasingValue } from '../../utils/layerUtils';

interface AnimationPreviewProps {
    selection: SelectionState;
    params: AnimationParams;
    pathPivot?: Point;
}

const AnimationPreview: React.FC<AnimationPreviewProps> = ({ selection, params, pathPivot }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [frame, setFrame] = useState(0);
    const requestRef = useRef<number>(undefined);

    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = selection.w;
        canvas.height = selection.h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            selection.floatingPixels.forEach((row, y) => {
                row.forEach((color, x) => {
                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, 1, 1);
                    }
                });
            });
            setPreviewUrl(canvas.toDataURL());
        }
    }, [selection]);

    const animate = (time: number) => {
        const totalFrames = params.framesCount;
        const cycleMs = totalFrames * 100; 
        const t = (time % cycleMs) / cycleMs;
        setFrame(Math.floor(t * totalFrames));
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [params.framesCount]);

    const currentTransform = useMemo(() => {
        const step = frame % params.framesCount;
        const t = step / (params.framesCount - 1 || 1);
        let progressT = t;
        if (params.isBoomerang) progressT = t <= 0.5 ? t * 2 : (1 - t) * 2;
        const easedT = getEasingValue(progressT, params.easing);
        const currentAngle = (selection.angle || 0) + params.stepAngle * easedT * (params.framesCount - 1);
        let currentX = selection.x + params.stepX * easedT * (params.framesCount - 1);
        let currentY = selection.y + params.stepY * easedT * (params.framesCount - 1);
        
        if (params.pathPoints && params.pathPoints.length > 0) {
            const allPoints = [{ x: selection.x, y: selection.y }, ...params.pathPoints];
            const segmentsCount = allPoints.length - 1;
            const scaledT = easedT * segmentsCount;
            const idx = Math.min(Math.floor(scaledT), segmentsCount - 1);
            const segmentT = scaledT - idx;
            const p1 = allPoints[idx], p2 = allPoints[idx + 1];
            currentX = p1.x + (p2.x - p1.x) * segmentT;
            currentY = p1.y + (p2.y - p1.y) * segmentT;
        }
        
        const currentScale = Math.pow(params.stepScale, easedT * (params.framesCount - 1));
        const currentOpacity = Math.pow(params.stepOpacity, easedT * (params.framesCount - 1));
        const currentHue = params.stepHue * easedT * (params.framesCount - 1);
        let swayRotation = params.enableSway ? params.swayAngle * Math.sin((2 * Math.PI * step) / params.swayPeriod) : 0;
        
        return { 
            x: (currentX - selection.x) * 4, 
            y: (currentY - selection.y) * 4, 
            rotate: (currentAngle - (selection.angle || 0)) + swayRotation, 
            scale: currentScale, 
            opacity: currentOpacity, 
            hue: currentHue 
        };
    }, [frame, params, selection]);

    return (
        <div className="w-[320px] bg-gray-900/50 flex flex-col p-8 items-center border-l border-gray-700 shrink-0">
            <div className="w-full flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 text-gray-400 uppercase tracking-[0.2em] text-[10px] font-black">
                    <Eye size={12} className="text-brand-400" />
                    <span>Real-time Preview</span>
                </div>
            </div>
            
            <div className="relative w-40 h-40 bg-gray-950 border border-gray-700 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px' }} />
                <div 
                    className="absolute transition-none"
                    style={{
                        width: selection.w * 4,
                        height: selection.h * 4,
                        transform: `translate(${currentTransform.x}px, ${currentTransform.y}px) rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`,
                        opacity: currentTransform.opacity,
                        filter: `hue-rotate(${currentTransform.hue}deg)`,
                        imageRendering: 'pixelated'
                    }}
                >
                    {previewUrl && <img src={previewUrl} className="w-full h-full" alt="preview" />}
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 font-bold tracking-widest bg-black/40 px-2 py-0.5 rounded-full">LIVE</div>
            </div>

            <div className="mt-8 w-full space-y-6">
                <div className="p-5 bg-gray-800/50 rounded-2xl border border-gray-700 shadow-xl">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">Sequence Stats</div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">Frames:</span>
                            <span className="text-white font-black bg-brand-500/20 px-2 py-0.5 rounded-md">{params.framesCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">Easing:</span>
                            <span className="text-white font-black italic">{params.easing}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">Points:</span>
                            <span className="text-white font-black">{params.pathPoints.length} set</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimationPreview;
