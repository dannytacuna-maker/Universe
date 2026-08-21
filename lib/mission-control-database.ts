const databaseName = "mission-control";
const databaseVersion = 7;

export const personalGrowthStoreNames = {
  bodyWeight: "strength-body-weight",
  frenchProfile: "french-learning-profile",
  frenchSessions: "french-practice-sessions",
  frenchSnapshots: "french-progress-snapshots",
  jiuJitsuSessions: "jiu-jitsu-sessions",
  liftHistory: "strength-lift-history",
  personalRecords: "strength-personal-records",
  readingBooks: "reading-books",
  readingSessions: "reading-sessions",
  strengthSessions: "strength-training-sessions",
  workoutCompletions: "strength-workout-completions",
} as const;

export const universityStoreNames = {
  assignments: "university-assignments",
  grades: "university-grades",
  notes: "university-notes",
} as const;

export const websitesProductionStoreNames = {
  clients: "websites-clients",
  opportunities: "websites-opportunities",
  projects: "websites-projects",
} as const;

export const missionOperatingStoreNames = {
  captures: "mission-captures",
  cycleEvidence: "mission-cycle-evidence",
  experiments: "mission-experiments",
  growthCycles: "mission-growth-cycles",
  identity: "mission-identity",
  weeklyReviews: "mission-weekly-reviews",
} as const;

export const missionSyncStoreNames = {
  drafts: "mission-form-drafts",
  outbox: "mission-sync-outbox",
  state: "mission-sync-state",
} as const;

export const missionRecordStoreNames = {
  ...personalGrowthStoreNames,
  ...universityStoreNames,
  ...websitesProductionStoreNames,
  ...missionOperatingStoreNames,
} as const;

export type MissionRecordStoreName =
  (typeof missionRecordStoreNames)[keyof typeof missionRecordStoreNames];

export function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("The local database request failed.")),
    );
  });
}

export function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("abort", () =>
      reject(
        transaction.error ?? new Error("The local database write was aborted."),
      ),
    );
    transaction.addEventListener("error", () =>
      reject(
        transaction.error ?? new Error("The local database write failed."),
      ),
    );
  });
}

function createIndexedStore(
  database: IDBDatabase,
  name: string,
  keyPath: string,
  indexes: readonly string[] = [],
) {
  if (database.objectStoreNames.contains(name)) {
    return;
  }

  const store = database.createObjectStore(name, { keyPath });

  for (const index of indexes) {
    store.createIndex(index, index);
  }
}

export async function openMissionControlDatabase() {
  if (!("indexedDB" in window)) {
    throw new Error("Private browser storage is unavailable in this browser.");
  }

  const request = window.indexedDB.open(databaseName, databaseVersion);

  request.addEventListener("upgradeneeded", () => {
    const database = request.result;

    createIndexedStore(
      database,
      personalGrowthStoreNames.jiuJitsuSessions,
      "id",
      ["occurredOn"],
    );
    createIndexedStore(database, personalGrowthStoreNames.frenchProfile, "id");
    createIndexedStore(
      database,
      personalGrowthStoreNames.frenchSessions,
      "id",
      ["occurredOn", "focus"],
    );
    createIndexedStore(
      database,
      personalGrowthStoreNames.frenchSnapshots,
      "id",
      ["occurredOn"],
    );
    createIndexedStore(
      database,
      personalGrowthStoreNames.workoutCompletions,
      "id",
      ["weekStart"],
    );
    createIndexedStore(
      database,
      personalGrowthStoreNames.personalRecords,
      "liftId",
    );
    createIndexedStore(database, personalGrowthStoreNames.bodyWeight, "id", [
      "measuredOn",
    ]);
    createIndexedStore(database, personalGrowthStoreNames.readingBooks, "id", [
      "status",
      "updatedAt",
    ]);
    createIndexedStore(
      database,
      personalGrowthStoreNames.readingSessions,
      "id",
      ["bookId", "occurredOn"],
    );
    createIndexedStore(database, missionOperatingStoreNames.identity, "id");
    createIndexedStore(
      database,
      missionOperatingStoreNames.growthCycles,
      "id",
      ["status", "priority"],
    );
    createIndexedStore(
      database,
      missionOperatingStoreNames.cycleEvidence,
      "id",
      ["cycleId", "occurredOn"],
    );
    createIndexedStore(database, missionOperatingStoreNames.captures, "id", [
      "status",
      "createdAt",
    ]);
    createIndexedStore(
      database,
      missionOperatingStoreNames.weeklyReviews,
      "weekStart",
    );
    createIndexedStore(database, missionOperatingStoreNames.experiments, "id", [
      "status",
      "updatedAt",
    ]);
    createIndexedStore(
      database,
      personalGrowthStoreNames.strengthSessions,
      "id",
      ["occurredOn", "focus"],
    );
    createIndexedStore(database, personalGrowthStoreNames.liftHistory, "id", [
      "liftId",
      "achievedOn",
    ]);
    createIndexedStore(database, universityStoreNames.assignments, "id", [
      "courseId",
      "dueAt",
      "status",
    ]);
    createIndexedStore(database, universityStoreNames.grades, "id", [
      "courseId",
      "occurredOn",
    ]);
    createIndexedStore(database, universityStoreNames.notes, "id", [
      "courseId",
      "updatedAt",
    ]);
    createIndexedStore(database, websitesProductionStoreNames.clients, "id", [
      "status",
      "updatedAt",
    ]);
    createIndexedStore(
      database,
      websitesProductionStoreNames.opportunities,
      "id",
      ["clientId", "status", "updatedAt"],
    );
    createIndexedStore(database, websitesProductionStoreNames.projects, "id", [
      "clientId",
      "stage",
      "updatedAt",
    ]);
    createIndexedStore(database, missionSyncStoreNames.outbox, "id", [
      "createdAt",
    ]);
    createIndexedStore(database, missionSyncStoreNames.state, "id");
    createIndexedStore(database, missionSyncStoreNames.drafts, "id", [
      "updatedAt",
    ]);
  });

  return requestResult(request);
}
