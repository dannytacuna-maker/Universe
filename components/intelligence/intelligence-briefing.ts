import type { IntelligenceBriefing as OfficialIntelligenceBriefing } from "@/lib/intelligence/contracts";
import type { WeeklyIntelligenceBriefing } from "@/lib/intelligence/weekly-briefing";

export type IntelligenceBriefingDashboardState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ message: string; status: "error" }>
  | Readonly<{
      briefing: OfficialIntelligenceBriefing | null;
      status: "source-ready";
    }>
  | Readonly<{
      briefing: WeeklyIntelligenceBriefing | null;
      status: "ready";
    }>;
