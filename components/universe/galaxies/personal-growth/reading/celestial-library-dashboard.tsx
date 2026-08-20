"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import { activateInterfaceSurface } from "@/lib/interface-surface";

import {
  parseReadingShelfId,
  readingShelfForStatus,
  readingShelfLabels,
  readingStatusForShelf,
  type NewReadingBook,
  type NewReadingSession,
  type ReadingBook,
  type ReadingBookUpdate,
  type ReadingSession,
  type ReadingShelfId,
} from "./reading-record";
import type { ReadingSummary } from "./reading-summary";

type CelestialLibraryDashboardProps = Readonly<{
  books: readonly ReadingBook[];
  isLoading: boolean;
  isVisible: boolean;
  onAddBook: (input: NewReadingBook) => Promise<void>;
  onAddSession: (input: NewReadingSession) => Promise<void>;
  onEditBook: (input: ReadingBookUpdate) => Promise<void>;
  onRemoveBook: (bookId: string) => Promise<void>;
  onRemoveSession: (sessionId: string) => Promise<void>;
  sessions: readonly ReadingSession[];
  storageError: string | null;
  summary: ReadingSummary;
}>;

const volumePalette = [
  "#5c2a3a",
  "#2a3d5c",
  "#2d4634",
  "#5a4020",
  "#3d2a55",
  "#4a2a2a",
  "#1f3f3c",
  "#4a3820",
] as const;

const shelfOrder = [
  "reading",
  "want-to-read",
  "completed",
] as const satisfies readonly ReadingShelfId[];

function todayAsInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours === 0 ? `${remainder}m` : `${hours}h ${remainder}m`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function volumeAppearance(title: string) {
  let hash = 0;

  for (const character of title) {
    hash = Math.imul(hash, 31) + character.charCodeAt(0);
  }

  return {
    color: volumePalette[Math.abs(hash) % volumePalette.length],
    height: 7.2 + (Math.abs(hash) % 5) * 0.55,
  };
}

function bookProgress(book: ReadingBook) {
  return Math.min(book.currentPage / book.totalPages, 1);
}

function toBookUpdate(
  book: ReadingBook,
  changes: Partial<
    Pick<
      ReadingBook,
      | "author"
      | "currentPage"
      | "finalReflection"
      | "rating"
      | "status"
      | "title"
      | "totalPages"
    >
  >,
): ReadingBookUpdate {
  return {
    author: changes.author ?? book.author,
    currentPage: changes.currentPage ?? book.currentPage,
    finalReflection: changes.finalReflection ?? book.finalReflection,
    id: book.id,
    rating: changes.rating === undefined ? book.rating : changes.rating,
    status: changes.status ?? book.status,
    title: changes.title ?? book.title,
    totalPages: changes.totalPages ?? book.totalPages,
  };
}

function bookStatusCaption(book: ReadingBook) {
  switch (book.status) {
    case "abandoned":
      return "Set aside";
    case "paused":
      return "Paused";
    case "completed":
    case "reading":
    case "want-to-read":
      return null;
    default: {
      const exhaustive: never = book.status;
      return exhaustive;
    }
  }
}

