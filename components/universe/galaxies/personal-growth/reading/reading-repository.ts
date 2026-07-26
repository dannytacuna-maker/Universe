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
  NewReadingBook,
  NewReadingSession,
  ReadingBook,
  ReadingBookUpdate,
  ReadingSession,
  ReadingSessionUpdate,
} from "./reading-record";

export type ReadingLibraryData = Readonly<{
  books: readonly ReadingBook[];
  sessions: readonly ReadingSession[];
}>;

const bookStoreName = personalGrowthStoreNames.readingBooks;
const sessionStoreName = personalGrowthStoreNames.readingSessions;

function normalizeSession(session: ReadingSession): ReadingSession {
  const legacy = session as ReadingSession & { updatedAt?: string };
  return { ...session, updatedAt: legacy.updatedAt ?? session.createdAt };
}

export async function listReadingLibraryData(): Promise<ReadingLibraryData> {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(
      [bookStoreName, sessionStoreName],
      "readonly",
    );
    const [books, sessions] = await Promise.all([
      requestResult(
        transaction.objectStore(bookStoreName).getAll() as IDBRequest<
          ReadingBook[]
        >,
      ),
      requestResult(
        transaction.objectStore(sessionStoreName).getAll() as IDBRequest<
          ReadingSession[]
        >,
      ),
    ]);

    return {
      books: books.toSorted((first, second) =>
        second.updatedAt.localeCompare(first.updatedAt),
      ),
      sessions: sessions
        .map(normalizeSession)
        .toSorted((first, second) =>
          second.occurredOn.localeCompare(first.occurredOn),
        ),
    };
  } finally {
    database.close();
  }
}

export async function saveReadingBook(input: NewReadingBook) {
  const title = input.title.trim();
  const author = input.author.trim();

  if (
    title.length === 0 ||
    !Number.isInteger(input.totalPages) ||
    input.totalPages < 1
  ) {
    throw new Error("Enter a title and a valid total page count.");
  }

  const now = new Date().toISOString();
  const book: ReadingBook = {
    author,
    createdAt: now,
    currentPage: 0,
    finalReflection: "",
    id: crypto.randomUUID(),
    rating: null,
    status: input.status,
    title,
    totalPages: input.totalPages,
    updatedAt: now,
  };
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(bookStoreName, "readwrite");
    transaction.objectStore(bookStoreName).add(book);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(bookStoreName, book);
    return book;
  } finally {
    database.close();
  }
}

export async function updateReadingBook(input: ReadingBookUpdate) {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(bookStoreName, "readwrite");
    const store = transaction.objectStore(bookStoreName);
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<ReadingBook | undefined>,
    );

    if (existing === undefined) {
      throw new Error("This book is no longer available in the library.");
    }

    const totalPages = Math.max(
      1,
      Math.round(input.totalPages ?? existing.totalPages),
    );
    const title = input.title?.trim() ?? existing.title;
    const author = input.author?.trim() ?? existing.author;

    if (title.length === 0) {
      throw new Error("A book title is required.");
    }

    const currentPage = Math.min(
      Math.max(Math.round(input.currentPage), 0),
      totalPages,
    );
    const rating =
      input.status === "completed" && input.rating !== null
        ? Math.min(Math.max(input.rating, 1), 5)
        : null;
    const updated: ReadingBook = {
      ...existing,
      author,
      currentPage,
      finalReflection:
        input.status === "completed" ? input.finalReflection.trim() : "",
      rating,
      status: input.status,
      title,
      totalPages,
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(bookStoreName, updated);
    return updated;
  } finally {
    database.close();
  }
}

