import { tool } from "ai";
import { z } from "zod";

import {
  missionOperatingStoreNames,
  personalGrowthStoreNames,
  universityStoreNames,
  websitesProductionStoreNames,
  type MissionRecordStoreName,
} from "@/lib/mission-control-database";
import { listMissionRecords } from "@/lib/server/mission-record-database";
import {
  getLatestIntelligenceBriefing,
  getLatestWeeklyIntelligenceBriefing,
  isIntelligenceDatabaseConfigured,
} from "@/lib/server/intelligence-database";

const areaCollections = {
  overview: [
    ...Object.values(missionOperatingStoreNames),
    ...Object.values(universityStoreNames),
    ...Object.values(websitesProductionStoreNames),
    ...Object.values(personalGrowthStoreNames),
  ],
  university: Object.values(universityStoreNames),
  websites: Object.values(websitesProductionStoreNames),
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
    getCurrentTime: tool({
      description:
        "Get the current date and local clock time in UTC and Europe/Madrid. Use for clock time, date, day of week, or 'what time is it'.",
      inputSchema: z.object({}),
      execute: async () => {
        const now = new Date();
        const madridFormatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Madrid",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        const utcFormatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: "UTC",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        return {
          isoUtc: now.toISOString(),
          madrid: madridFormatter.format(now),
          utc: utcFormatter.format(now),
          timeZone: "Europe/Madrid",
        };
      },
    }),
    readWeeklyIntelligence: tool({
      description:
        "Read the latest source-grounded Observatory daily world briefing. Use for current geopolitics, global economy, business, trade, Spain or EU, technology, AI, monetary-policy, or institutional questions. It never changes data. Do not use this for clock time or ordinary general knowledge.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          if (!isIntelligenceDatabaseConfigured()) {
            return {
              available: false,
              reason: "Observatory storage is not configured.",
            };
          }

          const weeklyBriefing = await getLatestWeeklyIntelligenceBriefing();

          if (weeklyBriefing !== null) {
            return {
              available: true,
              briefing: weeklyBriefing,
              cadence: "daily",
              readOnly: true,
            };
          }

          const sourceBriefing = await getLatestIntelligenceBriefing();
          return sourceBriefing === null
            ? {
                available: false,
                reason: "No Observatory briefing has been published yet.",
              }
            : {
                available: true,
                briefing: sourceBriefing,
                cadence: "source-fallback",
                readOnly: true,
              };
        } catch (error: unknown) {
          return {
            available: false,
            reason:
              error instanceof Error
                ? error.message
                : "Observatory briefing could not be read.",
          };
        }
      },
    }),
    reviewMissionRecords: tool({
      description:
        "Read Daniel's synchronized Mission Control records for a specific area. Use this only when his question benefits from his actual tracked data. It never changes data.",
      inputSchema: z.object({
        area: z.enum([
          "overview",
          "university",
          "websites",
          "identity",
          "strength",
          "jiu-jitsu",
          "reading",
          "french",
        ]),
      }),
      execute: async ({ area }) => {
        try {
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
        } catch (error: unknown) {
          return {
            area,
            available: false,
            reason:
              error instanceof Error
                ? error.message
                : "Mission records could not be read.",
          };
        }
      },
    }),
  };
}
