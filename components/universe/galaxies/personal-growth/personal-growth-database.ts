const databaseName = "mission-control";
const databaseVersion = 3;

export const personalGrowthStoreNames = {
  bodyWeight: "strength-body-weight",
  jiuJitsuSessions: "jiu-jitsu-sessions",
  personalRecords: "strength-personal-records",
  readingBooks: "reading-books",
  readingSessions: "reading-sessions",
  workoutCompletions: "strength-workout-completions",
} as const;

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

export async function openPersonalGrowthDatabase() {
  if (!("indexedDB" in window)) {
    throw new Error("Private browser storage is unavailable in this browser.");
  }

  const request = window.indexedDB.open(databaseName, databaseVersion);

  request.addEventListener("upgradeneeded", () => {
    const database = request.result;

    if (
      !database.objectStoreNames.contains(
        personalGrowthStoreNames.jiuJitsuSessions,
      )
    ) {
      const store = database.createObjectStore(
        personalGrowthStoreNames.jiuJitsuSessions,
        { keyPath: "id" },
      );
      store.createIndex("occurredOn", "occurredOn");
    }

    if (
      !database.objectStoreNames.contains(
        personalGrowthStoreNames.workoutCompletions,
      )
    ) {
      const store = database.createObjectStore(
        personalGrowthStoreNames.workoutCompletions,
        { keyPath: "id" },
      );
      store.createIndex("weekStart", "weekStart");
    }

    if (
      !database.objectStoreNames.contains(
        personalGrowthStoreNames.personalRecords,
      )
    ) {
      database.createObjectStore(personalGrowthStoreNames.personalRecords, {
        keyPath: "liftId",
      });
    }

    if (
      !database.objectStoreNames.contains(personalGrowthStoreNames.bodyWeight)
    ) {
      const store = database.createObjectStore(
        personalGrowthStoreNames.bodyWeight,
        { keyPath: "id" },
      );
      store.createIndex("measuredOn", "measuredOn");
    }

    if (
      !database.objectStoreNames.contains(personalGrowthStoreNames.readingBooks)
    ) {
      const store = database.createObjectStore(
        personalGrowthStoreNames.readingBooks,
        { keyPath: "id" },
      );
      store.createIndex("status", "status");
      store.createIndex("updatedAt", "updatedAt");
    }

    if (
      !database.objectStoreNames.contains(
        personalGrowthStoreNames.readingSessions,
      )
    ) {
      const store = database.createObjectStore(
        personalGrowthStoreNames.readingSessions,
        { keyPath: "id" },
      );
      store.createIndex("bookId", "bookId");
      store.createIndex("occurredOn", "occurredOn");
    }
  });

  return requestResult(request);
}
