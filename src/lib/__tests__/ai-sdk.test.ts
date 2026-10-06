// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, streamText } from "ai";
import { z } from "zod";
import { withJsonMode } from "@/lib/json-mode";

describe("AI provider compatibility", () => {
  it("parses structured Google output using the upgraded SDK", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { role: "model", parts: [{ text: '{"title":"Developer"}' }] }, finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, totalTokenCount: 8 },
    }), { headers: { "Content-Type": "application/json" } }));
    const google = createGoogleGenerativeAI({ apiKey: "test-only", fetch });
    const result = await generateObject({ model: google("gemini-2.5-flash"),
      schema: z.object({ title: z.string() }), prompt: "Analyze this role" });
    expect(result.object).toEqual({ title: "Developer" });
    expect(String(fetch.mock.calls[0][0])).toContain("models/gemini-2.5-flash:generateContent");
    expect(String(fetch.mock.calls[0][0])).not.toContain("models/models/");
  });

  it("keeps OpenAI structured generation on the chat completions API", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "test", created: 1, model: "gpt-4-turbo-preview",
      choices: [{ index: 0, message: { role: "assistant", content: '{"title":"Developer"}' }, finish_reason: "stop" }],
      usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
    }), { headers: { "Content-Type": "application/json" } }));
    const openai = createOpenAI({ apiKey: "test-only", fetch });
    const result = await generateObject({ model: withJsonMode(openai.chat("gpt-4-turbo-preview")),
      schema: z.object({ title: z.string() }), prompt: "Analyze this role" });
    expect(result.object).toEqual({ title: "Developer" });
    expect(String(fetch.mock.calls[0][0])).toContain("/chat/completions");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content).toContain('"title"');
  });

  it("returns the plain text stream expected by the career coach", async () => {
    const payload = { candidates: [{ content: { role: "model", parts: [{ text: "Career advice" }] }, finishReason: "STOP" }] };
    const fetch = vi.fn().mockResolvedValue(new Response(`data: ${JSON.stringify(payload)}\n\n`, {
      headers: { "Content-Type": "text/event-stream" },
    }));
    const google = createGoogleGenerativeAI({ apiKey: "test-only", fetch });
    const result = streamText({ model: google("gemini-2.5-flash"), messages: [{ role: "user", content: "Help" }] });
    expect(await result.toTextStreamResponse().text()).toBe("Career advice");
  });
});
