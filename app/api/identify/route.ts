import { NextResponse } from "next/server";
import { z } from "zod";
import { friendlyLlmError } from "@/lib/llm/errors";
import { parseModelJson } from "@/lib/llm/json";
import { generateValidated, getProvider } from "@/lib/llm/provider";
import { identifyPrompt } from "@/lib/prompts/identify.v1";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { identificationSchema } from "@/lib/types";

const payloadSchema = z.object({
  image: z.string().max(2_500_000),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export async function POST(request: Request) {
  if (!rateLimit(`identify:${requestKey(request)}`, 5)) return NextResponse.json({ error: "Photo checks are paused for a minute. Please try again shortly." }, { status: 429 });
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That photo could not be read. Try a smaller, clear image." }, { status: 400 });
  try {
    const provider = getProvider();
    const result = await generateValidated(
      provider,
      { prompt: identifyPrompt, image: { mimeType: parsed.data.mimeType, data: parsed.data.image } },
      (text) => parseModelJson(text, identificationSchema),
    );
    return NextResponse.json({ result });
  } catch (error) {
    const friendly = friendlyLlmError(error);
    return NextResponse.json({ error: friendly.message }, { status: friendly.status });
  }
}
