import { 
    Frame, 
    SelectionState, 
    AnimationParams, 
    AnimationSettings, 
    Point,
    GridData
} from '../types';
import { 
    createLayer, 
    rotatePixelsNN, 
    scalePixelsNN, 
    adjustOpacity, 
    shiftHue, 
    getEasingValue, 
    GRID_SIZE 
} from './layerUtils';
import { generateId } from './imageUtils';

export const calculateAnimationFrames = (
    sourceFrames: Frame[],
    activeFrameIndex: number,
    activeLayerId: string,
    selection: SelectionState,
    params: AnimationParams,
    settings: AnimationSettings,
    pathPivot?: Point
): Frame[] => {
    const {
        framesCount,
        enableRotation,
        stepX,
        stepY,
        enableMovement,
        stepAngle,
        enableScale,
        stepScale,
        enableOpacity,
        stepOpacity,
        enableHue,
        stepHue,
        easing,
        isBoomerang,
        rotationPivotMode,
        rotationCustomPivot,
        enableSway,
        swayAngle,
        swayPeriod,
        swayPivot,
        swayRigidArea,
        enablePathDeform,
        pathPoints,
    } = params;
    const { defaultMode, copyBackground } = settings;

    if (!sourceFrames[activeFrameIndex]) return sourceFrames;
    
    let newFrames = [...sourceFrames];
    const sourceFrame = sourceFrames[activeFrameIndex];
    const layerIndex = sourceFrame.layers.findIndex((l) => l.id === activeLayerId);
    if (layerIndex === -1) return sourceFrames;

    const getPositionAtT = (t: number): { x: number, y: number } => {
        if (!enableMovement) {
            return { x: selection.x, y: selection.y };
        }

        if (!pathPoints || pathPoints.length === 0) {
            return {
                x: selection.x + stepX * t * (framesCount - 1),
                y: selection.y + stepY * t * (framesCount - 1)
            };
        }

        // Interpolate through pathPoints
        const allPoints = [{ x: selection.x, y: selection.y }, ...pathPoints];
        const segmentsCount = allPoints.length - 1;
        const scaledT = t * segmentsCount;
        const index = Math.min(Math.floor(scaledT), segmentsCount - 1);
        const segmentT = scaledT - index;
        const p1 = allPoints[index], p2 = allPoints[index + 1];
        
        return {
            x: p1.x + (p2.x - p1.x) * segmentT,
            y: p1.y + (p2.y - p1.y) * segmentT
        };
    };

    const createTransformedLayer = (step: number) => {
        const t = step / (framesCount - 1);
        let progressT = t;
        if (isBoomerang) progressT = t <= 0.5 ? t * 2 : (1 - t) * 2;
        const easedT = getEasingValue(progressT, easing);
        
        let currentAngle = selection.angle;
        if (enableRotation) {
            currentAngle += stepAngle * easedT * (framesCount - 1);
        }

        const pos = getPositionAtT(easedT);
        let currentX = pos.x;
        let currentY = pos.y;
        
        let currentScale = enableScale ? Math.pow(stepScale, easedT * (framesCount - 1)) : 1.0;
        let currentOpacity = enableOpacity ? Math.pow(stepOpacity, easedT * (framesCount - 1)) : 1.0;
        let currentHue = enableHue ? stepHue * easedT * (framesCount - 1) : 0;

        if (enableSway)
            currentAngle += swayAngle * Math.sin((2 * Math.PI * step) / swayPeriod);

        let pixelsToMerge = selection.floatingPixels;
        if (Math.abs(currentScale - 1) > 0.01)
            pixelsToMerge = scalePixelsNN(pixelsToMerge, currentScale);

        let pivot: Point | undefined = undefined;
        if (enableSway) {
            switch (swayPivot) {
                case "left": pivot = { x: 0, y: selection.h / 2 }; break;
                case "right": pivot = { x: selection.w - 1, y: selection.h / 2 }; break;
                case "top": pivot = { x: selection.w / 2, y: 0 }; break;
                case "bottom": pivot = { x: selection.w / 2, y: selection.h - 1 }; break;
                case "center": pivot = { x: selection.w / 2, y: selection.h / 2 }; break;
                case "top-left": pivot = { x: 0, y: 0 }; break;
                case "top-right": pivot = { x: selection.w - 1, y: 0 }; break;
                case "bottom-left": pivot = { x: 0, y: selection.h - 1 }; break;
                case "bottom-right": pivot = { x: selection.w - 1, y: selection.h - 1 }; break;
            }
        }

        if (enablePathDeform && pathPivot && pathPoints.length > 0) {
            const targetPoint = pathPoints[Math.min(step, pathPoints.length - 1)];
            const dx = targetPoint.x - pathPivot.x,
                dy = targetPoint.y - pathPivot.y;
            currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
            pivot = {
                x: pathPivot.x - selection.x,
                y: pathPivot.y - selection.y,
            };
        }

        if (!pivot) {
            const w = selection.w;
            const h = selection.h;
            if (rotationPivotMode === '1x1') {
                pivot = { x: Math.floor((w - 1) / 2), y: Math.floor((h - 1) / 2) };
            } else if (rotationPivotMode === '2x2') {
                pivot = { x: Math.floor((w - 1) / 2) + 0.5, y: Math.floor((h - 1) / 2) + 0.5 };
            } else if (rotationPivotMode === 'custom' && rotationCustomPivot) {
                pivot = {
                    x: rotationCustomPivot.x - selection.x,
                    y: rotationCustomPivot.y - selection.y
                };
            }
        }

        if (Math.abs(currentAngle % 360) > 0.1 || enableSway || enablePathDeform)
            pixelsToMerge = rotatePixelsNN(pixelsToMerge, currentAngle, pivot);

        let finalX = currentX,
            finalY = currentY;
        const newH = pixelsToMerge.length,
            newW = pixelsToMerge[0].length;

        if ((enableSway || enablePathDeform) && pivot) {
            const rad = (currentAngle * Math.PI) / 180,
                cos = Math.cos(rad),
                sin = Math.sin(rad);
            const corners = [
                { x: 0, y: 0 },
                { x: selection.w - 1, y: 0 },
                { x: 0, y: selection.h - 1 },
                { x: selection.w - 1, y: selection.h - 1 },
            ];
            const rotatedCorners = corners.map((p) => {
                const dx = p.x - pivot!.x,
                    dy = p.y - pivot!.y;
                return {
                    x: pivot!.x + dx * cos - dy * sin,
                    y: pivot!.y + dx * sin + dy * cos,
                };
            });
            const minX = Math.min(...rotatedCorners.map((p) => p.x)),
                minY = Math.min(...rotatedCorners.map((p) => p.y));
            finalX -= pivot.x - minX;
            finalY -= pivot.y - minY;
            finalX += pivot.x;
            finalY += pivot.y;
        } else {
            finalX -= (newW - selection.w) / 2;
            finalY -= (newH - selection.h) / 2;
        }

        const newGrid = sourceFrame.layers[layerIndex].grid.map((row) => [...row]);
        for (let y = 0; y < newH; y++) {
            for (let x = 0; x < newW; x++) {
                const gx = Math.round(finalX) + x,
                    gy = Math.round(finalY) + y;
                if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                    let color = pixelsToMerge[y][x];
                    if (color) {
                        if (Math.abs(currentHue % 360) > 0.1)
                            color = shiftHue(color, currentHue);
                        if (currentOpacity < 0.99)
                            color = adjustOpacity(color, currentOpacity);
                        newGrid[gy][gx] = color;
                    }
                }
            }
        }
        if (enableSway && swayRigidArea > 0 && pivot) {
            for (let sy = 0; sy < selection.h; sy++) {
                for (let sx = 0; sx < selection.w; sx++) {
                    const dist = Math.sqrt(
                        Math.pow(sx - pivot.x, 2) + Math.pow(sy - pivot.y, 2)
                    );
                    if (dist <= swayRigidArea) {
                        const gx = Math.round(selection.x + sx),
                            gy = Math.round(selection.y + sy);
                        if (
                            selection.floatingPixels[sy][sx] &&
                            gx >= 0 &&
                            gx < GRID_SIZE &&
                            gy >= 0 &&
                            gy < GRID_SIZE
                        )
                            newGrid[gy][gx] = selection.floatingPixels[sy][sx];
                    }
                }
            }
        }
        return createLayer(sourceFrame.layers[layerIndex].name, newGrid);
    };

    const bakeInto = (frames: Frame[], idx: number, step: number) => {
        const layer = createTransformedLayer(step);
        const frame = { ...frames[idx] };
        frame.layers = [...frame.layers];
        if (layerIndex < frame.layers.length) frame.layers[layerIndex] = layer;
        else frame.layers.push(layer);
        frames[idx] = frame;
    };

    bakeInto(newFrames, activeFrameIndex, 0);
    if (defaultMode === "append") {
        const generated = [];
        for (let i = 1; i < framesCount; i++) {
            const layer = createTransformedLayer(i);
            const layers = copyBackground
                ? sourceFrame.layers.map((l, idx) =>
                    idx === layerIndex
                        ? layer
                        : {
                            ...l,
                            id: generateId(),
                            grid: l.grid.map((row) => [...row]),
                        }
                )
                : [layer];
            generated.push({
                id: generateId(),
                layers,
                duration: sourceFrame.duration,
            });
        }
        newFrames.splice(activeFrameIndex + 1, 0, ...generated);
    } else {
        for (let i = 1; i < framesCount; i++) {
            if (activeFrameIndex + i < newFrames.length)
                bakeInto(newFrames, activeFrameIndex + i, i);
            else {
                const layer = createTransformedLayer(i);
                const layers = copyBackground
                    ? sourceFrame.layers.map((l, idx) =>
                        idx === layerIndex
                            ? layer
                            : {
                                ...l,
                                id: generateId(),
                                grid: l.grid.map((row) => [...row]),
                            }
                    )
                    : [layer];
                newFrames.push({
                    id: generateId(),
                    layers,
                    duration: sourceFrame.duration,
                });
            }
        }
    }
    return newFrames;
};
