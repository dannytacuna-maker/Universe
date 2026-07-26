import { neon } from "@neondatabase/serverless";

import type {
  MissionRecordMutation,
  MissionRecordStoreName,
} from "@/lib/mission-record-collections";

type MissionRecordRow = Readonly<{
  collection: string;
  data: unknown;
  record_id: string;
}>;

let databaseClient: ReturnType<typeof neon> | null = null;
let schemaPromise: Promise<void> | null = null;

function getMissionDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("Mission Control cloud storage is not configured.");
  }

  databaseClient ??= neon(databaseUrl);
  return databaseClient;
}

export function isMissionDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function ensureMissionRecordSchema() {
  schemaPromise ??= (async () => {
    const sql = getMissionDatabase();

    await sql`
      CREATE TABLE IF NOT EXISTS mission_record_mutations (
        owner_id TEXT NOT NULL,
        client_mutation_id TEXT NOT NULL,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (owner_id, client_mutation_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS mission_records (
        owner_id TEXT NOT NULL,
        collection TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data JSONB,
        source_updated_at TIMESTAMPTZ NOT NULL,
        server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        PRIMARY KEY (owner_id, collection, record_id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS mission_records_owner_updated_index
      ON mission_records (owner_id, server_updated_at DESC)
    `;
  })();

  return schemaPromise;
}

export async function applyMissionRecordMutations(
  ownerId: string,
  mutations: readonly MissionRecordMutation[],
) {
  await ensureMissionRecordSchema();
  const sql = getMissionDatabase();

  for (const mutation of mutations) {
    const serializedData =
      mutation.data === null ? null : JSON.stringify(mutation.data);
    const deletedAt = mutation.kind === "delete" ? mutation.createdAt : null;

    await sql`
      WITH accepted AS (
        INSERT INTO mission_record_mutations (
          owner_id,
          client_mutation_id
        )
        VALUES (${ownerId}, ${mutation.clientMutationId})
        ON CONFLICT (owner_id, client_mutation_id) DO NOTHING
        RETURNING client_mutation_id
      )
      INSERT INTO mission_records (
        owner_id,
        collection,
        record_id,
        data,
        source_updated_at,
        deleted_at
      )
      SELECT
        ${ownerId},
        ${mutation.collection},
        ${mutation.recordId},
        ${serializedData}::jsonb,
        ${mutation.sourceUpdatedAt}::timestamptz,
        ${deletedAt}::timestamptz
      FROM accepted
      ON CONFLICT (owner_id, collection, record_id) DO UPDATE SET
        data = EXCLUDED.data,
        source_updated_at = EXCLUDED.source_updated_at,
        server_updated_at = NOW(),
        deleted_at = EXCLUDED.deleted_at
      WHERE EXCLUDED.source_updated_at >= mission_records.source_updated_at
    `;
  }
}

export async function listMissionRecords(ownerId: string) {
  await ensureMissionRecordSchema();
  const sql = getMissionDatabase();
  const rows = (await sql`
    SELECT collection, record_id, data
    FROM mission_records
    WHERE owner_id = ${ownerId} AND deleted_at IS NULL
    ORDER BY server_updated_at ASC
  `) as MissionRecordRow[];
  const collections: Partial<Record<MissionRecordStoreName, unknown[]>> = {};

  for (const row of rows) {
    const collection = row.collection as MissionRecordStoreName;
    const records = collections[collection] ?? [];
    records.push(row.data);
    collections[collection] = records;
  }

  return collections;
}
