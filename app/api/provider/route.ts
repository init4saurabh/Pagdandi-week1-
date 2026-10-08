import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ provider: process.env.LLM_PROVIDER === "ollama" ? "Gemma via local Ollama" : "Gemma via Gemini API" });
}
