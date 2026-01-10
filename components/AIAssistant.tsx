import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, MessageSquare, Image as ImageIcon, Crosshair, Film, Upload, X, ArrowDownToLine, Layers } from 'lucide-react';
import { generateCursorConcept, suggestCursorImprovements, detectHotspotAI, generateAnimationSequence, generateCursorFromImage, generateStructuredAnimation } from '../services/geminiService';
import { GridData, Point, AIAnimationResponse } from '../types';
import { useProject } from '../contexts/ProjectContext';

interface AIAssistantProps {
  currentGrid: GridData;
  onAddFrames: (base64Image: string) => void;
  onApplyImage: (base64Image: string) => void;
  onApplyStructuredAI?: (data: AIAnimationResponse) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentGrid, onAddFrames, onApplyImage, onApplyStructuredAI }) => {
  const { setHotspot } = useProject();
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [animationType, setAnimationType] = useState('Pulse');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get base64 of current grid
  const getGridBase64 = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        currentGrid.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            });
        });
        return canvas.toDataURL('image/png');
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            setReferenceImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) return;
    setIsLoading(true);
    setSuggestion(null);
    setGeneratedImage(null);

    try {
      let result: string | null = null;
      
      if (referenceImage) {
          result = await generateCursorFromImage(referenceImage, prompt);
      } else {
          result = await generateCursorConcept(prompt);
      }

      if (result) {
        setGeneratedImage(result);
      } else {
          setSuggestion("Generation returned no image.");
      }
    } catch (e) {
      console.error(e);
      setSuggestion("Error connecting to Gemini.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
      const b64 = getGridBase64();
      if (b64) {
          setIsLoading(true);
          setSuggestion(null);
          try {
            const advice = await suggestCursorImprovements(b64);
            setSuggestion(advice);
          } catch (e) {
            setSuggestion("Failed to analyze.");
          } finally {
            setIsLoading(false);
          }
      }
  };

  const handleSmartHotspot = async () => {
    const b64 = getGridBase64();
    if (b64) {
        setIsLoading(true);
        setSuggestion(null);
        try {
            const coords = await detectHotspotAI(b64);
            if (coords) {
                setHotspot({ x: coords.x, y: coords.y });
                setSuggestion(`Hotspot automatically set to (${coords.x}, ${coords.y}) based on cursor shape.`);
            } else {
                setSuggestion("Could not determine hotspot.");
            }
        } catch (e) {
            setSuggestion("AI Hotspot detection failed.");
        } finally {
            setIsLoading(false);
        }
    }
  };

  // NEW: Smart Structured Animation
  const handleSmartStructuredAnimate = async () => {
      // Use uploaded reference image OR current canvas if no upload
      const sourceImage = referenceImage || getGridBase64();
      const userPrompt = prompt.trim() || "Animate this cursor";

      if (sourceImage && onApplyStructuredAI) {
          setIsLoading(true);
          setSuggestion(null);
          try {
              const structuredData = await generateStructuredAnimation(sourceImage, userPrompt);
              if (structuredData) {
                  onApplyStructuredAI(structuredData);
                  setSuggestion(`Generated ${structuredData.metadata.total_frames} frames with separated Subject/Effect layers.`);
              } else {
                  setSuggestion("Failed to generate structured animation.");
              }
          } catch (e) {
              setSuggestion("AI Error.");
          } finally {
              setIsLoading(false);
          }
      } else {
          setSuggestion("Please upload an image or draw on canvas first.");
      }
  };

  // Old Image-based animation (Fallback)
  const handleSimpleAnimate = async () => {
    const b64 = getGridBase64();
    if (b64) {
        setIsLoading(true);
        setSuggestion(null);
        try {
            const sequenceBase64 = await generateAnimationSequence(b64, animationType);
            if (sequenceBase64) {
                onAddFrames(sequenceBase64);
                setSuggestion("Animation frames generated and added to timeline!");
            } else {
                setSuggestion("Failed to generate animation.");
            }
        } catch (e) {
            setSuggestion("AI Animation failed.");
        } finally {
            setIsLoading(false);
        }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="flex items-center space-x-2 mb-4 text-brand-500">
        <Sparkles size={18} />
        <h3 className="text-sm font-bold uppercase tracking-wider">AI Assistant</h3>
      </div>

      <div className="space-y-4">
        {/* Input Section */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Describe or Upload:</label>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                >
                    <Upload size={10} />
                    <span>Reference Img</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {referenceImage && (
                <div className="relative w-full h-20 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 group">
                    <img src={referenceImage} className="w-full h-full object-contain opacity-70" alt="ref" />
                    <button 
                        onClick={() => setReferenceImage(null)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-900/80 text-white rounded-full p-1"
                    >
                        <X size={12} />
                    </button>
                    <div className="absolute bottom-1 left-2 text-[9px] text-gray-400">Reference Loaded</div>
                </div>
            )}

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'Blue neon arrow with pulsating aura'..."
                className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-1 focus:ring-brand-500 outline-none resize-none h-20"
            />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-[10px] font-bold py-2 rounded-lg transition-colors flex flex-col items-center justify-center space-y-1"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    <span>Concept Art</span>
                </button>

                 <button
                    onClick={handleSmartStructuredAnimate}
                    disabled={isLoading}
                    className="bg-brand-900/40 hover:bg-brand-900/60 border border-brand-500/50 text-brand-300 text-[10px] font-bold py-2 rounded-lg transition-colors flex flex-col items-center justify-center space-y-1"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                    <span>Smart Animate (Layers)</span>
                </button>
            </div>
        </div>

        {/* Result Display for Concept Art */}
        {generatedImage && (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 animate-in fade-in zoom-in-95">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex justify-between items-center">
                    <span>Generated Result</span>
                </div>
                <div className="flex justify-center bg-black/50 rounded p-2 mb-2">
                    <img src={generatedImage} alt="AI Generated" className="w-32 h-32 object-contain image-pixelated" />
                </div>
                <button
                    onClick={() => onApplyImage(generatedImage!)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors flex items-center justify-center space-x-1"
                >
                    <ArrowDownToLine size={12} />
                    <span>Apply to Canvas</span>
                </button>
            </div>
        )}

        <div className="h-px bg-gray-800 my-4" />

        {/* Utility Tools */}
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500">Utilities</label>
            <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={handleSmartHotspot}
                    disabled={isLoading}
                    className="w-full border border-gray-600 hover:bg-gray-800 text-gray-300 text-xs py-2 rounded-lg flex items-center justify-center space-x-2"
                >
                    <Crosshair size={14} />
                    <span>Auto-Detect Hotspot</span>
                </button>

                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full border border-gray-600 hover:bg-gray-800 text-gray-300 text-xs py-2 rounded-lg flex items-center justify-center space-x-2"
                >
                    <MessageSquare size={14} />
                    <span>Analyze Design</span>
                </button>
            </div>
        </div>

        {suggestion && (
            <div className="bg-gray-800/50 border border-brand-500/30 p-3 rounded-lg text-xs text-gray-300 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 mt-4">
                {suggestion}
            </div>
        )}

      </div>
    </div>
  );
};

export default AIAssistant;
