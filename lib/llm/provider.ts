export type GenerateInput = {
  prompt: string;
  image?: { mimeType: string; data: string };
};

export interface LlmProvider {
  readonly label: string;
  generate(input: GenerateInput): Promise<string>;
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

export class GeminiApiProvider implements LlmProvider {
  readonly label = "Gemma via Gemini API";
  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY,
    private readonly model = process.env.GEMMA_MODEL,
  ) {}

  async generate({ prompt, image }: GenerateInput): Promise<string> {
    if (!this.apiKey) throw new Error("MISSING_API_KEY");
    if (!this.model) throw new Error("MISSING_MODEL");
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } });
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 1200 },
        }),
      },
    );
    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMITED");
      throw new Error(data.error?.message || `Gemini API failed (${response.status}).`);
    }
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) throw new Error("The model returned an empty response.");
    return text;
  }
}

type OllamaResponse = { response?: string; error?: string };

export class OllamaProvider implements LlmProvider {
  readonly label = "Gemma via local Ollama";
  constructor(
    private readonly baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    private readonly model = process.env.OLLAMA_MODEL,
  ) {}

  async generate({ prompt, image }: GenerateInput): Promise<string> {
    if (!this.model) throw new Error("MISSING_OLLAMA_MODEL");
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt, images: image ? [image.data] : undefined, stream: false }),
    });
    const data = (await response.json()) as OllamaResponse;
    if (!response.ok) throw new Error(data.error || `Ollama failed (${response.status}).`);
    if (!data.response) throw new Error("Ollama returned an empty response.");
    return data.response;
  }
}

export function getProvider(env: Record<string, string | undefined> = process.env): LlmProvider {
  const selected = env.LLM_PROVIDER || "gemini-api";
  if (selected === "gemini-api") return new GeminiApiProvider(env.GEMINI_API_KEY, env.GEMMA_MODEL);
  if (selected === "ollama") return new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL);
  throw new Error(`Unsupported LLM_PROVIDER: ${selected}`);
}

export async function generateValidated<T>(
  provider: LlmProvider,
  input: GenerateInput,
  parse: (value: string) => T,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;
  let prompt = input.prompt;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return parse(await provider.generate({ ...input, prompt }));
    } catch (error) {
      if (error instanceof Error && ["MISSING_API_KEY", "MISSING_MODEL", "MISSING_OLLAMA_MODEL", "RATE_LIMITED"].includes(error.message)) throw error;
      lastError = error;
      prompt = `${input.prompt}\n\nYour previous answer was invalid. Return exactly one complete JSON object matching the schema. No markdown or commentary.`;
    }
  }
  throw new Error(lastError instanceof Error ? `INVALID_MODEL_OUTPUT: ${lastError.message}` : "INVALID_MODEL_OUTPUT");
}

export async function listAvailableGemmaModels(apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(apiKey)}`);
  if (!response.ok) throw new Error(`Unable to list models (${response.status}).`);
  const data = (await response.json()) as { models?: Array<{ name: string; displayName?: string; description?: string; supportedGenerationMethods?: string[] }> };
  return (data.models ?? []).filter((model) =>
    model.name.toLowerCase().includes("gemma") && model.supportedGenerationMethods?.includes("generateContent"),
  );
}
