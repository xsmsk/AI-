import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Robustly try to get the API Key
  // 1. Try the standard process.env injection (defined in vite.config.ts)
  // 2. Try Vite's import.meta.env (fallback)
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL ERROR: API Key is missing.");
    console.log("Debug Info:");
    console.log("- process.env.API_KEY:", process.env.API_KEY ? "Present" : "Missing");
    console.log("- import.meta.env.VITE_API_KEY:", (import.meta as any).env?.VITE_API_KEY ? "Present" : "Missing");
    
    throw new Error("API Key not found. Please check Vercel Environment Variables (API_KEY or VITE_API_KEY).");
  }

  return new GoogleGenAI({ apiKey });
};

export const generateHairstyle = async (
  sourceImageBase64: string,
  promptDescription: string,
  referenceImageBase64?: string
): Promise<string> => {
  const ai = getClient();
  const model = 'gemini-2.5-flash-image';

  // Construct the prompt
  const textPrompt = `
    You are a professional hair stylist and photo editor.
    Task: Change the hairstyle of the person in the source image.
    Style Requirement: ${promptDescription}.
    
    Instructions:
    1. Identify the person in the 'source_image'.
    2. Replace their current hair with the requested style.
    3. Ensure the lighting, shadows, and skin tone match the original photo perfectly.
    4. Keep the face identity unchanged. Only modify the hair area.
    5. Output a high-quality, photorealistic image.
  `;

  const parts: any[] = [
    {
      text: textPrompt
    },
    {
        inlineData: {
            data: sourceImageBase64,
            mimeType: 'image/jpeg', 
        }
    }
  ];

  if (referenceImageBase64) {
    parts.push({
        text: "Use the following image as a reference for the hairstyle structure and shape:"
    });
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: 'image/jpeg', 
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      }
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated in the response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,") to get raw base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };