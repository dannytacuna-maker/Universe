import { neon } from "@neondatabase/serverless";

type CalendarFeedRow = Readonly<{
  ics_url: string;
}>;

let databaseClient: ReturnType<typeof neon> | null = null;
let schemaPromise: Promise<void> | null = null;

function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Mission Control cloud storage is not configured.");
  }

  databaseClient ??= neon(databaseUrl);
  return databaseClient;
}

function ensureSchema() {
  schemaPromise ??= (async () => {
    const sql = getDatabase();
    await sql`
      CREATE TABLE IF NOT EXISTS mission_calendar_feeds (
        owner_id TEXT PRIMARY KEY,
        ics_url TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  })();

  return schemaPromise;
}

export function isCalendarFeedStoreConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getEnvCalendarIcsUrl() {
  const value = process.env.MISSION_CONTROL_CALENDAR_ICS_URL?.trim();
  return value || null;
}

export async function getStoredCalendarIcsUrl(ownerId: string) {
  const fromEnv = getEnvCalendarIcsUrl();
  if (fromEnv) return fromEnv;

  if (!isCalendarFeedStoreConfigured()) return null;

  await ensureSchema();
  const sql = getDatabase();
  const rows = (await sql`
    SELECT ics_url
    FROM mission_calendar_feeds
    WHERE owner_id = ${ownerId}
    LIMIT 1
  `) as CalendarFeedRow[];

  return rows[0]?.ics_url ?? null;
}

export function isValidGoogleCalendarIcsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (url.hostname !== "calendar.google.com") return false;
    return /\/calendar\/ical\/[^/]+\/private-[^/]+\/basic\.ics$/i.test(
      url.pathname,
    );
  } catch {
    return false;
  }
}

export async function saveCalendarIcsUrl(ownerId: string, icsUrl: string) {
  const normalized = icsUrl.trim();
  if (!isValidGoogleCalendarIcsUrl(normalized)) {
    throw new Error(
      "Paste the Google Calendar secret iCal URL (…/private-…/basic.ics).",
    );
  }

  await ensureSchema();
  const sql = getDatabase();
  await sql`
    INSERT INTO mission_calendar_feeds (owner_id, ics_url, updated_at)
    VALUES (${ownerId}, ${normalized}, NOW())
    ON CONFLICT (owner_id)
    DO UPDATE SET ics_url = EXCLUDED.ics_url, updated_at = NOW()
  `;

  return normalized;
}
