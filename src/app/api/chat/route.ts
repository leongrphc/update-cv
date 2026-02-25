import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { CAREER_COACH_SYSTEM_PROMPT } from "@/lib/prompts";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Mesaj gerekli" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: "API anahtarı yapılandırılmamış" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await streamText({
      model: google("models/gemini-2.5-flash"),
      system: CAREER_COACH_SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Sohbet başarısız" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
