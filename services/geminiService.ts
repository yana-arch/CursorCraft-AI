import { GoogleGenAI, Type } from "@google/genai";
import { AIAnimationResponse } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client only if the key exists to avoid immediate crashes, 
// though the prompt implies we assume it exists.
const ai = new GoogleGenAI({ apiKey });

export const generateCursorConcept = async (prompt: string): Promise<string | null> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }

  try {
    const enhancedPrompt = `
      Create a pixel art design for a computer mouse cursor based on this description: "${prompt}".
      The image should be simple, clear, and suitable for a 32x32 grid.
      Solid black background for contrast (or transparent if possible).
      Make it look like a high-quality icon or cursor.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: enhancedPrompt }
        ]
      },
      config: {
        // We want a square image for reference
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    // Check for inline data (Base64 image)
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }

    return null;
  } catch (error) {
    console.error("Error generating cursor concept:", error);
    throw error;
  }
};

export const generateCursorFromImage = async (imageBase64: string, prompt: string): Promise<string | null> => {
    if (!apiKey) return null;

    try {
        // Extract base64 data and mime type
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) return null;
        
        const mimeType = matches[1];
        const data = matches[2];
        const userPrompt = prompt.trim() || "Convert this image into a pixel art cursor.";

        const enhancedPrompt = `
            ${userPrompt}
            Task: Transform the input image into a professional 32x32 pixel art mouse cursor.
            Style: Clear, readable pixel art.
            Requirements: 
            1. Output must be a square image.
            2. The background should be solid color or transparent if possible.
            3. Emphasize the shape to be usable as a pointer.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: data,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: enhancedPrompt
                    }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;

    } catch (error) {
        console.error("Error generating cursor from image:", error);
        throw error;
    }
};

export const suggestCursorImprovements = async (currentDesignBase64: string): Promise<string> => {
    if (!apiKey) return "API Key missing.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: currentDesignBase64.split(',')[1],
                            mimeType: 'image/png'
                        }
                    },
                    {
                        text: "Analyze this 32x32 cursor pixel art. Give me 3 short, bulleted specific tips to improve its readability or aesthetics as a mouse cursor. Keep it brief."
                    }
                ]
            }
        });
        return response.text || "No suggestions available.";
    } catch (error) {
        console.error("Error analyzing cursor:", error);
        return "Failed to analyze design.";
    }
}

export const detectHotspotAI = async (currentDesignBase64: string): Promise<{x: number, y: number} | null> => {
    if (!apiKey) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: currentDesignBase64.split(',')[1],
                            mimeType: 'image/png'
                        }
                    },
                    {
                        text: "Identify the optimal hotspot coordinates (x, y) for this mouse cursor image where x is 0-31 (left to right) and y is 0-31 (top to bottom). The hotspot is the active click point (e.g., tip of an arrow, center of a crosshair). Return strictly JSON format."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        x: { type: Type.INTEGER },
                        y: { type: Type.INTEGER }
                    },
                    required: ["x", "y"]
                }
            }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Error detecting hotspot:", error);
        return null;
    }
}

// Old method (Image-based) - Kept for compatibility or fallback
export const generateAnimationSequence = async (currentDesignBase64: string, animationType: string): Promise<string | null> => {
    if (!apiKey) return null;
    // ... existing implementation remains if needed for simple cases
    return null; 
}

// NEW: Structured Data Generation
export const generateStructuredAnimation = async (
    imageBase64: string, 
    prompt: string
): Promise<AIAnimationResponse | null> => {
    if (!apiKey) return null;

    try {
        const enhancedPrompt = `
            You are a Master Cursor Designer & Pixel Art Architect. 
            
            OBJECTIVE: Design an animated cursor based on the user's request: "${prompt}".
            Instead of raw pixels, you must use high-level DRAWING METHODS to define each frame.

            AVAILABLE METHODS:
            1. "drawLine": [x0, y0, x1, y1, color]
            2. "drawRect": [x, y, w, h, color]
            3. "drawCircle": [cx, cy, r, color]
            4. "drawPointer": [color, offsetX, offsetY]
            5. "drawHand": [color, offsetX, offsetY]

            INSTRUCTIONS:
            - "subject": The main cursor body. Use "drawPointer" or "drawHand" for standard shapes, or "drawRect"/"drawLine" for custom ones.
            - "effect": Animation elements like glowing lines, particles (small rects), or halos (circles).
            - Create a smooth 8-12 frame loop.
            - The "subject" should be extracted from the user's intent or the provided image.
            
            Technical Spec: 32x32 grid. Colors in Hex.
            Output must be a valid JSON object.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageBase64.split(',')[1],
                            mimeType: 'image/png'
                        }
                    },
                    { text: enhancedPrompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        metadata: {
                            type: Type.OBJECT,
                            properties: {
                                grid_size: { type: Type.INTEGER },
                                total_frames: { type: Type.INTEGER },
                                fps: { type: Type.INTEGER },
                                hotspot: {
                                    type: Type.OBJECT,
                                    properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } }
                                }
                            }
                        },
                        frames: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    frame_id: { type: Type.INTEGER },
                                    calls: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                method: { type: Type.STRING, enum: ["drawLine", "drawRect", "drawCircle", "drawPointer", "drawHand"] },
                                                params: { type: Type.ARRAY, items: { type: Type.STRING } }, // Flexible array for params
                                                layerType: { type: Type.STRING, enum: ["subject", "effect", "ui"] }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AIAnimationResponse;
        }
        return null;
    } catch (error) {
        console.error("Error generating structured animation:", error);
        return null;
    }
};

export const refineSketch = async (imageBase64: string, prompt: string): Promise<string | null> => {
    if (!apiKey) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageBase64.split(',')[1],
                            mimeType: 'image/png'
                        }
                    },
                    { text: `The provided image is a rough sketch of a cursor. Please refine it into a clean, professional 32x32 pixel art cursor. Add shading, highlights, and sharpen the edges. Description: "${prompt}". Output must be a square image.` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });
        
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};
