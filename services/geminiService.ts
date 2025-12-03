

import { GoogleGenAI } from "@google/genai";
import { ToolDefinition, ToolId, CanvasConfig, AspectRatio, Resolution, Annotation, CropRect } from "../types";

export const checkApiKey = async (): Promise<boolean> => {
  const w = window as any;
  if (!w.aistudio) return false;
  try {
    return await w.aistudio.hasSelectedApiKey();
  } catch (e) {
    console.error("Error checking API key:", e);
    return false;
  }
};

export const promptApiKeySelection = async (): Promise<void> => {
  const w = window as any;
  if (w.aistudio) {
    await w.aistudio.openSelectKey();
  }
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to crop an image based on percentage rect
const cropImage = async (file: File, rect: CropRect): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Cannot create canvas context"));
      }

      // Calculate pixel coordinates
      const sx = (rect.x / 100) * img.width;
      const sy = (rect.y / 100) * img.height;
      const sw = (rect.w / 100) * img.width;
      const sh = (rect.h / 100) * img.height;

      // Set canvas to the crop size
      canvas.width = sw;
      canvas.height = sh;

      // Draw the crop
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const base64String = canvas.toDataURL(file.type);
      const base64Data = base64String.split(',')[1];
      
      URL.revokeObjectURL(url);
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    img.onerror = reject;
    img.src = url;
  });
};

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const mapResolution = (res: Resolution): '1K' | '2K' | '4K' => {
  // Map user-friendly resolutions to API supported imageSize
  switch (res) {
    case 'Standard': return '1K';
    case 'HD': return '1K'; // 720p approx
    case 'FHD': return '2K'; // 1080p -> 2K is closest upgrade
    case '2K': return '2K';
    case '4K': return '4K';
    case '8K': return '4K'; // API Max is 4K
    default: return '1K';
  }
};

const mapAspectRatio = (ratio: AspectRatio, inputWidth?: number, inputHeight?: number): string => {
  if (ratio === 'Original' && inputWidth && inputHeight) {
    const r = inputWidth / inputHeight;
    // Find closest standard ratio supported by Gemini: 1:1 (1), 4:3 (1.33), 3:4 (0.75), 16:9 (1.77), 9:16 (0.56)
    const supported = [
      { id: '1:1', val: 1 },
      { id: '4:3', val: 4/3 },
      { id: '3:4', val: 3/4 },
      { id: '16:9', val: 16/9 },
      { id: '9:16', val: 9/16 }
    ];
    
    // Find item with minimum difference
    const closest = supported.reduce((prev, curr) => {
      return (Math.abs(curr.val - r) < Math.abs(prev.val - r) ? curr : prev);
    });
    return closest.id;
  }

  // Map custom ratios to closest API supported values: "1:1", "3:4", "4:3", "9:16", "16:9"
  switch (ratio) {
    case 'Original': return '1:1'; // Fallback if no dims
    case '21:9': return '16:9'; // Closest wide
    case '3:2': return '4:3';   // 3:2 (1.5) is between 4:3 (1.33) and 16:9 (1.77). 
    case '2:3': return '3:4';
    default: return ratio;
  }
};

