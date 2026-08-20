export type ReadingBookStatus =
  "abandoned" | "completed" | "paused" | "reading" | "want-to-read";

export type ReadingShelfId = "completed" | "reading" | "want-to-read";

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
> &
  Partial<Pick<ReadingBook, "author" | "title" | "totalPages">>;

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
  updatedAt: string;
}>;

export type NewReadingSession = Omit<
  ReadingSession,
  "createdAt" | "id" | "pagesRead" | "updatedAt"
>;

export type ReadingSessionUpdate = NewReadingSession & Readonly<{ id: string }>;

export const readingBookStatusLabels = {
  abandoned: "Abandoned",
  completed: "Completed",
  paused: "Paused",
  reading: "Reading",
  "want-to-read": "Want to read",
} as const satisfies Record<ReadingBookStatus, string>;

export const readingShelfLabels = {
  completed: "Completed",
  reading: "Currently reading",
  "want-to-read": "Want to read",
} as const satisfies Record<ReadingShelfId, string>;

export function readingShelfForStatus(
  status: ReadingBookStatus,
): ReadingShelfId {
  switch (status) {
    case "abandoned":
    case "completed":
      return "completed";
    case "paused":
    case "reading":
      return "reading";
    case "want-to-read":
      return "want-to-read";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function readingStatusForShelf(
  shelf: ReadingShelfId,
): ReadingBookStatus {
  switch (shelf) {
    case "completed":
      return "completed";
    case "reading":
      return "reading";
    case "want-to-read":
      return "want-to-read";
    default: {
      const exhaustive: never = shelf;
      return exhaustive;
    }
  }
}

export function parseReadingShelfId(value: string): ReadingShelfId | null {
  switch (value) {
    case "completed":
    case "reading":
    case "want-to-read":
      return value;
    default:
      return null;
  }
}