export function CelestialLibraryDashboard({
  books,
  isLoading,
  isVisible,
  onAddBook,
  onAddSession,
  onEditBook,
  onRemoveBook,
  onRemoveSession,
  sessions,
  storageError,
  summary,
}: CelestialLibraryDashboardProps) {
  const addBookFormId = useId();
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [checkInRevision, setCheckInRevision] = useState(0);
  const [feedback, setFeedback] = useState("");
  const operationLockRef = useRef(false);

  const selectedBook = books.find((book) => book.id === selectedBookId) ?? null;
  const selectedSessions = useMemo(
    () =>
      selectedBook === null
        ? []
        : sessions.filter((session) => session.bookId === selectedBook.id),
    [selectedBook, sessions],
  );

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    activateInterfaceSurface("reading-library");
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const runOperation = async (
    operation: () => Promise<void>,
    successMessage: string,
    failureMessage: string,
  ) => {
    if (operationLockRef.current) {
      return false;
    }

    operationLockRef.current = true;
    setIsSaving(true);
    setFeedback("");

    try {
      await operation();
      setFeedback(successMessage);
      return true;
    } catch (error: unknown) {
      setFeedback(error instanceof Error ? error.message : failureMessage);
      return false;
    } finally {
      operationLockRef.current = false;
      setIsSaving(false);
    }
  };

  const handleAddBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const shelf = parseReadingShelfId(String(data.get("shelf") ?? ""));

    if (shelf === null) {
      setFeedback("Choose a shelf for this book.");
      return;
    }
    const input: NewReadingBook = {
      author: String(data.get("author") ?? "").trim(),
      status: readingStatusForShelf(shelf),
      title: String(data.get("title") ?? "").trim(),
      totalPages: Number(data.get("totalPages")),
    };
    const didSave = await runOperation(
      () => onAddBook(input),
      "Book added to the library.",
      "The book could not be saved.",
    );

    if (didSave) {
      form.reset();
      setIsAddingBook(false);
    }
  };

  const handleCheckIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedBook === null) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const page = Number(data.get("page"));
    const input: NewReadingSession = {
      bookId: selectedBook.id,
      durationMinutes: Math.max(
        0,
        Math.round(Number(data.get("durationMinutes") || 0)),
      ),
      endPage: page,
      occurredOn: todayAsInputValue(),
      reflection: String(data.get("reflection") ?? "").trim(),
      startPage: selectedBook.currentPage,
    };
    const didSave = await runOperation(
      () => onAddSession(input),
      "Reading recorded.",
      "This update could not be saved.",
    );

    if (didSave) {
      setCheckInRevision((current) => current + 1);
    }
  };

  const handleMoveToShelf = async (
    book: ReadingBook,
    shelf: ReadingShelfId,
  ) => {
    const nextStatus = readingStatusForShelf(shelf);
    await runOperation(
      () =>
        onEditBook(
          toBookUpdate(book, {
            currentPage:
              nextStatus === "completed" ? book.totalPages : book.currentPage,
            status: nextStatus,
          }),
        ),
      `Moved to ${readingShelfLabels[shelf].toLowerCase()}.`,
      "The book could not be moved.",
    );
  };

  const handleRemoveBook = async (book: ReadingBook) => {
    const relatedSessionCount = sessions.filter(
      (session) => session.bookId === book.id,
    ).length;
    const sessionWarning =
      relatedSessionCount === 0
        ? ""
        : ` and ${relatedSessionCount} recorded ${
            relatedSessionCount === 1 ? "update" : "updates"
          }`;

    if (
      !window.confirm(
        `Delete "${book.title}"${sessionWarning}? This cannot be undone.`,
      )
    ) {
      return;
    }

    const didRemove = await runOperation(
      () => onRemoveBook(book.id),
      "Book removed from the library.",
      "The book could not be deleted.",
    );

    if (didRemove) {
      setSelectedBookId(null);
    }
  };

  const handleRemoveSession = async (session: ReadingSession) => {
    if (
      !window.confirm("Delete this recorded update? This cannot be undone.")
    ) {
      return;
    }

    await runOperation(
      () => onRemoveSession(session.id),
      "Update deleted.",
      "The update could not be deleted.",
    );
  };

  const currentBook = summary.currentBook;
  const selectedShelfLabel =
    selectedBook === null
      ? null
      : readingShelfLabels[readingShelfForStatus(selectedBook.status)];
  const shelves: Readonly<Record<ReadingShelfId, readonly ReadingBook[]>> = {
    completed: summary.completed,
    reading: summary.currentlyReading,
    "want-to-read": summary.wantToRead,
  };

  return (
    <aside
      aria-label="Celestial reading library"
      className="immersive-dashboard celestial-library-dashboard"
    >
      <header className="immersive-dashboard__header library-dashboard__header">
        <div>
          {selectedBook === null ? (
            <>
              <span>Reading · Celestial Library</span>
              <strong>Your shelves</strong>
              <p>
                {currentBook === null
                  ? "See what you have finished, what you are reading, and what comes next."
                  : `${currentBook.title} · page ${currentBook.currentPage} of ${currentBook.totalPages}`}
              </p>
            </>
          ) : (
            <>
              <span>{selectedShelfLabel}</span>
              <strong>{selectedBook.title}</strong>
              <p>
                {selectedBook.author || "Unknown author"} · page{" "}
                {selectedBook.currentPage} of {selectedBook.totalPages}
              </p>
            </>
          )}
        </div>
        <div className="library-dashboard__header-actions">
          {selectedBook !== null ? (
            <button
              disabled={isSaving}
              onClick={() => setSelectedBookId(null)}
              type="button"
            >
              Back to shelves
            </button>
          ) : (
            <button
              aria-controls={addBookFormId}
              aria-expanded={isAddingBook}
              disabled={isSaving}
              onClick={() => setIsAddingBook((current) => !current)}
              type="button"
            >
              {isAddingBook ? "Close" : "Add a book"}
            </button>
          )}
        </div>
      </header>

      {selectedBook === null && isAddingBook ? (
        <form
          className="library-action library-add-form"
          id={addBookFormId}
          onSubmit={handleAddBook}
        >
          <label>
            Title
            <input autoFocus name="title" required type="text" />
          </label>
          <label>
            Author
            <input name="author" type="text" />
          </label>
          <label>
            Pages
            <input min="1" name="totalPages" required type="number" />
          </label>
          <label>
            Shelf
            <select defaultValue="want-to-read" name="shelf">
              {shelfOrder.map((shelf) => (
                <option key={shelf} value={shelf}>
                  {readingShelfLabels[shelf]}
                </option>
              ))}
            </select>
          </label>
          <button disabled={isSaving} type="submit">
            Add to library
          </button>
        </form>
      ) : null}

      {selectedBook === null ? (
        <div className="library-shelves">
          {isLoading ? <p>Opening the library.</p> : null}
          {shelfOrder.map((shelf) => (
            <LibraryShelf
              books={shelves[shelf]}
              key={shelf}
              onSelect={setSelectedBookId}
              selectedBookId={selectedBookId}
              shelf={shelf}
            />
          ))}
        </div>
      ) : (
        <LibraryBookDesk
          book={selectedBook}
          checkInRevision={checkInRevision}
          isSaving={isSaving}
          onCheckIn={handleCheckIn}
          onMoveToShelf={(shelf) => void handleMoveToShelf(selectedBook, shelf)}
          onRemoveBook={() => void handleRemoveBook(selectedBook)}
          onRemoveSession={(session) => void handleRemoveSession(session)}
          sessions={selectedSessions}
        />
      )}

      <p className="immersive-dashboard__feedback">
        {summary.timeThisWeekMinutes > 0
          ? `${formatMinutes(summary.timeThisWeekMinutes)} recorded this week.`
          : "Saved locally first. Cloud sync status is shown in Mission."}
      </p>
      {storageError !== null ? (
        <p className="immersive-dashboard__error">{storageError}</p>
      ) : null}
      <p aria-live="polite" className="immersive-dashboard__feedback">
        {feedback}
      </p>
    </aside>
  );
}

