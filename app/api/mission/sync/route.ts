import {
  isMissionRecordCollection,
  type MissionRecordMutation,
} from "@/lib/mission-record-collections";
import {
  applyMissionRecordMutations,
  isMissionDatabaseConfigured,
  listMissionRecords,
  migrateMissionRecordOwner,
} from "@/lib/server/mission-record-database";
import {
  getMissionAuthorization,
  isSameOriginRequest,
  legacyMissionOwnerId,
} from "@/lib/server/mission-auth";

export const runtime = "nodejs";

function parseMutation(value: unknown): MissionRecordMutation | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<MissionRecordMutation>;

  if (
    typeof candidate.clientMutationId !== "string" ||
    candidate.clientMutationId.length > 180 ||
    !isMissionRecordCollection(candidate.collection) ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.id !== "string" ||
    (candidate.kind !== "delete" && candidate.kind !== "upsert") ||
    typeof candidate.recordId !== "string" ||
    candidate.recordId.length > 180 ||
    typeof candidate.sourceUpdatedAt !== "string" ||
    Number.isNaN(Date.parse(candidate.sourceUpdatedAt)) ||
    (candidate.data !== null &&
      (typeof candidate.data !== "object" || Array.isArray(candidate.data)))
  ) {
    return null;
  }

  return candidate as MissionRecordMutation;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  if (!isMissionDatabaseConfigured()) {
    return Response.json(
      { error: "Cloud sync is not configured yet." },
      { status: 503 },
    );
  }

  const authorization = await getMissionAuthorization();

  if (!authorization.authenticated) {
    return Response.json(
      { error: "Google sign-in is required." },
      { status: 401 },
    );
  }

  if (authorization.owner === null) {
    return Response.json(
      { error: "This Google account is not authorized for Mission Control." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const rawMutations =
    typeof body === "object" &&
    body !== null &&
    "mutations" in body &&
    Array.isArray(body.mutations)
      ? body.mutations
      : null;

  if (rawMutations === null || rawMutations.length > 750) {
    return Response.json({ error: "Invalid sync payload." }, { status: 400 });
  }

  const mutations = rawMutations.map(parseMutation);

  if (mutations.some((mutation) => mutation === null)) {
    return Response.json({ error: "Invalid sync mutation." }, { status: 400 });
  }

  try {
    const ownerId = authorization.owner.id;
    await migrateMissionRecordOwner(legacyMissionOwnerId, ownerId);
    await applyMissionRecordMutations(
      ownerId,
      mutations as MissionRecordMutation[],
    );
    const collections = await listMissionRecords(ownerId);

    return Response.json({ collections, syncedAt: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Mission record synchronization failed.", error);
    const detail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? ` ${error.message}`
        : "";

    return Response.json(
      { error: `Mission record synchronization failed.${detail}` },
      { status: 500 },
    );
  }
}
