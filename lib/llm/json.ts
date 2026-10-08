import type { ZodType } from "zod";

export function extractFirstJsonObject(input: string): unknown {
  const cleaned = input.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start < 0) throw new Error("The model response did not contain JSON.");

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error("The model returned incomplete JSON.");
}

export function parseModelJson<T>(input: string, schema: ZodType<T>): T {
  return schema.parse(extractFirstJsonObject(input));
}
