import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log(`API Chat called with method: ${req.method}`);
  
  // Handle GET for health check
  if (req.method === 'GET') {
    return res.status(200).json({ status: "ok", message: "API is working", env: { hasKey: !!(process.env.GEMINI_API_KEY || process.env.API_KEY) } });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { messages, systemInstruction } = req.body;
  
  // Get API Key from environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
    return res.status(500).json({ error: "API Key is missing or invalid in environment variables." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Use the latest model
    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: messages,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const text = chunk.text || "";
      res.write(text);
    }
    
    res.end();
  } catch (error: any) {
    console.error("Error in /api/chat serverless function:", error);
    // If headers haven't been sent yet, we can send a JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    } else {
      // If we're already streaming, we just end the stream
      res.end();
    }
  }
}
