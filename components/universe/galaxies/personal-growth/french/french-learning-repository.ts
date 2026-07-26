import {
  openPersonalGrowthDatabase,
  personalGrowthStoreNames,
  requestResult,
  transactionComplete,
} from "../personal-growth-database";
import {
  queueMissionRecordDelete,
  queueMissionRecordUpsert,
} from "@/lib/mission-record-sync";

import type {
  FrenchLearningProfile,
  FrenchLearningProfileUpdate,
  FrenchPracticeSession,
  FrenchPracticeSessionUpdate,
  FrenchProgressSnapshot,
  NewFrenchPracticeSession,
} from "./french-learning-record";

export type FrenchLearningData = Readonly<{
  profile: FrenchLearningProfile | null;
  sessions: readonly FrenchPracticeSession[];
  snapshots: readonly FrenchProgressSnapshot[];
}>;

const profileStoreName = personalGrowthStoreNames.frenchProfile;
const sessionStoreName = personalGrowthStoreNames.frenchSessions;
const snapshotStoreName = personalGrowthStoreNames.frenchSnapshots;

function validateProfile(input: FrenchLearningProfileUpdate) {
  if (
    (input.duolingoScore !== null &&
      (!Number.isInteger(input.duolingoScore) ||
        input.duolingoScore < 0 ||
        input.duolingoScore > 160)) ||
    (input.streakDays !== null &&
      (!Number.isInteger(input.streakDays) || input.streakDays < 0)) ||
    !Number.isInteger(input.weeklyTargetDays) ||
    input.weeklyTargetDays < 1 ||
    input.weeklyTargetDays > 7 ||
    !Number.isInteger(input.weeklyTargetMinutes) ||
    input.weeklyTargetMinutes < 5 ||
    input.weeklyTargetMinutes > 1_000
  ) {
    throw new Error("Review the Score, streak, and weekly targets.");
  }
}

function validateSession(input: NewFrenchPracticeSession) {
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 1 ||
    input.durationMinutes > 600 ||
    !Number.isInteger(input.lessonsCompleted) ||
    input.lessonsCompleted < 0 ||
    input.lessonsCompleted > 100 ||
    !Number.isInteger(input.confidence) ||
    input.confidence < 1 ||
    input.confidence > 5 ||
    Number.isNaN(Date.parse(`${input.occurredOn}T12:00:00`))
  ) {
    throw new Error("Review the practice date, time, lessons, and confidence.");
  }
}

export async function listFrenchLearningData(): Promise<FrenchLearningData> {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(
      [profileStoreName, sessionStoreName, snapshotStoreName],
      "readonly",
    );
    const [profile, sessions, snapshots] = await Promise.all([
      requestResult(
        transaction.objectStore(profileStoreName).get("primary") as IDBRequest<
          FrenchLearningProfile | undefined
        >,
      ),
      requestResult(
        transaction.objectStore(sessionStoreName).getAll() as IDBRequest<
          FrenchPracticeSession[]
        >,
      ),
      requestResult(
        transaction.objectStore(snapshotStoreName).getAll() as IDBRequest<
          FrenchProgressSnapshot[]
        >,
      ),
    ]);

    return {
      profile: profile ?? null,
      sessions: sessions.toSorted(
        (first, second) =>
          second.occurredOn.localeCompare(first.occurredOn) ||
          second.createdAt.localeCompare(first.createdAt),
      ),
      snapshots: snapshots.toSorted((first, second) =>
        second.occurredOn.localeCompare(first.occurredOn),
      ),
    };
  } finally {
    database.close();
  }
}

export async function saveFrenchLearningProfile(
  input: FrenchLearningProfileUpdate,
) {
  validateProfile(input);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const profile: FrenchLearningProfile = {
    ...input,
    duolingoUsername: input.duolingoUsername.trim().replace(/^@/, ""),
    id: "primary",
    updatedAt: now,
  };
  const snapshot: FrenchProgressSnapshot = {
    createdAt: now,
    duolingoScore: profile.duolingoScore,
    id: `french-progress:${today}`,
    occurredOn: today,
    streakDays: profile.streakDays,
    updatedAt: now,
  };
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(
      [profileStoreName, snapshotStoreName],
      "readwrite",
    );
    transaction.objectStore(profileStoreName).put(profile);
    transaction.objectStore(snapshotStoreName).put(snapshot);
    await transactionComplete(transaction);
    await Promise.all([
      queueMissionRecordUpsert(profileStoreName, profile),
      queueMissionRecordUpsert(snapshotStoreName, snapshot),
    ]);
    return { profile, snapshot };
  } finally {
    database.close();
  }
}

export async function saveFrenchPracticeSession(
  input: NewFrenchPracticeSession,
) {
  validateSession(input);
  const now = new Date().toISOString();
  const session: FrenchPracticeSession = {
    ...input,
    createdAt: now,
    id: crypto.randomUUID(),
    reflection: input.reflection.trim(),
    updatedAt: now,
  };
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    transaction.objectStore(sessionStoreName).add(session);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(sessionStoreName, session);
    return session;
  } finally {
    database.close();
  }
}

export async function updateFrenchPracticeSession(
  input: FrenchPracticeSessionUpdate,
) {
  validateSession(input);
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    const store = transaction.objectStore(sessionStoreName);
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<FrenchPracticeSession | undefined>,
    );

    if (existing === undefined) {
      throw new Error("This French practice session is no longer available.");
    }

    const updated: FrenchPracticeSession = {
      ...existing,
      ...input,
      reflection: input.reflection.trim(),
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(sessionStoreName, updated);
    return updated;
  } finally {
    database.close();
  }
}

export async function deleteFrenchPracticeSession(sessionId: string) {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    transaction.objectStore(sessionStoreName).delete(sessionId);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(sessionStoreName, sessionId);
  } finally {
    database.close();
  }
}
