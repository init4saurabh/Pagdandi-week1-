export function friendlyLlmError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "MISSING_API_KEY") return { status: 503, message: "Gemma is resting until an API key is added. You can still replay your last saved quest." };
  if (message === "MISSING_MODEL") return { status: 503, message: "Choose an available Gemma model in GEMMA_MODEL before generating a walk." };
  if (message === "MISSING_OLLAMA_MODEL") return { status: 503, message: "Set OLLAMA_MODEL to your installed multimodal Gemma model." };
  if (message === "RATE_LIMITED") return { status: 429, message: "Gemma needs a short breather. Please try again in a minute." };
  if (message.startsWith("INVALID_MODEL_OUTPUT")) return { status: 502, message: "Gemma’s answer wandered off the path. Please try once more." };
  return { status: 500, message: "We couldn’t make a new trail just now. Your saved walks are still safe." };
}
