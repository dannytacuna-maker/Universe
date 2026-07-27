"use client";

import {
  missionSyncStoreNames,
  openMissionControlDatabase,
  requestResult,
  transactionComplete,
  type MissionRecordStoreName,
} from "@/lib/mission-control-database";
import {
  getMissionRecordId,
  getMissionRecordTimestamp,
  missionRecordCollections,
  type MissionRecordMutation,
} from "@/lib/mission-record-collections";

const bootstrapStateId = "remote-bootstrap-v2-google";
const syncStatusEventName = "mission-control:sync-status";
const dataChangedEventName = "mission-control:data-changed";

export type MissionCloudState =
  "checking" | "error" | "local" | "locked" | "offline" | "synced" | "syncing";

export type MissionSyncStatus = Readonly<{
  detail: string;
  pendingCount: number;
  state: MissionCloudState;
  syncedAt: string | null;
}>;

type MissionSyncStateRecord = Readonly<{
  completedAt: string;
  id: string;
}>;

type SyncResponse = Readonly<{
  collections: Partial<Record<MissionRecordStoreName, unknown[]>>;
  syncedAt: string;
}>;

const initialStatus: MissionSyncStatus = {
  detail: "Checking Google-authenticated cloud access.",
  pendingCount: 0,
  state: "checking",
  syncedAt: null,
};

let currentStatus = initialStatus;
let activeSync: Promise<MissionSyncStatus> | null = null;

