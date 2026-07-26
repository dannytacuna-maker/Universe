import {
  openMissionControlDatabase,
  requestResult,
  transactionComplete,
  universityStoreNames,
} from "@/lib/mission-control-database";
import {
  queueMissionRecordDelete,
  queueMissionRecordUpsert,
} from "@/lib/mission-record-sync";

import type {
  NewUniversityAssignment,
  NewUniversityGrade,
  NewUniversityNote,
  UniversityAssignment,
  UniversityAssignmentUpdate,
  UniversityData,
  UniversityGrade,
  UniversityNote,
} from "./university-record";

export async function listUniversityData(): Promise<UniversityData> {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      Object.values(universityStoreNames),
      "readonly",
    );
    const [assignments, grades, notes] = await Promise.all([
      requestResult(
        transaction
          .objectStore(universityStoreNames.assignments)
          .getAll() as IDBRequest<UniversityAssignment[]>,
      ),
      requestResult(
        transaction
          .objectStore(universityStoreNames.grades)
          .getAll() as IDBRequest<UniversityGrade[]>,
      ),
      requestResult(
        transaction
          .objectStore(universityStoreNames.notes)
          .getAll() as IDBRequest<UniversityNote[]>,
      ),
    ]);

    return {
      assignments: assignments.toSorted((first, second) =>
        first.dueAt.localeCompare(second.dueAt),
      ),
      grades: grades.toSorted((first, second) =>
        second.occurredOn.localeCompare(first.occurredOn),
      ),
      notes: notes.toSorted((first, second) =>
        second.updatedAt.localeCompare(first.updatedAt),
      ),
    };
  } finally {
    database.close();
  }
}

function validateAssignment(input: NewUniversityAssignment) {
  if (
    input.title.trim().length === 0 ||
    Number.isNaN(Date.parse(input.dueAt))
  ) {
    throw new Error("Name the assignment and choose a valid deadline.");
  }
}

export async function saveUniversityAssignment(input: NewUniversityAssignment) {
  validateAssignment(input);
  const now = new Date().toISOString();
  const assignment: UniversityAssignment = {
    ...input,
    createdAt: now,
    details: input.details.trim(),
    id: crypto.randomUUID(),
    title: input.title.trim(),
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      universityStoreNames.assignments,
      "readwrite",
    );
    transaction.objectStore(universityStoreNames.assignments).add(assignment);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(
      universityStoreNames.assignments,
      assignment,
    );
    return assignment;
  } finally {
    database.close();
  }
}

export async function updateUniversityAssignment(
  input: UniversityAssignmentUpdate,
) {
  validateAssignment(input);
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      universityStoreNames.assignments,
      "readwrite",
    );
    const store = transaction.objectStore(universityStoreNames.assignments);
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<UniversityAssignment | undefined>,
    );

    if (existing === undefined) {
      throw new Error("This assignment is no longer available.");
    }

    const updated: UniversityAssignment = {
      ...existing,
      ...input,
      details: input.details.trim(),
      title: input.title.trim(),
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(universityStoreNames.assignments, updated);
    return updated;
  } finally {
    database.close();
  }
}

export async function deleteUniversityAssignment(id: string) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      universityStoreNames.assignments,
      "readwrite",
    );
    transaction.objectStore(universityStoreNames.assignments).delete(id);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(universityStoreNames.assignments, id);
  } finally {
    database.close();
  }
}

export async function saveUniversityGrade(input: NewUniversityGrade) {
  if (
    input.label.trim().length === 0 ||
    !Number.isFinite(input.score) ||
    !Number.isFinite(input.maximumScore) ||
    input.maximumScore <= 0 ||
    input.score < 0 ||
    input.score > input.maximumScore
  ) {
    throw new Error("Review the assessment name and score.");
  }

  const now = new Date().toISOString();
  const grade: UniversityGrade = {
    ...input,
    createdAt: now,
    id: crypto.randomUUID(),
    label: input.label.trim(),
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      universityStoreNames.grades,
      "readwrite",
    );
    transaction.objectStore(universityStoreNames.grades).add(grade);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(universityStoreNames.grades, grade);
    return grade;
  } finally {
    database.close();
  }
}

export async function deleteUniversityGrade(id: string) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      universityStoreNames.grades,
      "readwrite",
    );
    transaction.objectStore(universityStoreNames.grades).delete(id);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(universityStoreNames.grades, id);
  } finally {
    database.close();
  }
}

export async function saveUniversityNote(input: NewUniversityNote) {
  const content = input.content.trim();

  if (content.length === 0) {
    throw new Error("Write a note or reflection before saving.");
  }

  const now = new Date().toISOString();
  const note: UniversityNote = {
    ...input,
    content,
    createdAt: now,
    id: crypto.randomUUID(),
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      universityStoreNames.notes,
      "readwrite",
    );
    transaction.objectStore(universityStoreNames.notes).add(note);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(universityStoreNames.notes, note);
    return note;
  } finally {
    database.close();
  }
}

export async function deleteUniversityNote(id: string) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      universityStoreNames.notes,
      "readwrite",
    );
    transaction.objectStore(universityStoreNames.notes).delete(id);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(universityStoreNames.notes, id);
  } finally {
    database.close();
  }
}