export const estimateCameraPose = async (imageFile: File): Promise<{ yaw: number; pitch: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(imageFile);
  
  const prompt = `
    Analyze this architectural image and estimate the camera angle relative to the building's main mass.
    Estimate YAW (Horizontal Rotation):
    0 = Direct Front View
    90 = Direct Right Side Profile
    -90 = Direct Left Side Profile
    180 = Rear View
    45 = Front-Right Corner
    -45 = Front-Left Corner

    Estimate PITCH (Vertical Tilt):
    0 = Eye Level / Street View
    90 = Top-Down Roof Plan
    45 = High Angle / Aerial
    -45 = Low Angle / Worm's Eye

    Return ONLY a JSON object: {"yaw": number, "pitch": number}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Fast model for analysis
    contents: {
      parts: [imagePart, { text: prompt }]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Could not detect camera angle.");
  
  try {
    const data = JSON.parse(jsonText);
    return { 
      yaw: typeof data.yaw === 'number' ? data.yaw : 0, 
      pitch: typeof data.pitch === 'number' ? data.pitch : 0 
    };
  } catch (e) {
    console.error("Pose Estimation Parse Error", e);
    return { yaw: 0, pitch: 0 };
  }
};

export const generateArchitectureOutput = async (
  tool: ToolDefinition,
  imageFile: File,
  userPrompt: string,
  canvasConfig?: CanvasConfig,
  referenceImages?: File[],
  referenceWeight?: number,
  cropRect?: CropRect // Add crop rect argument
): Promise<{ text?: string; imageUrl?: string; annotations?: Annotation[] }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare contents array
  // IF cropRect exists, we crop the image client-side first
  let imagePart;
  if (cropRect) {
    imagePart = await cropImage(imageFile, cropRect);
  } else {
    imagePart = await fileToGenerativePart(imageFile);
  }

  const parts: any[] = [imagePart];

  // Determine Model ID from Tool Definition
  const targetModel = tool.model;

  // Process reference images if they exist
  let referenceContext = "";
  if (referenceImages && referenceImages.length > 0) {
    for (const ref of referenceImages) {
      parts.push(await fileToGenerativePart(ref));
    }
    const weightDesc = referenceWeight ? (
        referenceWeight < 30 ? "SUBTLE HINT" : 
        referenceWeight > 80 ? "DOMINANT STYLE" : "MODERATE INFLUENCE"
    ) : "BALANCED";

    referenceContext = `
[SYSTEM INSTRUCTION: MULTI-IMAGE PROCESSING]
You have been provided with ${parts.length} images in total.
1. IMAGE 1 (The First Image): THIS IS THE BASE GEOMETRY. You MUST strictly preserve its perspective, camera angle, structural lines, and composition. Do NOT crop, warp, or rotate Image 1.
2. IMAGES 2-${parts.length} (The Subsequent Images): THESE ARE STYLE REFERENCES ONLY. Use them to extract: Color Palette, Materials, Lighting Atmosphere, and Texture Details.

[TASK]
Apply the visual style of the Reference Images (Images 2+) onto the geometry of the Base Image (Image 1).
- Target Style Influence: ${weightDesc} (${referenceWeight || 50}%).
- IF ${referenceWeight || 50} < 30: Maintain most of the Base Image's original look, just hint at the reference style.
- IF ${referenceWeight || 50} > 70: Heavily overlay the reference textures and lighting, but KEEP THE WALLS AND FURNITURE IN PLACE.

WARNING: DO NOT HALLUCINATE GEOMETRY FROM THE REFERENCE IMAGES ONTO THE BASE IMAGE. THE BASE IMAGE SHAPE IS LAW.
`;
  }

  // Construct Final Prompt
  let finalPrompt = tool.promptTemplate.replace('${userPrompt}', userPrompt || ' ');
  
  if (referenceContext) {
    finalPrompt = referenceContext + "\n\n[USER REQUEST]: " + finalPrompt;
  }

  try {
    // Handling Image Generation
    const config: any = {};
    if (targetModel.includes('image')) {
      const targetSize = canvasConfig ? mapResolution(canvasConfig.resolution) : (tool.imageSize || '1K');
      
      let targetRatio = '1:1';
      if (canvasConfig) {
        if (canvasConfig.ratio === 'Original') {
           // If we are cropping, the input dimension is the CROP dimension, not the full image
           if (cropRect) {
              targetRatio = '1:1'; 
           } else {
             const dims = await getImageDimensions(imageFile);
             targetRatio = mapAspectRatio(canvasConfig.ratio, dims.width, dims.height);
           }
        } else {
           targetRatio = mapAspectRatio(canvasConfig.ratio);
        }
      }

      config.imageConfig = {
        aspectRatio: targetRatio
      };

      if (targetModel === 'gemini-3-pro-image-preview') {
        config.imageConfig.imageSize = targetSize;
      }
    }
    
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: {
        parts: [...parts, { text: finalPrompt }]
      },
      config: config
    });

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      const parts = candidate.content.parts;
      
      for (const part of parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mime = part.inlineData.mimeType || 'image/png';
          return { imageUrl: `data:${mime};base64,${base64}` };
        }
      }
      
      if (parts[0].text) {
        throw new Error("Model returned text instead of image: " + parts[0].text);
      }
    }

    throw new Error("No image generated.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message && error.message.includes("Requested entity was not found")) {
      const w = window as any;
      if (w.aistudio) {
        await w.aistudio.openSelectKey();
      }
      throw new Error("API Key session expired or invalid. Please select your project again.");
    }
    throw error;
  }
};