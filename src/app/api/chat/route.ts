import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { CAREER_COACH_SYSTEM_PROMPT } from "@/lib/prompts";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const MAX_TEXT = 50_000;

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(MAX_TEXT),
  })).min(1, "Mesaj gerekli").max(50),
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!(await getSession())) {
      return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }
    const body = await request.json();
    const v = schema.safeParse(body);
    if (!v.success) {
      return new Response(JSON.stringify({ error: v.error.errors[0].message }), {
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
      model: google("gemini-2.5-flash"),
      system: CAREER_COACH_SYSTEM_PROMPT,
      messages: v.data.messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Sohbet başarısız" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
