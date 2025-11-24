import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateDrivingComment = async (mileage: number): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI unavailable (Missing API Key)";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, witty, or encouraging driving log message for a trip of ${mileage} miles. Keep it under 15 words.`,
    });
    
    return response.text?.trim() || "Drive logged successfully.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Great drive!";
  }
};
