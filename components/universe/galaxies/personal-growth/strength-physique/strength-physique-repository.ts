import {
  openPersonalGrowthDatabase,
  personalGrowthStoreNames,
  requestResult,
  transactionComplete,
} from "../personal-growth-database";
import type { StrengthWorkoutDayId } from "./strength-physique-plan";
import type {
  BodyWeightEntry,
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
  StrengthPersonalRecord,
  StrengthWorkoutCompletion,
} from "./strength-physique-record";

export type StrengthPhysiqueData = Readonly<{
  bodyWeightEntries: readonly BodyWeightEntry[];
  completions: readonly StrengthWorkoutCompletion[];
  personalRecords: readonly StrengthPersonalRecord[];
}>;

export async function listStrengthPhysiqueData(): Promise<StrengthPhysiqueData> {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(
      [
        personalGrowthStoreNames.workoutCompletions,
        personalGrowthStoreNames.personalRecords,
        personalGrowthStoreNames.bodyWeight,
      ],
      "readonly",
    );
    const [completions, personalRecords, bodyWeightEntries] = await Promise.all(
      [
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
      ],
    );

    return {
      bodyWeightEntries: bodyWeightEntries.toSorted((first, second) =>
        second.measuredOn.localeCompare(first.measuredOn),
      ),
      completions,
      personalRecords,
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

  try {
    const transaction = database.transaction(
      personalGrowthStoreNames.personalRecords,
      "readwrite",
    );
    transaction
      .objectStore(personalGrowthStoreNames.personalRecords)
      .put(record);
    await transactionComplete(transaction);
    return record;
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
  } finally {
    database.close();
  }
}
