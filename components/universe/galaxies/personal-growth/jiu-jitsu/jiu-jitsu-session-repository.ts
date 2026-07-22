import type { JiuJitsuSession, NewJiuJitsuSession } from "./jiu-jitsu-session";
import {
  openPersonalGrowthDatabase,
  personalGrowthStoreNames,
  requestResult,
  transactionComplete,
} from "../personal-growth-database";

const sessionStoreName = personalGrowthStoreNames.jiuJitsuSessions;

export async function listJiuJitsuSessions() {
  const database = await openPersonalGrowthDatabase();

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
  const database = await openPersonalGrowthDatabase();
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
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    transaction.objectStore(sessionStoreName).delete(sessionId);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}