export async function saveReadingSession(input: NewReadingSession) {
  if (
    !Number.isFinite(input.durationMinutes) ||
    input.durationMinutes < 1 ||
    !Number.isInteger(input.startPage) ||
    !Number.isInteger(input.endPage) ||
    input.startPage < 0 ||
    input.endPage < input.startPage
  ) {
    throw new Error("Enter valid reading time and page values.");
  }

  const database = await openPersonalGrowthDatabase();

  try {
    const readTransaction = database.transaction(bookStoreName, "readonly");
    const book = await requestResult(
      readTransaction
        .objectStore(bookStoreName)
        .get(input.bookId) as IDBRequest<ReadingBook | undefined>,
    );

    if (book === undefined) {
      throw new Error("Choose a book that is still in your library.");
    }

    if (input.endPage > book.totalPages) {
      throw new Error(`The ending page cannot exceed ${book.totalPages}.`);
    }

    const now = new Date().toISOString();
    const session: ReadingSession = {
      ...input,
      createdAt: now,
      id: crypto.randomUUID(),
      pagesRead: input.endPage - input.startPage,
      reflection: input.reflection.trim(),
      updatedAt: now,
    };
    const updatedBook: ReadingBook = {
      ...book,
      currentPage: Math.max(book.currentPage, input.endPage),
      status: book.status === "want-to-read" ? "reading" : book.status,
      updatedAt: now,
    };
    const writeTransaction = database.transaction(
      [bookStoreName, sessionStoreName],
      "readwrite",
    );
    writeTransaction.objectStore(sessionStoreName).add(session);
    writeTransaction.objectStore(bookStoreName).put(updatedBook);
    await transactionComplete(writeTransaction);

    await Promise.all([
      queueMissionRecordUpsert(sessionStoreName, session),
      queueMissionRecordUpsert(bookStoreName, updatedBook),
    ]);

    return { book: updatedBook, session };
  } finally {
    database.close();
  }
}

export async function updateReadingSession(input: ReadingSessionUpdate) {
  const database = await openPersonalGrowthDatabase();

  try {
    const transaction = database.transaction(
      [bookStoreName, sessionStoreName],
      "readwrite",
    );
    const sessionStore = transaction.objectStore(sessionStoreName);
    const bookStore = transaction.objectStore(bookStoreName);
    const [existing, book] = await Promise.all([
      requestResult(
        sessionStore.get(input.id) as IDBRequest<ReadingSession | undefined>,
      ),
      requestResult(
        bookStore.get(input.bookId) as IDBRequest<ReadingBook | undefined>,
      ),
    ]);

    if (existing === undefined || book === undefined) {
      throw new Error("This reading session is no longer available.");
    }

    if (
      input.durationMinutes < 1 ||
      input.startPage < 0 ||
      input.endPage < input.startPage ||
      input.endPage > book.totalPages
    ) {
      throw new Error("Review the reading time and page range.");
    }

    const updated: ReadingSession = {
      ...existing,
      ...input,
      pagesRead: input.endPage - input.startPage,
      reflection: input.reflection.trim(),
      updatedAt: new Date().toISOString(),
    };
    sessionStore.put(updated);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(sessionStoreName, updated);
    return updated;
  } finally {
    database.close();
  }
}

export async function deleteReadingSession(sessionId: string) {
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

export async function deleteReadingBook(bookId: string) {
  const database = await openPersonalGrowthDatabase();

  try {
    const readTransaction = database.transaction(sessionStoreName, "readonly");
    const sessions = await requestResult(
      readTransaction.objectStore(sessionStoreName).getAll() as IDBRequest<
        ReadingSession[]
      >,
    );
    const relatedSessions = sessions.filter(
      (session) => session.bookId === bookId,
    );
    const transaction = database.transaction(
      [bookStoreName, sessionStoreName],
      "readwrite",
    );
    transaction.objectStore(bookStoreName).delete(bookId);

    for (const session of relatedSessions) {
      transaction.objectStore(sessionStoreName).delete(session.id);
    }

    await transactionComplete(transaction);
    await Promise.all([
      queueMissionRecordDelete(bookStoreName, bookId),
      ...relatedSessions.map((session) =>
        queueMissionRecordDelete(sessionStoreName, session.id),
      ),
    ]);
  } finally {
    database.close();
  }
}