function dispatchStatus(status: MissionSyncStatus) {
  currentStatus = status;
  window.dispatchEvent(
    new CustomEvent<MissionSyncStatus>(syncStatusEventName, { detail: status }),
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createMutation(
  collection: MissionRecordStoreName,
  kind: MissionRecordMutation["kind"],
  recordId: string,
  data: Readonly<Record<string, unknown>> | null,
  sourceUpdatedAt: string,
  clientMutationId = crypto.randomUUID(),
): MissionRecordMutation {
  const createdAt = new Date().toISOString();

  return {
    clientMutationId,
    collection,
    createdAt,
    data,
    id: clientMutationId,
    kind,
    recordId,
    sourceUpdatedAt,
  };
}

async function queueMutation(mutation: MissionRecordMutation) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionSyncStoreNames.outbox,
      "readwrite",
    );
    transaction.objectStore(missionSyncStoreNames.outbox).put(mutation);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function queueMissionRecordUpsert(
  collection: MissionRecordStoreName,
  record: object,
  clientMutationId?: string,
) {
  if (!isRecord(record)) {
    throw new Error("Only structured records can be synchronized.");
  }

  const mutation = createMutation(
    collection,
    "upsert",
    getMissionRecordId(collection, record),
    record,
    getMissionRecordTimestamp(record),
    clientMutationId,
  );
  await queueMutation(mutation);
  void synchronizeMissionRecords();
  return mutation.clientMutationId;
}

export async function queueMissionRecordDelete(
  collection: MissionRecordStoreName,
  recordId: string,
  clientMutationId?: string,
) {
  const mutation = createMutation(
    collection,
    "delete",
    recordId,
    null,
    new Date().toISOString(),
    clientMutationId,
  );
  await queueMutation(mutation);
  void synchronizeMissionRecords();
  return mutation.clientMutationId;
}

async function readLocalSyncPayload(database: IDBDatabase) {
  const transaction = database.transaction(
    [
      ...missionRecordCollections,
      missionSyncStoreNames.outbox,
      missionSyncStoreNames.state,
    ],
    "readonly",
  );
  const outbox = await requestResult(
    transaction
      .objectStore(missionSyncStoreNames.outbox)
      .getAll() as IDBRequest<MissionRecordMutation[]>,
  );
  const bootstrapState = await requestResult(
    transaction
      .objectStore(missionSyncStoreNames.state)
      .get(bootstrapStateId) as IDBRequest<MissionSyncStateRecord | undefined>,
  );

  if (bootstrapState !== undefined) {
    return { bootstrapMutations: [], outbox };
  }

  const bootstrapMutations: MissionRecordMutation[] = [];

  for (const collection of missionRecordCollections) {
    const records = await requestResult(
      transaction.objectStore(collection).getAll() as IDBRequest<unknown[]>,
    );

    for (const value of records) {
      if (!isRecord(value)) {
        continue;
      }

      const recordId = getMissionRecordId(collection, value);
      const sourceUpdatedAt = getMissionRecordTimestamp(value);
      bootstrapMutations.push(
        createMutation(
          collection,
          "upsert",
          recordId,
          value,
          sourceUpdatedAt,
          `bootstrap:${collection}:${recordId}:${sourceUpdatedAt}`,
        ),
      );
    }
  }

  return { bootstrapMutations, outbox };
}

async function applyRemoteCollections(
  database: IDBDatabase,
  response: SyncResponse,
  sentMutationIds: readonly string[],
) {
  const transaction = database.transaction(
    [
      ...missionRecordCollections,
      missionSyncStoreNames.outbox,
      missionSyncStoreNames.state,
    ],
    "readwrite",
  );

  for (const collection of missionRecordCollections) {
    const store = transaction.objectStore(collection);
    store.clear();

    for (const value of response.collections[collection] ?? []) {
      if (isRecord(value)) {
        store.put(value);
      }
    }
  }

  const outbox = transaction.objectStore(missionSyncStoreNames.outbox);

  for (const mutationId of sentMutationIds) {
    outbox.delete(mutationId);
  }

  transaction.objectStore(missionSyncStoreNames.state).put({
    completedAt: response.syncedAt,
    id: bootstrapStateId,
  } satisfies MissionSyncStateRecord);
  await transactionComplete(transaction);
}

async function performSync() {
  if (!navigator.onLine) {
    const offlineStatus: MissionSyncStatus = {
      detail: "Offline. Changes remain safely queued on this device.",
      pendingCount: currentStatus.pendingCount,
      state: "offline",
      syncedAt: currentStatus.syncedAt,
    };
    dispatchStatus(offlineStatus);
    return offlineStatus;
  }

  dispatchStatus({
    ...currentStatus,
    detail: "Synchronizing private records.",
    state: "syncing",
  });
  const database = await openMissionControlDatabase();

  try {
    const { bootstrapMutations, outbox } = await readLocalSyncPayload(database);
    const mutations = [...bootstrapMutations, ...outbox];
    const response = await fetch("/api/mission/sync", {
      body: JSON.stringify({ mutations }),
      cache: "no-store",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    if (response.status === 401) {
      const lockedStatus: MissionSyncStatus = {
        detail: "Google sign-in is required. Local records remain available.",
        pendingCount: outbox.length,
        state: "locked",
        syncedAt: currentStatus.syncedAt,
      };
      dispatchStatus(lockedStatus);
      return lockedStatus;
    }

    if (response.status === 503) {
      const localStatus: MissionSyncStatus = {
        detail: "Using local storage while cloud sync is unavailable.",
        pendingCount: outbox.length,
        state: "local",
        syncedAt: null,
      };
      dispatchStatus(localStatus);
      return localStatus;
    }

    if (!response.ok) {
      throw new Error("The personal cloud did not accept this sync.");
    }

    const payload = (await response.json()) as SyncResponse;
    await applyRemoteCollections(
      database,
      payload,
      outbox.map((mutation) => mutation.id),
    );
    const syncedStatus: MissionSyncStatus = {
      detail: "Signed-in devices share one personal source of truth.",
      pendingCount: 0,
      state: "synced",
      syncedAt: payload.syncedAt,
    };
    dispatchStatus(syncedStatus);
    window.dispatchEvent(new Event(dataChangedEventName));
    return syncedStatus;
  } catch (error: unknown) {
    const transaction = database.transaction(
      missionSyncStoreNames.outbox,
      "readonly",
    );
    const pendingCount = await requestResult(
      transaction.objectStore(missionSyncStoreNames.outbox).count(),
    ).catch(() => currentStatus.pendingCount);
    const errorStatus: MissionSyncStatus = {
      detail:
        error instanceof Error
          ? `${error.message} Changes remain queued on this device.`
          : "Cloud sync failed. Changes remain queued on this device.",
      pendingCount,
      state: navigator.onLine ? "error" : "offline",
      syncedAt: currentStatus.syncedAt,
    };
    dispatchStatus(errorStatus);
    return errorStatus;
  } finally {
    database.close();
  }
}

export function synchronizeMissionRecords() {
  activeSync ??= performSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

export function getMissionSyncStatus() {
  return currentStatus;
}

export function subscribeToMissionSyncStatus(
  listener: (status: MissionSyncStatus) => void,
) {
  const handleStatus = (event: Event) => {
    listener((event as CustomEvent<MissionSyncStatus>).detail);
  };
  window.addEventListener(syncStatusEventName, handleStatus);
  return () => window.removeEventListener(syncStatusEventName, handleStatus);
}

export function subscribeToMissionDataChanges(listener: () => void) {
  window.addEventListener(dataChangedEventName, listener);
  return () => window.removeEventListener(dataChangedEventName, listener);
}
