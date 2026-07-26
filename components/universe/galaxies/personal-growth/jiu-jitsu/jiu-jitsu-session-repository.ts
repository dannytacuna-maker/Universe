import {
  queueMissionRecordDelete,
  queueMissionRecordUpsert,
} from "@/lib/mission-record-sync";

import type {
  JiuJitsuSession,
  JiuJitsuSessionUpdate,
  NewJiuJitsuSession,
} from "./jiu-jitsu-session";
import {
  openPersonalGrowthDatabase,
  personalGrowthStoreNames,
  requestResult,
  transactionComplete,
} from "../personal-growth-database";

const sessionStoreName = personalGrowthStoreNames.jiuJitsuSessions;

function normalizeSession(session: JiuJitsuSession): JiuJitsuSession {
  const legacy = session as JiuJitsuSession & {
    reflection?: string;
    updatedAt?: string;
  };

  return {
    ...session,
    notes: session.notes ?? "",
    reflection: legacy.reflection ?? session.notes ?? "",
    updatedAt: legacy.updatedAt ?? session.createdAt,
  };
}

function validateSession(input: NewJiuJitsuSession) {
  if (
    !Object.hasOwn(
      {
        competition: true,
        drilling: true,
        gi: true,
        "no-gi": true,
        "open-mat": true,
      },
      input.classType,
    ) ||
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 1 ||
    input.durationMinutes > 360 ||
    !Number.isInteger(input.sparringRounds) ||
    input.sparringRounds < 0 ||
    input.sparringRounds > 50 ||
    Number.isNaN(Date.parse(input.occurredOn))
  ) {
    throw new Error("Review the session date, duration, and sparring rounds.");
  }
}

export async function listJiuJitsuSessions() {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readonly");
    const sessions = await requestResult(
      transaction.objectStore(sessionStoreName).getAll() as IDBRequest<
        JiuJitsuSession[]
      >,
    );

    return sessions
      .map(normalizeSession)
      .toSorted((first, second) =>
        second.occurredOn.localeCompare(first.occurredOn),
      );
  } finally {
    database.close();
  }
}

export async function saveJiuJitsuSession(input: NewJiuJitsuSession) {
  validateSession(input);
  const database = await openPersonalGrowthDatabase();
  const now = new Date().toISOString();
  const session: JiuJitsuSession = {
    ...input,
    createdAt: now,
    id: crypto.randomUUID(),
    notes: input.notes.trim(),
    reflection: input.reflection.trim(),
    techniques: input.techniques
      .map((technique) => technique.trim())
      .filter(Boolean),
    updatedAt: now,
  };

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

export async function updateJiuJitsuSession(input: JiuJitsuSessionUpdate) {
  validateSession(input);
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(sessionStoreName, "readwrite");
    const store = transaction.objectStore(sessionStoreName);
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<JiuJitsuSession | undefined>,
    );

    if (existing === undefined) {
      throw new Error("This training session is no longer available.");
    }

    const updated: JiuJitsuSession = {
      ...existing,
      ...input,
      notes: input.notes.trim(),
      reflection: input.reflection.trim(),
      techniques: input.techniques
        .map((technique) => technique.trim())
        .filter(Boolean),
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

export async function deleteJiuJitsuSession(sessionId: string) {
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
