import type { JiuJitsuSession, NewJiuJitsuSession } from "./jiu-jitsu-session";

const databaseName = "mission-control";
const databaseVersion = 1;
const sessionStoreName = "jiu-jitsu-sessions";

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("The local database request failed.")),
    );
  });
}

function transactionComplete(transaction: IDBTransaction) {
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

async function openDatabase() {
  if (!("indexedDB" in window)) {
    throw new Error("Private browser storage is unavailable in this browser.");
  }

  const request = window.indexedDB.open(databaseName, databaseVersion);

  request.addEventListener("upgradeneeded", () => {
    const database = request.result;

    if (!database.objectStoreNames.contains(sessionStoreName)) {
      const store = database.createObjectStore(sessionStoreName, {
        keyPath: "id",
      });
      store.createIndex("occurredOn", "occurredOn");
    }
  });

  return requestResult(request);
}

export async function listJiuJitsuSessions() {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readonly");
    const sessions = await requestResult(
      transaction.objectStore(sessionStoreName).getAll() as IDBRequest<
        JiuJitsuSession[]
      >,
    );

    return sessions.toSorted((first, second) =>
      second.occurredOn.localeCompare(first.occurredOn),
    );
  } finally {
    database.close();
  }
}

export async function saveJiuJitsuSession(input: NewJiuJitsuSession) {
  const database = await openDatabase();
  const session: JiuJitsuSession = {
    ...input,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
  };

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    transaction.objectStore(sessionStoreName).add(session);
    await transactionComplete(transaction);
    return session;
  } finally {
    database.close();
  }
}

export async function deleteJiuJitsuSession(sessionId: string) {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    transaction.objectStore(sessionStoreName).delete(sessionId);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}
