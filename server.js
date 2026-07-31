import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ai = null;

if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
} else {
  console.warn("⚠️ GEMINI_API_KEY is not set. The app will return a demo response instead of calling Gemini.");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

// Detailed incoming-request logging for debugging
app.use((req, res, next) => {
  console.log(`>> [HTTP] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('>> [HTTP] body preview:', JSON.stringify(req.body).slice(0, 2000));
  }
  next();
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "NaturalCLI server is running!",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, fileContent } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required.",
      });
    }

    const finalPrompt = fileContent && String(fileContent).trim()
      ? `Use the attached file content to answer the user's request. File content:
${String(fileContent).slice(0, 200000)}

User prompt:
${prompt}`
      : prompt;

    if (!ai) {
      return res.json({
        success: true,
        reply: `Demo response for: "${prompt}". Configure GEMINI_API_KEY to unlock live AI generation.`,
      });
    }

    console.log('>> [Gemini] calling model', 'gemini-3.5-flash-lite');
    console.log('>> [Gemini] request contents preview:', String(finalPrompt).slice(0, 2000));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: finalPrompt,
    });

    console.log('<< [Gemini] raw response:', response);

    const replyText =
      response?.text ||
      response?.outputText ||
      response?.response ||
      response?.candidates?.[0]?.content?.[0]?.text ||
      response?.[0]?.text ||
      JSON.stringify(response);

    console.log('<< [API] sending reply preview:', String(replyText).slice(0, 2000));

    res.json({
      success: true,
      reply: replyText,
    });
  } catch (err) {
    console.error("Gemini Error:", err);

    const message = String(err?.message || "");
    const isQuotaIssue = /quota|429|resource_exhausted|resource exhausted/i.test(message);

    if (isQuotaIssue) {
      return res.status(200).json({
        success: true,
        reply: "Gemini is temporarily unavailable because the current API quota has been exhausted. Please try again in a few minutes or use a different API key if available.",
      });
    }

    res.status(500).json({
      success: false,
      error: err.message,
      details: err,
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});