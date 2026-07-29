import { tool } from "ai";
import { z } from "zod";

import {
  missionOperatingStoreNames,
  personalGrowthStoreNames,
  universityStoreNames,
  type MissionRecordStoreName,
} from "@/lib/mission-control-database";
import { listMissionRecords } from "@/lib/server/mission-record-database";
import {
  getLatestIntelligenceBriefing,
  isIntelligenceDatabaseConfigured,
} from "@/lib/server/intelligence-database";

const areaCollections = {
  overview: [
    ...Object.values(missionOperatingStoreNames),
    ...Object.values(universityStoreNames),
    ...Object.values(personalGrowthStoreNames),
  ],
  university: Object.values(universityStoreNames),
  identity: Object.values(missionOperatingStoreNames),
  strength: [
    personalGrowthStoreNames.bodyWeight,
    personalGrowthStoreNames.liftHistory,
    personalGrowthStoreNames.personalRecords,
    personalGrowthStoreNames.strengthSessions,
    personalGrowthStoreNames.workoutCompletions,
  ],
  "jiu-jitsu": [personalGrowthStoreNames.jiuJitsuSessions],
  reading: [
    personalGrowthStoreNames.readingBooks,
    personalGrowthStoreNames.readingSessions,
  ],
  french: [
    personalGrowthStoreNames.frenchProfile,
    personalGrowthStoreNames.frenchSessions,
    personalGrowthStoreNames.frenchSnapshots,
  ],
} as const satisfies Record<string, readonly MissionRecordStoreName[]>;

interface CompactObject {
  readonly [key: string]: CompactValue;
}

type CompactValue =
  boolean | null | number | string | readonly CompactValue[] | CompactObject;

function compactValue(value: unknown, depth = 0): CompactValue {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (typeof value === "string") return value.slice(0, 360);
  if (depth >= 2) return "[detail omitted]";

  if (Array.isArray(value)) {
    return value.slice(0, 6).map((item) => compactValue(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 18)
        .map(([key, item]) => [key, compactValue(item, depth + 1)]),
    );
  }

  return String(value).slice(0, 360);
}

export function createJarvisTools(ownerId: string) {
  return {
    readDailyIntelligence: tool({
      description:
        "Read the latest source-grounded Observatory briefing from official economic institutions. Use for current economic, monetary-policy, trade, or institutional questions. It never changes data.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!isIntelligenceDatabaseConfigured()) {
          return {
            available: false,
            reason: "Observatory storage is not configured.",
          };
        }

        const briefing = await getLatestIntelligenceBriefing();
        return briefing === null
          ? {
              available: false,
              reason: "No daily briefing has been published yet.",
            }
          : { available: true, briefing, readOnly: true };
      },
    }),
    reviewMissionRecords: tool({
      description:
        "Read Daniel's synchronized Mission Control records for a specific area. Use this only when his question benefits from his actual tracked data. It never changes data.",
      inputSchema: z.object({
        area: z.enum([
          "overview",
          "university",
          "identity",
          "strength",
          "jiu-jitsu",
          "reading",
          "french",
        ]),
      }),
      execute: async ({ area }) => {
        const records = await listMissionRecords(ownerId);
        const selected = areaCollections[area];

        return {
          area,
          collections: selected.map((collection) => {
            const values = records[collection] ?? [];
            return {
              collection,
              count: values.length,
              recentRecords: values.slice(-8).reverse().map(compactValue),
            };
          }),
          generatedAt: new Date().toISOString(),
          readOnly: true,
        };
      },
    }),
  };
}
