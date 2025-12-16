import { GoogleGenAI } from "@google/genai";
import { AppMode } from "../types";
import { MODE_CONFIG } from "../constants";

// Fallback Key provided for Expo/Demo purposes
const EXPO_API_KEY = ;

// Initialize AI client
// Uses environment variable if available, otherwise falls back to the expo key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || EXPO_API_KEY });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (
  base64Image: string,
  mode: AppMode
): Promise<string> => {
  // Check if we have a usable key
  const activeKey = process.env.API_KEY || EXPO_API_KEY;
  if (!activeKey) {
    return "API Key is missing. Please add your Gemini API Key to the environment variables.";
  }

  const prompt = MODE_CONFIG[mode].prompt;
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  // Reduced retries for Expo demo to prevent long hangs if quota is dead
  const maxRetries = 2; 
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      });

      return response.text || "I could not analyze the image.";

    } catch (error: any) {
      console.error(`Gemini API attempt ${attempt + 1} error:`, error);
      
      const errorMessage = error.message || JSON.stringify(error);
      const isQuotaError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota');
      const isServerOverload = errorMessage.includes('503') || errorMessage.includes('Overloaded');

      if (isQuotaError || isServerOverload) {
        attempt++;
        if (attempt < maxRetries) {
          const delay = 1500 * attempt; // 1.5s, then 3s
          console.log(`Retrying in ${delay}ms...`);
          await wait(delay);
          continue;
        } else {
          if (isQuotaError) {
             return "Free quota limit reached. Please wait 60 seconds.";
          }
          return "The service is currently busy. Please try again in a moment.";
        }
      }

      return "I'm having trouble connecting to the AI service. Please check your internet.";
    }
  }

  return "An unexpected error occurred.";
};
