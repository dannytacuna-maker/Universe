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
import type { StrengthWorkoutDayId } from "./strength-physique-plan";
import type {
  BodyWeightEntry,
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
  NewStrengthTrainingSession,
  StrengthLiftObservation,
  StrengthPersonalRecord,
  StrengthTrainingSession,
  StrengthTrainingSessionUpdate,
  StrengthWorkoutCompletion,
} from "./strength-physique-record";

export type StrengthPhysiqueData = Readonly<{
  bodyWeightEntries: readonly BodyWeightEntry[];
  completions: readonly StrengthWorkoutCompletion[];
  liftHistory: readonly StrengthLiftObservation[];
  personalRecords: readonly StrengthPersonalRecord[];
  sessions: readonly StrengthTrainingSession[];
}>;

const sessionStoreName = personalGrowthStoreNames.strengthSessions;

function validateTrainingSession(input: NewStrengthTrainingSession) {
  if (Number.isNaN(Date.parse(input.occurredOn))) {
    throw new Error("Choose a valid training date.");
  }

  if (
    input.perceivedExertion !== null &&
    (input.perceivedExertion < 1 || input.perceivedExertion > 10)
  ) {
    throw new Error("Perceived exertion must be between one and ten.");
  }

  if (input.exercises.length === 0) {
    throw new Error("Record at least one exercise before saving.");
  }

  for (const exercise of input.exercises) {
    if (
      exercise.name.trim().length === 0 ||
      !Number.isInteger(exercise.sets) ||
      exercise.sets < 1 ||
      !Number.isInteger(exercise.reps) ||
      exercise.reps < 1 ||
      (exercise.weightKg !== null && exercise.weightKg < 0)
    ) {
      throw new Error("Review each exercise, set, rep, and weight value.");
    }
  }
}

export async function listStrengthPhysiqueData(): Promise<StrengthPhysiqueData> {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(
      [
        personalGrowthStoreNames.workoutCompletions,
        personalGrowthStoreNames.personalRecords,
        personalGrowthStoreNames.bodyWeight,
        personalGrowthStoreNames.liftHistory,
        personalGrowthStoreNames.strengthSessions,
      ],
      "readonly",
    );
    const [
      completions,
      personalRecords,
      bodyWeightEntries,
      liftHistory,
      sessions,
    ] = await Promise.all([
      requestResult(
        transaction
          .objectStore(personalGrowthStoreNames.workoutCompletions)
          .getAll() as IDBRequest<StrengthWorkoutCompletion[]>,
      ),
      requestResult(
        transaction
          .objectStore(personalGrowthStoreNames.personalRecords)
          .getAll() as IDBRequest<StrengthPersonalRecord[]>,
      ),
      requestResult(
        transaction
          .objectStore(personalGrowthStoreNames.bodyWeight)
          .getAll() as IDBRequest<BodyWeightEntry[]>,
      ),
      requestResult(
        transaction
          .objectStore(personalGrowthStoreNames.liftHistory)
          .getAll() as IDBRequest<StrengthLiftObservation[]>,
      ),
      requestResult(
        transaction.objectStore(sessionStoreName).getAll() as IDBRequest<
          StrengthTrainingSession[]
        >,
      ),
    ]);

    return {
      bodyWeightEntries: bodyWeightEntries.toSorted((first, second) =>
        second.measuredOn.localeCompare(first.measuredOn),
      ),
      completions,
      liftHistory: liftHistory.toSorted((first, second) =>
        second.achievedOn.localeCompare(first.achievedOn),
      ),
      personalRecords,
      sessions: sessions.toSorted((first, second) =>
        second.occurredOn.localeCompare(first.occurredOn),
      ),
    };
  } finally {
    database.close();
  }
}

