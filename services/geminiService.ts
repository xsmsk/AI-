import { GoogleGenAI } from "@google/genai";

// Variable to store key set at runtime (via UI)
let runtimeApiKey: string | null = null;

// Allow the UI to set the key directly (e.g. from LocalStorage or User Input)
export const setRuntimeApiKey = (key: string) => {
  runtimeApiKey = key;
};

const getClient = () => {
  // Priority:
  // 1. Key explicitly set by user in UI (Runtime)
  // 2. Vercel Environment Variable (process.env.API_KEY)
  // 3. Vite Environment Variable (import.meta.env.VITE_API_KEY)
  const apiKey = 
    runtimeApiKey || 
    process.env.API_KEY || 
    (import.meta as any).env?.VITE_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.warn("API Key is missing in all sources.");
    throw new Error("MISSING_API_KEY"); // Special error code to trigger UI modal
  }

  return new GoogleGenAI({ apiKey });
};

export const generateHairstyle = async (
  sourceImageBase64: string,
  promptDescription: string,
  referenceImageBase64?: string
): Promise<string> => {
  const ai = getClient();
  // Using the Flash Image model for generation/editing tasks
  const model = 'gemini-2.5-flash-image';

  // Construct the prompt
  // We phrase this as a request to generate a new image based on the input
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
    { text: textPrompt },
    {
        inlineData: {
            data: sourceImageBase64,
            mimeType: 'image/jpeg', 
        }
    }
  ];

  if (referenceImageBase64) {
    parts.push({ text: "Use the following image as a strict reference for the hairstyle structure and shape:" });
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
    
    // If we got text but no image, it might be a refusal or text-only response
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart) {
        console.warn("Model returned text instead of image:", textPart.text);
        throw new Error("AI未能生成图片，可能描述涉及安全限制。请尝试换一种描述。");
    }

    throw new Error("No image generated in the response.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // 1. Handle Missing Key
    if (error.message === "MISSING_API_KEY") {
        throw error;
    }

    // 2. Analyze Error Message
    // The error might be a raw JSON string or an object
    const errorString = error.message || JSON.stringify(error);
    
    // Check for Rate Limit / Quota Exceeded (429)
    if (
        errorString.includes("429") || 
        errorString.includes("Quota exceeded") || 
        errorString.includes("RESOURCE_EXHAUSTED")
    ) {
        // Try to extract retry time if available
        const match = errorString.match(/retry in (\d+)/);
        const seconds = match ? match[1] : '30';
        throw new Error(`⚠️ 免费版 API 额度已满 (Error 429)\nGoogle 限制了请求频率，请休息 ${seconds} 秒后再试。`);
    }

    // Check for Safety Blocks
    if (
        errorString.includes("SAFETY") || 
        errorString.includes("BLOCKED") ||
        errorString.includes("finishReason")
    ) {
        throw new Error("生成被拦截：图片或描述可能触发了安全过滤器，请调整后重试。");
    }

    // Check for Model Overloaded (503)
    if (errorString.includes("503") || errorString.includes("Overloaded")) {
        throw new Error("AI 服务繁忙 (503)，请稍后再试。");
    }

    // Fallback: don't show raw JSON to user
    if (errorString.includes("{") && errorString.includes("}")) {
        throw new Error("生成请求失败，请检查网络或稍后重试。");
    }

    throw new Error(error.message || "生成失败，请检查网络或Key是否正确");
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