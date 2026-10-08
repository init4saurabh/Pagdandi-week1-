import { NextResponse } from "next/server";
import { friendlyLlmError } from "@/lib/llm/errors";
import { parseModelJson } from "@/lib/llm/json";
import { generateValidated, getProvider } from "@/lib/llm/provider";
import { questPrompt } from "@/lib/prompts/quest.v1";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { questRequestSchema, questSchema } from "@/lib/types";

export async function POST(request: Request) {
  if (!rateLimit(`quest:${requestKey(request)}`)) return NextResponse.json({ error: "A few walkers are starting at once. Try again in a minute." }, { status: 429 });
  const parsed = questRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the walk details and try again." }, { status: 400 });
  try {
    const provider = getProvider();
    const quest = await generateValidated(provider, { prompt: questPrompt(parsed.data) }, (text) => parseModelJson(text, questSchema));
    return NextResponse.json({ quest, provider: provider.label });
  } catch (error) {
    const friendly = friendlyLlmError(error);
    return NextResponse.json({ error: friendly.message }, { status: friendly.status });
  }
}
