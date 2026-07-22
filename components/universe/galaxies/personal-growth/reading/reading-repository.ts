import {
  openPersonalGrowthDatabase,
  personalGrowthStoreNames,
  requestResult,
  transactionComplete,
} from "../personal-growth-database";
import type {
  NewReadingBook,
  NewReadingSession,
  ReadingBook,
  ReadingBookUpdate,
  ReadingSession,
} from "./reading-record";

export type ReadingLibraryData = Readonly<{
  books: readonly ReadingBook[];
  sessions: readonly ReadingSession[];
}>;

const bookStoreName = personalGrowthStoreNames.readingBooks;
const sessionStoreName = personalGrowthStoreNames.readingSessions;

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
      sessions: sessions.toSorted((first, second) =>
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

    const currentPage = Math.min(
      Math.max(Math.round(input.currentPage), 0),
      existing.totalPages,
    );
    const rating =
      input.status === "completed" && input.rating !== null
        ? Math.min(Math.max(input.rating, 1), 5)
        : null;
    const updated: ReadingBook = {
      ...existing,
      currentPage,
      finalReflection:
        input.status === "completed" ? input.finalReflection.trim() : "",
      rating,
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
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

    return { book: updatedBook, session };
  } finally {
    database.close();
  }
}
