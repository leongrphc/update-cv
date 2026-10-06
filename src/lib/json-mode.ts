import { wrapLanguageModel } from "ai";

// GPT-4 Turbo supports JSON mode but not the newer json_schema response format.
// Keep schema instructions in the prompt and let generateObject validate the result.
export function withJsonMode(model: Parameters<typeof wrapLanguageModel>[0]["model"]) {
  return wrapLanguageModel({
    model,
    middleware: {
      specificationVersion: "v3",
      transformParams: async ({ params }) => {
        if (params.responseFormat?.type !== "json" || !params.responseFormat.schema) return params;
        return {
          ...params,
          responseFormat: { type: "json" as const },
          prompt: [{ role: "system" as const,
            content: `Return only a JSON object matching this schema: ${JSON.stringify(params.responseFormat.schema)}` },
            ...params.prompt],
        };
      },
    },
  });
}
