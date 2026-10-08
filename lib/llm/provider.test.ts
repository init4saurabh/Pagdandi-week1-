import { describe, expect, it } from "vitest";
import { GeminiApiProvider, getProvider, OllamaProvider } from "./provider";

describe("provider switching", () => {
  it("defaults to Gemini API", () => expect(getProvider({})).toBeInstanceOf(GeminiApiProvider));
  it("selects Ollama", () => expect(getProvider({ LLM_PROVIDER: "ollama", OLLAMA_MODEL: "gemma" })).toBeInstanceOf(OllamaProvider));
  it("rejects an unknown provider", () => expect(() => getProvider({ LLM_PROVIDER: "other" })).toThrow(/Unsupported/));
});
