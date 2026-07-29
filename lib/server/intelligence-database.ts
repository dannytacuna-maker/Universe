import { neon } from "@neondatabase/serverless";

import type {
  IntelligenceBriefing,
  IntelligenceBriefingItem,
  IntelligenceSourceFailureReason,
  IntelligenceSourceId,
  IntelligenceSourceStatus,
  IntelligenceTopic,
} from "@/lib/intelligence/contracts";
import { officialIntelligenceSources } from "@/lib/intelligence/official-sources";

type IntelligenceBriefingRow = Readonly<{
  briefing: unknown;
}>;

const sourceIds = new Set<string>(
  officialIntelligenceSources.map(({ id }) => id),
);
const topics = new Set<IntelligenceTopic>([
  "euro-area-economy",
  "international-trade",
  "monetary-policy",
]);
const failureReasons = new Set<IntelligenceSourceFailureReason>([
  "http-error",
  "invalid-feed",
  "network-error",
  "response-too-large",
  "timeout",
]);

let databaseClient: ReturnType<typeof neon> | null = null;
let schemaPromise: Promise<void> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSourceId(value: unknown): value is IntelligenceSourceId {
  return typeof value === "string" && sourceIds.has(value);
}

function isTopic(value: unknown): value is IntelligenceTopic {
  return typeof value === "string" && topics.has(value as IntelligenceTopic);
}

function isDateTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseBriefingItem(value: unknown): IntelligenceBriefingItem | null {
  if (
    !isRecord(value) ||
    typeof value.canonicalUrl !== "string" ||
    typeof value.id !== "string" ||
    (value.publishedAt !== null && !isDateTime(value.publishedAt)) ||
    !isSourceId(value.sourceId) ||
    typeof value.title !== "string" ||
    !isTopic(value.topic) ||
    typeof value.url !== "string"
  ) {
    return null;
  }

  return {
    canonicalUrl: value.canonicalUrl,
    id: value.id,
    publishedAt: value.publishedAt,
    sourceId: value.sourceId,
    title: value.title,
    topic: value.topic,
    url: value.url,
  };
}

function parseSourceStatus(value: unknown): IntelligenceSourceStatus | null {
  if (
    !isRecord(value) ||
    !isDateTime(value.fetchedAt) ||
    typeof value.feedUrl !== "string" ||
    !isSourceId(value.id) ||
    typeof value.itemCount !== "number" ||
    !Number.isSafeInteger(value.itemCount) ||
    value.itemCount < 0 ||
    typeof value.name !== "string" ||
    (value.status !== "failed" && value.status !== "ready")
  ) {
    return null;
  }

  if (value.status === "failed") {
    if (
      typeof value.failureReason !== "string" ||
      !failureReasons.has(
        value.failureReason as IntelligenceSourceFailureReason,
      )
    ) {
      return null;
    }

    return {
      failureReason: value.failureReason as IntelligenceSourceFailureReason,
      fetchedAt: value.fetchedAt,
      feedUrl: value.feedUrl,
      id: value.id,
      itemCount: value.itemCount,
      name: value.name,
      status: "failed",
    };
  }

  return {
    fetchedAt: value.fetchedAt,
    feedUrl: value.feedUrl,
    id: value.id,
    itemCount: value.itemCount,
    name: value.name,
    status: "ready",
  };
}

function parseStoredBriefing(value: unknown): IntelligenceBriefing | null {
  if (
    !isRecord(value) ||
    typeof value.briefingDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(value.briefingDate) ||
    !isDateTime(value.generatedAt) ||
    typeof value.id !== "string" ||
    !Array.isArray(value.items) ||
    typeof value.partial !== "boolean" ||
    !Array.isArray(value.sources)
  ) {
    return null;
  }

  const items = value.items.map(parseBriefingItem);
  const sources = value.sources.map(parseSourceStatus);

  if (
    items.some((item) => item === null) ||
    sources.some((source) => source === null)
  ) {
    return null;
  }

  return {
    briefingDate: value.briefingDate,
    generatedAt: value.generatedAt,
    id: value.id,
    items: items as IntelligenceBriefingItem[],
    partial: value.partial,
    sources: sources as IntelligenceSourceStatus[],
  };
}

function getIntelligenceDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("Mission Control intelligence storage is not configured.");
  }

  databaseClient ??= neon(databaseUrl);
  return databaseClient;
}

export function isIntelligenceDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function ensureIntelligenceSchema() {
  schemaPromise ??= (async () => {
    const sql = getIntelligenceDatabase();

    await sql`
      CREATE TABLE IF NOT EXISTS intelligence_briefings (
        briefing_date DATE PRIMARY KEY,
        briefing_id TEXT NOT NULL UNIQUE,
        generated_at TIMESTAMPTZ NOT NULL,
        partial BOOLEAN NOT NULL,
        briefing JSONB NOT NULL
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS intelligence_briefings_generated_index
      ON intelligence_briefings (generated_at DESC)
    `;
  })();

  return schemaPromise;
}

export async function saveIntelligenceBriefing(briefing: IntelligenceBriefing) {
  await ensureIntelligenceSchema();
  const sql = getIntelligenceDatabase();
  const serializedBriefing = JSON.stringify(briefing);

  await sql`
    INSERT INTO intelligence_briefings (
      briefing_date,
      briefing_id,
      generated_at,
      partial,
      briefing
    )
    VALUES (
      ${briefing.briefingDate}::date,
      ${briefing.id},
      ${briefing.generatedAt}::timestamptz,
      ${briefing.partial},
      ${serializedBriefing}::jsonb
    )
    ON CONFLICT (briefing_date) DO UPDATE SET
      briefing_id = EXCLUDED.briefing_id,
      generated_at = EXCLUDED.generated_at,
      partial = EXCLUDED.partial,
      briefing = EXCLUDED.briefing
  `;
}

export async function getLatestIntelligenceBriefing() {
  await ensureIntelligenceSchema();
  const sql = getIntelligenceDatabase();
  const rows = (await sql`
    SELECT briefing
    FROM intelligence_briefings
    ORDER BY generated_at DESC
    LIMIT 1
  `) as IntelligenceBriefingRow[];
  const row = rows[0];

  if (row === undefined) return null;

  const briefing = parseStoredBriefing(row.briefing);

  if (briefing === null) {
    throw new Error("The stored intelligence briefing is invalid.");
  }

  return briefing;
}
