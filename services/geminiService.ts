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
            You are a Pixel Art Architect. Analyze the provided image and the user's prompt: "${prompt}".
            Your task is to decompose the image into a "Subject" (the main cursor) and "Effects" (aura, particles, etc.) and create a short animation.
            
            Return a JSON object containing a sequence of frames. 
            For each frame, provide a list of "dots" (pixels).
            
            Strict Rules:
            1. Grid size is 32x32. Coordinates x,y must be 0-31.
            2. 'type' must be 'subject' for the main cursor body, or 'effect' for animations (fire, glow, spin).
            3. 'opacity' is 0.0 to 1.0.
            4. Create 4 to 8 frames for a smooth loop.
            5. Ensure the 'effect' dots move or change opacity to create the animation described.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Using 2.5 Flash for JSON handling capabilities
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
                                    dots: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                x: { type: Type.INTEGER },
                                                y: { type: Type.INTEGER },
                                                color: { type: Type.STRING },
                                                type: { type: Type.STRING, enum: ["subject", "effect", "ui"] },
                                                opacity: { type: Type.NUMBER }
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
