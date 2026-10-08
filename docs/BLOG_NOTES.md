# Pagdandi — blog notes

## The core idea

Most apps optimize for time on screen. Pagdandi’s success metric is the opposite: how much of a walk happened with the screen inactive. A user makes three choices, hears tiny observation missions, pockets the phone, and returns for a private field note.

## Key technical decisions

1. **One interface, two Gemma runtimes.** `lib/llm/provider.ts` hides Gemini API and local Ollama behind the same `generate()` method. This makes the hosted demo convenient without making the product dependent on a closed model or a single runtime.
2. **Model discovery rather than a stale default.** `GEMMA_MODEL` has no hardcoded production fallback. `/api/models` and the README’s ListModels command filter models available to the user’s own key.
3. **Plain-text structured output.** Prompts request one JSON object. A balanced-brace extractor handles fences and surrounding prose, Zod validates it, and the provider retries twice with a correction instruction.
4. **Privacy boundary in the browser.** Coordinates go only to Open-Meteo, journals stay in `localStorage`, and optional images are resized before being sent for in-memory inference.
5. **Boring, versioned offline caching.** Navigation is network-first with an offline fallback; static assets are cache-first. API responses are never cached. The last quest is stored locally rather than mixed into the service-worker cache.
6. **Audio-first interaction.** Speech synthesis is progressive enhancement. The giant Done button remains the reliable one-thumb fallback.

## Gemma-specific quirks

- Role and safety instructions stay in the initial user prompt for provider portability. Hosted Gemma 4 supports standard roles, while local chat templates can vary by model and runtime.
- Gemma 4 thinking can consume the entire output budget before a final answer. The hosted provider explicitly requests `minimal` thinking, excludes returned thought parts, and reserves the output for the user-visible result.
- Model availability is account- and time-dependent. The app lists available `generateContent` Gemma models instead of pretending one identifier is permanent.
- Structured-output features are not assumed. JSON is requested as text, extracted defensively, validated, and retried.
- Multimodal behavior depends on the selected Gemma checkpoint and serving runtime, so `GEMMA_MODEL` and `OLLAMA_MODEL` remain explicit configuration.

## What open made better

- The same product can move from a hosted API to a laptop-local Ollama process with one environment variable.
- Walk prompts, JSON schemas, safety rules, and retry behavior are visible and modifiable—no prompt lock-in.
- Local mode offers a credible privacy story for photos and place context: the inference boundary can live on the user’s own machine.
- The project can choose smaller or larger Gemma weights based on hardware and latency instead of rewriting application code.
- A contributor can reproduce, inspect, or fine-tune the intelligence layer without being tied to a proprietary model family.

## Five honest limitations

1. Mobile browsers often pause speech synthesis after the page is locked; this is audio-first, not guaranteed background audio.
2. An LLM can still create awkward or locally inappropriate missions despite prompt rules and validation.
3. `localStorage` is simple but is not encrypted, synchronized, or backed up.
4. Open-Meteo weather is approximate and cannot represent street-level hazards, air quality, accessibility, or current trail closures.
5. A photo guess is not a biological identification and must never guide touching, eating, medical, or safety decisions.

## Field-test questions for the post

- How many seconds did setup actually take?
- Did the phone stay pocketed between missions?
- Was speech understandable outdoors in traffic or wind?
- Which mission produced a real observation rather than generic busywork?
- What did the outside-vs-screen statistic show?
- What would change after testing with a student in Ranchi?
