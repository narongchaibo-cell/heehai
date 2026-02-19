
import { GoogleGenAI } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMachineIssue = async (problemDescription: string, machineModel: string) => {
  try {
    // Using gemini-3-flash-preview for basic text analysis and diagnostics
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert industrial maintenance engineer at a world-class factory. 
      Analyze the following problem for machine model ${machineModel}: "${problemDescription}".
      Provide a professional and concise troubleshooting guide in Thai.
      Structure:
      1. สาเหตุที่เป็นไปได้ (Root Causes)
      2. วิธีการแก้ไขเบื้องต้น (Immediate Corrective Actions)
      3. ข้อควรระวังด้านความปลอดภัย (Critical Safety Warnings)`,
      config: {
        temperature: 0.4,
        topP: 0.9,
      }
    });

    // Accessing .text directly as a property
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือติดต่อฝ่าย IT";
  }
};

export const generateEfficiencyReport = async (machineData: any) => {
  try {
    // Using gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are a high-level Production Director. 
      Analyze these real-time machine performance metrics: ${JSON.stringify(machineData)}. 
      Provide a strategic summary in Thai for the executive board. 
      Identify critical OEE gaps, prioritize maintenance schedules, and suggest operational improvements.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    // Accessing .text directly as a property
    return response.text;
  } catch (error) {
    return "ไม่สามารถประมวลผลสรุปรายงานประสิทธิภาพได้ในขณะนี้";
  }
};
