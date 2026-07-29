import { z } from "zod";

export const intelligenceBriefingCategories = [
  "global-economy",
  "spain-and-eu",
  "international-trade",
  "business-and-industry",
  "geopolitics",
  "technology-and-ai",
  "economic-indicator",
] as const;

export const intelligenceSourceKinds = [
  "journalism",
  "official",
  "research",
] as const;

export const economicPulseDirections = ["down", "stable", "up"] as const;

export const intelligenceSourceSchema = z.object({
  kind: z.enum(intelligenceSourceKinds),
  name: z.string().min(1).max(100),
  url: z.string().url().max(2_048),
});

export const weeklyIntelligenceItemSchema = z.object({
  businessRelevance: z.string().min(1).max(560),
  category: z.enum(intelligenceBriefingCategories),
  headline: z.string().min(1).max(240),
  id: z.string().min(1).max(160),
  publishedAtIso: z.string().min(1).max(64),
  publishedAtLabel: z.string().min(1).max(80),
  sources: z.array(intelligenceSourceSchema).min(1).max(4),
  summary: z.string().min(1).max(900),
  uncertainty: z.string().min(1).max(500).nullable(),
  whyItMatters: z.string().min(1).max(560),
});

export const economicPulseObservationSchema = z.object({
  direction: z.enum(economicPulseDirections),
  id: z.string().min(1).max(160),
  interpretation: z.string().min(1).max(500),
  label: z.string().min(1).max(120),
  observedAtIso: z.string().min(1).max(64),
  observedAtLabel: z.string().min(1).max(80),
  source: intelligenceSourceSchema,
  value: z.string().min(1).max(80),
});

export const weeklyIntelligenceBriefingSchema = z.object({
  economicPulse: z.array(economicPulseObservationSchema).max(6),
  editionDateIso: z.string().min(1).max(64),
  editionDateLabel: z.string().min(1).max(80),
  generatedAtIso: z.string().min(1).max(64),
  generatedAtLabel: z.string().min(1).max(80),
  id: z.string().min(1).max(160),
  items: z.array(weeklyIntelligenceItemSchema).min(1).max(10),
  overview: z.string().min(1).max(1_200),
  title: z.string().min(1).max(180),
  weekStartIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
});

export type IntelligenceBriefingCategory =
  (typeof intelligenceBriefingCategories)[number];
export type IntelligenceSourceKind = (typeof intelligenceSourceKinds)[number];
export type EconomicPulseDirection = (typeof economicPulseDirections)[number];
export type IntelligenceSource = z.infer<typeof intelligenceSourceSchema>;
export type WeeklyIntelligenceItem = z.infer<
  typeof weeklyIntelligenceItemSchema
>;
export type EconomicPulseObservation = z.infer<
  typeof economicPulseObservationSchema
>;
export type WeeklyIntelligenceBriefing = z.infer<
  typeof weeklyIntelligenceBriefingSchema
>;
