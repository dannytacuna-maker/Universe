import { neon } from "@neondatabase/serverless";
import type { UIMessage } from "ai";

import type {
  JarvisMode,
  JarvisThread,
  JarvisThreadSummary,
} from "@/lib/jarvis";

type JarvisThreadRow = Readonly<{
  created_at: Date | string;
  id: string;
  messages: unknown;
  mode: JarvisMode;
  title: string;
  updated_at: Date | string;
}>;

type JarvisThreadSummaryRow = Omit<JarvisThreadRow, "messages"> &
  Readonly<{ message_count: number | string }>;

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

function toIsoString(value: Date | string) {
  return new Date(value).toISOString();
}

function mapThread(row: JarvisThreadRow): JarvisThread {
  return {
    createdAt: toIsoString(row.created_at),
    id: row.id,
    messages: Array.isArray(row.messages) ? (row.messages as UIMessage[]) : [],
    mode: row.mode,
    title: row.title,
    updatedAt: toIsoString(row.updated_at),
  };
}

export function isJarvisConfigured() {
  const hasGatewayIdentity = Boolean(
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    process.env.VERCEL === "1",
  );

  return Boolean(process.env.DATABASE_URL && hasGatewayIdentity);
}

export function ensureJarvisSchema() {
  schemaPromise ??= (async () => {
    const sql = getDatabase();

    await sql`
      CREATE TABLE IF NOT EXISTS jarvis_threads (
        owner_id TEXT NOT NULL,
        id UUID NOT NULL,
        title TEXT NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('quick', 'analyze', 'deep-review')),
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived_at TIMESTAMPTZ,
        PRIMARY KEY (owner_id, id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS jarvis_threads_owner_updated_index
      ON jarvis_threads (owner_id, updated_at DESC)
      WHERE archived_at IS NULL
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS jarvis_request_windows (
        owner_id TEXT NOT NULL,
        window_start TIMESTAMPTZ NOT NULL,
        request_count INTEGER NOT NULL,
        PRIMARY KEY (owner_id, window_start)
      )
    `;
  })();

  return schemaPromise;
}

export async function createJarvisThread(ownerId: string, mode: JarvisMode) {
  await ensureJarvisSchema();
  const sql = getDatabase();
  const id = crypto.randomUUID();
  const rows = (await sql`
    INSERT INTO jarvis_threads (owner_id, id, title, mode)
    VALUES (${ownerId}, ${id}::uuid, 'New conversation', ${mode})
    RETURNING id, title, mode, messages, created_at, updated_at
  `) as JarvisThreadRow[];
  const row = rows[0];

  if (!row) throw new Error("Jarvis could not create a conversation.");
  return mapThread(row);
}

export async function listJarvisThreads(
  ownerId: string,
): Promise<JarvisThreadSummary[]> {
  await ensureJarvisSchema();
  const sql = getDatabase();
  const rows = (await sql`
    SELECT
      id,
      title,
      mode,
      created_at,
      updated_at,
      jsonb_array_length(messages) AS message_count
    FROM jarvis_threads
    WHERE owner_id = ${ownerId} AND archived_at IS NULL
    ORDER BY updated_at DESC
    LIMIT 40
  `) as JarvisThreadSummaryRow[];

  return rows.map((row) => ({
    createdAt: toIsoString(row.created_at),
    id: row.id,
    messageCount: Number(row.message_count),
    mode: row.mode,
    title: row.title,
    updatedAt: toIsoString(row.updated_at),
  }));
}

export async function getJarvisThread(ownerId: string, threadId: string) {
  await ensureJarvisSchema();
  const sql = getDatabase();
  const rows = (await sql`
    SELECT id, title, mode, messages, created_at, updated_at
    FROM jarvis_threads
    WHERE owner_id = ${ownerId}
      AND id = ${threadId}::uuid
      AND archived_at IS NULL
    LIMIT 1
  `) as JarvisThreadRow[];

  const row = rows[0];
  return row ? mapThread(row) : null;
}

export async function saveJarvisThread(
  ownerId: string,
  threadId: string,
  input: Readonly<{
    messages: UIMessage[];
    mode: JarvisMode;
    title: string;
  }>,
) {
  await ensureJarvisSchema();
  const sql = getDatabase();
  const serializedMessages = JSON.stringify(input.messages);

  await sql`
    UPDATE jarvis_threads
    SET
      messages = ${serializedMessages}::jsonb,
      mode = ${input.mode},
      title = ${input.title},
      updated_at = NOW()
    WHERE owner_id = ${ownerId}
      AND id = ${threadId}::uuid
      AND archived_at IS NULL
  `;
}

export async function updateJarvisThread(
  ownerId: string,
  threadId: string,
  input: Readonly<{ mode?: JarvisMode; title?: string }>,
) {
  await ensureJarvisSchema();
  const sql = getDatabase();
  const current = await getJarvisThread(ownerId, threadId);
  if (!current) return null;

  const title = input.title?.trim().slice(0, 80) || current.title;
  const mode = input.mode ?? current.mode;
  const rows = (await sql`
    UPDATE jarvis_threads
    SET title = ${title}, mode = ${mode}, updated_at = NOW()
    WHERE owner_id = ${ownerId}
      AND id = ${threadId}::uuid
      AND archived_at IS NULL
    RETURNING id, title, mode, messages, created_at, updated_at
  `) as JarvisThreadRow[];

  const row = rows[0];
  return row ? mapThread(row) : null;
}

export async function archiveJarvisThread(ownerId: string, threadId: string) {
  await ensureJarvisSchema();
  const sql = getDatabase();
  await sql`
    UPDATE jarvis_threads
    SET archived_at = NOW(), updated_at = NOW()
    WHERE owner_id = ${ownerId} AND id = ${threadId}::uuid
  `;
}

export async function consumeJarvisRequestAllowance(ownerId: string) {
  await ensureJarvisSchema();
  const sql = getDatabase();
  const windowStart = new Date();
  windowStart.setUTCSeconds(0, 0);
  const rows = (await sql`
    INSERT INTO jarvis_request_windows (owner_id, window_start, request_count)
    VALUES (${ownerId}, ${windowStart.toISOString()}::timestamptz, 1)
    ON CONFLICT (owner_id, window_start) DO UPDATE
    SET request_count = jarvis_request_windows.request_count + 1
    RETURNING request_count
  `) as unknown as ReadonlyArray<Readonly<{ request_count: number }>>;

  return (rows[0]?.request_count ?? 1) <= 20;
}
