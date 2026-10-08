import type { z } from "zod";
import type { questRequestSchema } from "@/lib/types";

export function questPrompt(input: z.infer<typeof questRequestSchema>) {
  return `You are a friendly outdoors guide for beginners. Create one safe ${input.durationMin}-minute walk quest for a person near ${input.areaName}.

Context:
- Mood: ${input.mood}
- Month: ${input.month}
- Time: ${input.timeOfDay}
- Weather: ${input.weather}

Rules:
- Give 4 to 6 tiny sensory missions using sight, sound, smell, safe movement, or a pause.
- Make every mission possible without equipment and without looking at a screen.
- Never ask the person to enter private property, leave a safe public route, touch or eat wildlife, plants, mushrooms, water, or unknown objects.
- If rain, extreme heat above 38C, dangerous weather, or poor air is mentioned, choose shorter sheltered missions and explain the safety adjustment in the intro.
- spokenText must take under 8 seconds to read aloud and must make sense without looking at the screen.
- IDs must be short unique strings.
- Output ONLY one JSON object. No markdown, code fence, or commentary.

Schema:
{"title":"string","intro":"string","missions":[{"id":"string","text":"string","spokenText":"string","type":"observe|listen|find|move|pause","safetyNote":"optional string"}]}`;
}
