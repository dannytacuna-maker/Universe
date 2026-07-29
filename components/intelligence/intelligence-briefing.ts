import type { IntelligenceBriefing as OfficialIntelligenceBriefing } from "@/lib/intelligence/contracts";

export const intelligenceBriefingCategories = [
  "global-economy",
  "spain-and-eu",
  "international-trade",
  "business-and-industry",
  "geopolitics",
  "technology-and-ai",
  "economic-indicator",
] as const;

export type IntelligenceBriefingCategory =
  (typeof intelligenceBriefingCategories)[number];

export type IntelligenceSourceKind = "journalism" | "official" | "research";

export type IntelligenceSource = Readonly<{
  kind: IntelligenceSourceKind;
  name: string;
  url: string;
}>;

export type IntelligenceBriefingItem = Readonly<{
  businessRelevance: string;
  category: IntelligenceBriefingCategory;
  headline: string;
  id: string;
  publishedAtIso: string;
  publishedAtLabel: string;
  sources: readonly IntelligenceSource[];
  summary: string;
  uncertainty: string | null;
  whyItMatters: string;
}>;

export type EconomicPulseDirection = "down" | "stable" | "up";

export type EconomicPulseObservation = Readonly<{
  direction: EconomicPulseDirection;
  id: string;
  interpretation: string;
  label: string;
  observedAtIso: string;
  observedAtLabel: string;
  source: IntelligenceSource;
  value: string;
}>;

export type DailyIntelligenceBriefing = Readonly<{
  economicPulse: readonly EconomicPulseObservation[];
  editionDateIso: string;
  editionDateLabel: string;
  generatedAtIso: string;
  generatedAtLabel: string;
  id: string;
  items: readonly IntelligenceBriefingItem[];
  overview: string;
  title: string;
}>;

export type IntelligenceBriefingDashboardState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ message: string; status: "error" }>
  | Readonly<{
      briefing: OfficialIntelligenceBriefing | null;
      status: "source-ready";
    }>
  | Readonly<{
      briefing: DailyIntelligenceBriefing | null;
      status: "ready";
    }>;
