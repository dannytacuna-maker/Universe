import {
  readingShelfForStatus,
  type ReadingBook,
  type ReadingSession,
  type ReadingShelfId,
} from "./reading-record";

export type ReadingSummary = Readonly<{
  completed: readonly ReadingBook[];
  currentBook: ReadingBook | null;
  currentlyReading: readonly ReadingBook[];
  pagesThisWeek: number;
  recentReflections: readonly ReadingSession[];
  timeThisWeekMinutes: number;
  wantToRead: readonly ReadingBook[];
  wantToReadNext: readonly ReadingBook[];
}>;

function startOfCurrentWeek(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

function booksOnShelf(
  books: readonly ReadingBook[],
  shelf: ReadingShelfId,
): readonly ReadingBook[] {
  return books.filter((book) => readingShelfForStatus(book.status) === shelf);
}

export function deriveReadingSummary(
  books: readonly ReadingBook[],
  sessions: readonly ReadingSession[],
  now = new Date(),
): ReadingSummary {
  const weekStart = startOfCurrentWeek(now).getTime();
  const weeklySessions = sessions.filter(
    (session) =>
      new Date(`${session.occurredOn}T12:00:00`).getTime() >= weekStart,
  );
  const currentlyReading = booksOnShelf(books, "reading");
  const wantToRead = booksOnShelf(books, "want-to-read");

  return {
    completed: booksOnShelf(books, "completed"),
    currentBook:
      currentlyReading.find((book) => book.status === "reading") ??
      currentlyReading[0] ??
      null,
    currentlyReading,
    pagesThisWeek: weeklySessions.reduce(
      (total, session) => total + session.pagesRead,
      0,
    ),
    recentReflections: sessions
      .filter((session) => session.reflection.length > 0)
      .slice(0, 4),
    timeThisWeekMinutes: weeklySessions.reduce(
      (total, session) => total + session.durationMinutes,
      0,
    ),
    wantToRead,
    wantToReadNext: wantToRead.slice(0, 4),
  };
}
