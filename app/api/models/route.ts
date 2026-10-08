import { NextResponse } from "next/server";
import { listAvailableGemmaModels } from "@/lib/llm/provider";

export async function GET() {
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });
  try {
    return NextResponse.json({ models: await listAvailableGemmaModels(process.env.GEMINI_API_KEY) });
  } catch {
    return NextResponse.json({ error: "Could not discover Gemma models for this API key." }, { status: 502 });
  }
}
