import type { ReadingBook, ReadingSession } from "./reading-record";

export type ReadingSummary = Readonly<{
  currentBook: ReadingBook | null;
  pagesThisWeek: number;
  recentReflections: readonly ReadingSession[];
  timeThisWeekMinutes: number;
  wantToReadNext: readonly ReadingBook[];
}>;

function startOfCurrentWeek(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
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

  return {
    currentBook: books.find((book) => book.status === "reading") ?? null,
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
    wantToReadNext: books
      .filter((book) => book.status === "want-to-read")
      .slice(0, 4),
  };
}
