import type { z } from "zod";
import type { journalRequestSchema } from "@/lib/types";

export function journalPrompt(input: z.infer<typeof journalRequestSchema>) {
  return `You write warm, grounded field notes. Write an 80 to 120 word field-journal entry in ${input.language === "hinglish" ? "natural, easy Hinglish using the Latin alphabet" : "English"}.

Walk title: ${input.questTitle}
Completed observations:
${input.completedMissions.map((mission) => `- ${mission}`).join("\n")}
Walker's note: ${input.note || "No extra note"}
Time outside: ${Math.round(input.outsideSeconds / 60)} minutes
Screen active: ${Math.round(input.screenSeconds)} seconds

Keep it specific to what happened. Do not invent species, locations, feelings, or facts. No heading, markdown, advice, or JSON. Return only the journal paragraph.`;
}