export async function setWorkoutCompletion(
  dayId: StrengthWorkoutDayId,
  weekStart: string,
  completed: boolean,
) {
  const database = await openPersonalGrowthDatabase();
  const id = `${weekStart}:${dayId}`;

  try {
    const transaction = database.transaction(
      personalGrowthStoreNames.workoutCompletions,
      "readwrite",
    );
    const store = transaction.objectStore(
      personalGrowthStoreNames.workoutCompletions,
    );
    const completion: StrengthWorkoutCompletion | null = completed
      ? {
          completedAt: new Date().toISOString(),
          dayId,
          id,
          weekStart,
        }
      : null;

    if (completion === null) {
      store.delete(id);
    } else {
      store.put(completion);
    }

    await transactionComplete(transaction);
    if (completion === null) {
      await queueMissionRecordDelete(
        personalGrowthStoreNames.workoutCompletions,
        id,
      );
    } else {
      await queueMissionRecordUpsert(
        personalGrowthStoreNames.workoutCompletions,
        completion,
      );
    }
    return completion;
  } finally {
    database.close();
  }
}

export async function saveStrengthPersonalRecord(
  input: NewStrengthPersonalRecord,
) {
  if (
    !Number.isFinite(input.weightKg) ||
    input.weightKg <= 0 ||
    input.achievedOn.length === 0
  ) {
    throw new Error("Enter a valid personal record and date.");
  }

  const database = await openPersonalGrowthDatabase();
  const record: StrengthPersonalRecord = {
    ...input,
    updatedAt: new Date().toISOString(),
  };
  const observation: StrengthLiftObservation = {
    achievedOn: input.achievedOn,
    createdAt: record.updatedAt,
    id: crypto.randomUUID(),
    liftId: input.liftId,
    weightKg: input.weightKg,
  };

  try {
    const transaction = database.transaction(
      [
        personalGrowthStoreNames.personalRecords,
        personalGrowthStoreNames.liftHistory,
      ],
      "readwrite",
    );
    transaction
      .objectStore(personalGrowthStoreNames.personalRecords)
      .put(record);
    transaction
      .objectStore(personalGrowthStoreNames.liftHistory)
      .add(observation);
    await transactionComplete(transaction);
    await Promise.all([
      queueMissionRecordUpsert(
        personalGrowthStoreNames.personalRecords,
        record,
      ),
      queueMissionRecordUpsert(
        personalGrowthStoreNames.liftHistory,
        observation,
      ),
    ]);
    return { observation, record };
  } finally {
    database.close();
  }
}

export async function saveBodyWeightEntry(input: NewBodyWeightEntry) {
  if (
    !Number.isFinite(input.weightKg) ||
    input.weightKg <= 0 ||
    input.measuredOn.length === 0
  ) {
    throw new Error("Enter a valid body weight and date.");
  }

  const database = await openPersonalGrowthDatabase();
  const entry: BodyWeightEntry = {
    ...input,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
  };

  try {
    const transaction = database.transaction(
      personalGrowthStoreNames.bodyWeight,
      "readwrite",
    );
    transaction.objectStore(personalGrowthStoreNames.bodyWeight).add(entry);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(personalGrowthStoreNames.bodyWeight, entry);
    return entry;
  } finally {
    database.close();
  }
}

export async function deleteBodyWeightEntry(entryId: string) {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(
      personalGrowthStoreNames.bodyWeight,
      "readwrite",
    );
    transaction
      .objectStore(personalGrowthStoreNames.bodyWeight)
      .delete(entryId);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(
      personalGrowthStoreNames.bodyWeight,
      entryId,
    );
  } finally {
    database.close();
  }
}

export async function saveStrengthTrainingSession(
  input: NewStrengthTrainingSession,
) {
  validateTrainingSession(input);
  const now = new Date().toISOString();
  const session: StrengthTrainingSession = {
    ...input,
    createdAt: now,
    exercises: input.exercises.map((exercise) => ({
      ...exercise,
      name: exercise.name.trim(),
    })),
    id: crypto.randomUUID(),
    notes: input.notes.trim(),
    physiqueNotes: input.physiqueNotes.trim(),
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

export async function updateStrengthTrainingSession(
  input: StrengthTrainingSessionUpdate,
) {
  validateTrainingSession(input);
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    const store = transaction.objectStore(sessionStoreName);
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<StrengthTrainingSession | undefined>,
    );

    if (existing === undefined) {
      throw new Error("This strength session is no longer available.");
    }

    const updated: StrengthTrainingSession = {
      ...existing,
      ...input,
      exercises: input.exercises.map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
      })),
      notes: input.notes.trim(),
      physiqueNotes: input.physiqueNotes.trim(),
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

export async function deleteStrengthTrainingSession(sessionId: string) {
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
