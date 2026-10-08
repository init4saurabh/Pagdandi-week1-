import { NextResponse } from "next/server";
import { friendlyLlmError } from "@/lib/llm/errors";
import { getProvider } from "@/lib/llm/provider";
import { journalPrompt } from "@/lib/prompts/journal.v1";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { journalRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  if (!rateLimit(`journal:${requestKey(request)}`, 6)) return NextResponse.json({ error: "Your journal pen needs a short pause. Try again in a minute." }, { status: 429 });
  const parsed = journalRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "There isn’t enough walk detail to write this entry yet." }, { status: 400 });
  try {
    const text = await getProvider().generate({ prompt: journalPrompt(parsed.data) });
    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    const friendly = friendlyLlmError(error);
    return NextResponse.json({ error: friendly.message }, { status: friendly.status });
  }
}
