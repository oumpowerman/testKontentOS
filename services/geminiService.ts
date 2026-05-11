import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const summarizeMeeting = async (content: string) => {
    if (!content || content.trim().length < 10) {
        throw new Error("เนื้อหาการประชุมสั้นเกินไปที่จะสรุปครับ");
    }

    const prompt = `
        คุณคือผู้ช่วยสรุปการประชุมมืออาชีพ 
        หน้าที่ของคุณคือสรุปเนื้อหาการประชุมที่ได้รับให้เป็น "มติที่ประชุม" (Key Decisions) 
        โดยสรุปเป็นข้อๆ ที่กระชับ เข้าใจง่าย และนำไปใช้งานต่อได้ทันที
        
        เนื้อหาการประชุม:
        ${content}
        
        กรุณาสรุปในรูปแบบรายการ (Bullet points) เท่านั้น และใช้ภาษาที่เป็นทางการแต่เป็นกันเอง
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });

        return response.text || "ไม่สามารถสรุปได้ในขณะนี้";
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
};

export const extractContentAnalyticsFromImage = async (base64Image: string) => {
    const prompt = `
        You are a specialized Data Analyst for Content Marketing.
        Your task is to analyze the provided screenshot of content insights (TikTok, Facebook, Instagram, or YouTube) and extract key performance metrics.
        
        Please extract the following data in JSON format:
        - views (integer)
        - likes (integer)
        - comments (integer)
        - shares (integer)
        - saves (integer)
        - retention_rate (decimal percentage 0-100, if available)
        - avg_watch_time (seconds, if available)
        - reach (integer, if available)
        - platform (e.g., "TIKTOK", "FACEBOOK", "INSTAGRAM", "YOUTUBE")
        
        Return ONLY the JSON object. If a value is not found, set it to null.
    `;

    try {
        const [header, content] = base64Image.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                    inlineData: {
                        data: content || base64Image,
                        mimeType: mimeType
                    }
                },
                { text: prompt }
            ]
        });

        const text = response.text || "";
        // Extract JSON from potential markdown code blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Extraction Error:", error);
        throw error;
    }
};

export const validateApiKey = async (): Promise<{ isValid: boolean; error?: string }> => {
    if (!process.env.GEMINI_API_KEY) {
        return { isValid: false, error: "Missing API Key" };
    }

    try {
        // Lightweight attempt to check if the connection and key are valid
        // using generateContent with a tiny prompt
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Hi",
        });

        if (response && response.text) {
            return { isValid: true };
        }
        return { isValid: false, error: "Empty response from AI" };
    } catch (error: any) {
        console.error("Gemini Validation Error:", error);
        
        let errorMessage = "AI Connection Failed";
        
        if (error?.message?.includes("API key not valid")) {
            errorMessage = "Invalid API Key";
        } else if (error?.message?.includes("quota") || error?.status === 429) {
            errorMessage = "Quota Exceeded";
        } else if (error?.status === 403) {
            errorMessage = "Key Permission Denied";
        } else if (error?.message?.includes("fetch") || !navigator.onLine) {
            errorMessage = "Network Offline";
        }

        return { 
            isValid: false, 
            error: errorMessage 
        };
    }
};
