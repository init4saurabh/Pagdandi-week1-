import { z } from "zod";

export const moodSchema = z.enum(["calm", "energetic", "curious"]);
export const missionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(4).max(240),
  spokenText: z.string().min(2).max(160),
  type: z.enum(["observe", "listen", "find", "move", "pause"]),
  safetyNote: z.string().max(180).optional(),
});
export const questSchema = z.object({
  title: z.string().min(3).max(80),
  intro: z.string().min(4).max(240),
  missions: z.array(missionSchema).min(4).max(6),
});
export const questRequestSchema = z.object({
  durationMin: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  mood: moodSchema,
  areaName: z.string().min(2).max(100),
  weather: z.string().min(2).max(200),
  month: z.string().min(3).max(20),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]),
});
export const journalRequestSchema = z.object({
  questTitle: z.string().min(2).max(80),
  completedMissions: z.array(z.string().min(2).max(240)).min(1).max(6),
  note: z.string().max(500).optional().default(""),
  language: z.enum(["english", "hinglish"]).default("english"),
  outsideSeconds: z.number().nonnegative(),
  screenSeconds: z.number().nonnegative(),
});
export const identificationSchema = z.object({
  whatItLooksLike: z.string().min(2).max(120),
  confidence: z.enum(["low", "medium", "high"]),
  funFact: z.string().min(2).max(240),
  safetyNote: z.string().min(2).max(240),
});

export type Mood = z.infer<typeof moodSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type Quest = z.infer<typeof questSchema>;
export type JournalEntry = {
  id: string;
  createdAt: string;
  questTitle: string;
  text: string;
  outsideSeconds: number;
  screenSeconds: number;
  completedCount: number;
};
