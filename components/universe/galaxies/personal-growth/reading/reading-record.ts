export type ReadingBookStatus =
  "abandoned" | "completed" | "paused" | "reading" | "want-to-read";

export type ReadingBook = Readonly<{
  author: string;
  createdAt: string;
  currentPage: number;
  finalReflection: string;
  id: string;
  rating: number | null;
  status: ReadingBookStatus;
  title: string;
  totalPages: number;
  updatedAt: string;
}>;

export type NewReadingBook = Pick<
  ReadingBook,
  "author" | "status" | "title" | "totalPages"
>;

export type ReadingBookUpdate = Pick<
  ReadingBook,
  "currentPage" | "finalReflection" | "id" | "rating" | "status"
>;

export type ReadingSession = Readonly<{
  bookId: string;
  createdAt: string;
  durationMinutes: number;
  endPage: number;
  id: string;
  occurredOn: string;
  pagesRead: number;
  reflection: string;
  startPage: number;
}>;

export type NewReadingSession = Omit<
  ReadingSession,
  "createdAt" | "id" | "pagesRead"
>;

export const readingBookStatusLabels = {
  abandoned: "Abandoned",
  completed: "Completed",
  paused: "Paused",
  reading: "Reading",
  "want-to-read": "Want to read",
} as const satisfies Record<ReadingBookStatus, string>;