function LibraryShelf({
  books,
  onSelect,
  selectedBookId,
  shelf,
}: Readonly<{
  books: readonly ReadingBook[];
  onSelect: (bookId: string) => void;
  selectedBookId: string | null;
  shelf: ReadingShelfId;
}>) {
  return (
    <section className="library-shelf" data-shelf={shelf}>
      <header>
        <span>{readingShelfLabels[shelf]}</span>
        <strong>{books.length}</strong>
      </header>
      {books.length === 0 ? (
        <p className="library-shelf__empty">
          {shelf === "reading"
            ? "No book open yet."
            : shelf === "want-to-read"
              ? "Nothing waiting on this shelf."
              : "Finished books will collect here."}
        </p>
      ) : (
        <ul className="library-shelf__books">
          {books.map((book) =>
            shelf === "reading" ? (
              <li key={book.id}>
                <ReadingVolume
                  book={book}
                  onSelect={onSelect}
                  selected={book.id === selectedBookId}
                />
              </li>
            ) : (
              <li key={book.id}>
                <BookSpine
                  book={book}
                  onSelect={onSelect}
                  selected={book.id === selectedBookId}
                />
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function ReadingVolume({
  book,
  onSelect,
  selected,
}: Readonly<{
  book: ReadingBook;
  onSelect: (bookId: string) => void;
  selected: boolean;
}>) {
  const appearance = volumeAppearance(book.title);
  const progress = bookProgress(book);
  const caption = bookStatusCaption(book);

  return (
    <button
      aria-current={selected ? "true" : undefined}
      aria-label={`${book.title} by ${book.author || "unknown author"}, page ${book.currentPage} of ${book.totalPages}`}
      className="library-volume"
      onClick={() => onSelect(book.id)}
      style={{ "--volume-color": appearance.color } as CSSProperties}
      type="button"
    >
      <strong>{book.title}</strong>
      <span>{book.author || "Unknown author"}</span>
      {caption !== null ? <em>{caption}</em> : null}
      <i aria-hidden="true">
        <b style={{ width: `${progress * 100}%` }} />
      </i>
      <small>
        {book.currentPage} / {book.totalPages}
      </small>
    </button>
  );
}

function BookSpine({
  book,
  onSelect,
  selected,
}: Readonly<{
  book: ReadingBook;
  onSelect: (bookId: string) => void;
  selected: boolean;
}>) {
  const appearance = volumeAppearance(book.title);
  const caption = bookStatusCaption(book);

  return (
    <button
      aria-current={selected ? "true" : undefined}
      aria-label={`${book.title} by ${book.author || "unknown author"}${caption === null ? "" : `, ${caption}`}`}
      className="library-spine"
      onClick={() => onSelect(book.id)}
      style={
        {
          "--spine-color": appearance.color,
          "--spine-height": `${appearance.height}rem`,
        } as CSSProperties
      }
      type="button"
    >
      <strong>{book.title}</strong>
      {caption !== null ? <em>{caption}</em> : null}
    </button>
  );
}

function LibraryBookDesk({
  book,
  checkInRevision,
  isSaving,
  onCheckIn,
  onMoveToShelf,
  onRemoveBook,
  onRemoveSession,
  sessions,
}: Readonly<{
  book: ReadingBook;
  checkInRevision: number;
  isSaving: boolean;
  onCheckIn: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onMoveToShelf: (shelf: ReadingShelfId) => void;
  onRemoveBook: () => void;
  onRemoveSession: (session: ReadingSession) => void;
  sessions: readonly ReadingSession[];
}>) {
  const currentShelf = readingShelfForStatus(book.status);
  const progress = bookProgress(book);

  return (
    <div className="library-desk">
      <div className="library-desk__progress">
        <span>Progress</span>
        <i aria-hidden="true">
          <b style={{ width: `${progress * 100}%` }} />
        </i>
        <strong>{Math.round(progress * 100)}%</strong>
      </div>

      <div
        className="library-desk__shelves"
        role="group"
        aria-label="Move book"
      >
        {shelfOrder.map((shelf) => (
          <button
            aria-pressed={currentShelf === shelf}
            disabled={isSaving || currentShelf === shelf}
            key={shelf}
            onClick={() => onMoveToShelf(shelf)}
            type="button"
          >
            {readingShelfLabels[shelf]}
          </button>
        ))}
      </div>

      <form
        className="library-action library-desk__check-in"
        key={`${book.id}:${checkInRevision}:${book.currentPage}`}
        onSubmit={onCheckIn}
      >
        <label>
          Page
          <input
            defaultValue={book.currentPage}
            max={book.totalPages}
            min="0"
            name="page"
            required
            type="number"
          />
        </label>
        <label>
          Minutes
          <input min="0" name="durationMinutes" placeholder="0" type="number" />
        </label>
        <label className="library-action__wide">
          Note
          <textarea
            maxLength={1600}
            name="reflection"
            placeholder="What stayed with you?"
            rows={3}
          />
        </label>
        <button disabled={isSaving} type="submit">
          {isSaving ? "Saving" : "Record"}
        </button>
      </form>

      <section className="library-timeline">
        <header>
          <span>Recorded updates</span>
          <strong>{sessions.length}</strong>
        </header>
        {sessions.length === 0 ? (
          <p>Page, time, and notes from this book will collect here.</p>
        ) : (
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <time dateTime={session.occurredOn}>
                  {formatDate(session.occurredOn)}
                </time>
                <span>
                  {session.durationMinutes > 0
                    ? `${session.durationMinutes} min`
                    : "Note"}
                  {session.endPage !== session.startPage
                    ? ` · p. ${session.startPage}–${session.endPage}`
                    : ` · p. ${session.endPage}`}
                </span>
                {session.reflection.length > 0 ? (
                  <p>{session.reflection}</p>
                ) : null}
                <button
                  disabled={isSaving}
                  onClick={() => onRemoveSession(session)}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        className="library-desk__remove"
        disabled={isSaving}
        onClick={onRemoveBook}
        type="button"
      >
        Remove from library
      </button>
    </div>
  );
}
