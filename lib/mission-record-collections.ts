import {
  missionOperatingStoreNames,
  personalGrowthStoreNames,
  universityStoreNames,
  websitesProductionStoreNames,
  type MissionRecordStoreName,
} from "@/lib/mission-control-database";

export type { MissionRecordStoreName } from "@/lib/mission-control-database";

export const missionRecordCollections = [
  ...Object.values(personalGrowthStoreNames),
  ...Object.values(missionOperatingStoreNames),
  ...Object.values(universityStoreNames),
  ...Object.values(websitesProductionStoreNames),
] as const satisfies readonly MissionRecordStoreName[];

const missionRecordCollectionSet = new Set<string>(missionRecordCollections);

export function isMissionRecordCollection(
  value: unknown,
): value is MissionRecordStoreName {
  return typeof value === "string" && missionRecordCollectionSet.has(value);
}

export function getMissionRecordId(
  collection: MissionRecordStoreName,
  record: Readonly<Record<string, unknown>>,
) {
  const key =
    collection === personalGrowthStoreNames.personalRecords
      ? record.liftId
      : collection === missionOperatingStoreNames.weeklyReviews
        ? record.weekStart
        : record.id;

  if (typeof key !== "string" || key.length === 0) {
    throw new Error(`A record in ${collection} is missing its stable ID.`);
  }

  return key;
}

export function getMissionRecordTimestamp(
  record: Readonly<Record<string, unknown>>,
) {
  const candidates = [
    record.updatedAt,
    record.createdAt,
    record.completedAt,
    record.occurredOn,
    record.measuredOn,
    record.achievedOn,
    record.dueAt,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && !Number.isNaN(Date.parse(candidate))) {
      return new Date(candidate).toISOString();
    }
  }

  return new Date(0).toISOString();
}

export type MissionRecordMutation = Readonly<{
  clientMutationId: string;
  collection: MissionRecordStoreName;
  createdAt: string;
  data: Readonly<Record<string, unknown>> | null;
  id: string;
  kind: "delete" | "upsert";
  recordId: string;
  sourceUpdatedAt: string;
}>;
