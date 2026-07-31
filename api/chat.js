import { GoogleGenAI } from "@google/genai";

let ai = null;

if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
    });
  }

  try {
    console.log(`>> [Serverless API] ${req.method} ${req.url}`);
    console.log('>> [Serverless API] body preview:', JSON.stringify(req.body).slice(0, 2000));
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    if (!ai) {
      return res.status(200).json({
        success: true,
        reply: `Demo response for: "${prompt}". Configure GEMINI_API_KEY to unlock live AI generation.`,
      });
    }

    console.log('>> [Gemini] calling model', 'gemini-3.5-flash-lite');
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    console.log('<< [Gemini] raw response:', response);

    const replyText = (response && (response.text || response.outputText || response.response || response[0]?.text)) || JSON.stringify(response);

    res.status(200).json({
      success: true,
      reply: replyText,
    });

  } catch (error) {
    console.error(error);

    const message = String(error?.message || "");
    const isQuotaIssue = /quota|429|resource_exhausted|resource exhausted/i.test(message);

    if (isQuotaIssue) {
      return res.status(200).json({
        success: true,
        reply: "Gemini is temporarily unavailable because the current API quota has been exhausted. Please try again in a few minutes or use a different API key if available.",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}