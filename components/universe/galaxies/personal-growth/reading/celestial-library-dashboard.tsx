"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { activateInterfaceSurface } from "@/lib/interface-surface";

import {
  readingBookStatusLabels,
  type NewReadingBook,
  type NewReadingSession,
  type ReadingBook,
  type ReadingBookStatus,
  type ReadingBookUpdate,
  type ReadingSession,
  type ReadingSessionUpdate,
} from "./reading-record";
import type { ReadingSummary } from "./reading-summary";

type CelestialLibraryDashboardProps = Readonly<{
  books: readonly ReadingBook[];
  isLoading: boolean;
  isVisible: boolean;
  onAddBook: (input: NewReadingBook) => Promise<void>;
  onAddSession: (input: NewReadingSession) => Promise<void>;
  onEditBook: (input: ReadingBookUpdate) => Promise<void>;
  onEditSession: (input: ReadingSessionUpdate) => Promise<void>;
  onRemoveBook: (bookId: string) => Promise<void>;
  onRemoveSession: (sessionId: string) => Promise<void>;
  sessions: readonly ReadingSession[];
  storageError: string | null;
  summary: ReadingSummary;
}>;

type SessionEditor = Readonly<{
  bookId: string;
  revision: number;
  session: ReadingSession | null;
}>;

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

export function CelestialLibraryDashboard({
  books,
  isLoading,
  isVisible,
  onAddBook,
  onAddSession,
  onEditBook,
  onEditSession,
  onRemoveBook,
  onRemoveSession,
  sessions,
  storageError,
  summary,
}: CelestialLibraryDashboardProps) {
  const sessionComposerId = useId();
  const [isSaving, setIsSaving] = useState(false);
  const [isSessionComposerOpen, setIsSessionComposerOpen] = useState(false);
  const [pendingRemovalKey, setPendingRemovalKey] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [sessionEditor, setSessionEditor] = useState<SessionEditor>({
    bookId: "",
    revision: 0,
    session: null,
  });
  const operationLockRef = useRef(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    activateInterfaceSurface("reading-library");
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const currentBook = summary.currentBook;
  const currentProgress =
    currentBook === null
      ? 0
      : Math.min(currentBook.currentPage / currentBook.totalPages, 1);
  const sessionTargetBookId =
    sessionEditor.bookId || currentBook?.id || books[0]?.id || "";
  const sessionTargetBook =
    books.find((book) => book.id === sessionTargetBookId) ?? null;

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

  const resetSessionEditor = (excludedBookId?: string) => {
    const fallbackBookId =
      currentBook?.id !== excludedBookId
        ? currentBook?.id
        : books.find((book) => book.id !== excludedBookId)?.id;

    setSessionEditor((current) => ({
      bookId: fallbackBookId ?? "",
      revision: current.revision + 1,
      session: null,
    }));
  };

  const openSessionEditor = (
    bookId: string,
    session: ReadingSession | null,
  ) => {
    setSessionEditor((current) => ({
      bookId,
      revision: current.revision + 1,
      session,
    }));
    setIsSessionComposerOpen(true);
    setFeedback(
      session === null
        ? "Ready for your next reading session."
        : "Editing reading session.",
    );
  };

  const handleBookSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: NewReadingBook = {
      author: String(data.get("author") ?? "").trim(),
      status: String(data.get("status")) as ReadingBookStatus,
      title: String(data.get("title") ?? "").trim(),
      totalPages: Number(data.get("totalPages")),
    };
    const didSave = await runOperation(
      () => onAddBook(input),
      "Book added to the Celestial Library.",
      "The book could not be saved.",
    );

    if (didSave) {
      form.reset();
    }
  };

  const handleSessionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const sessionBeingEdited = sessionEditor.session;
    const input: NewReadingSession = {
      bookId: String(data.get("bookId")),
      durationMinutes: Number(data.get("durationMinutes")),
      endPage: Number(data.get("endPage")),
      occurredOn: String(data.get("occurredOn")),
      reflection: String(data.get("reflection") ?? "").trim(),
      startPage: Number(data.get("startPage")),
    };
    const didSave =
      sessionBeingEdited === null
        ? await runOperation(
            () => onAddSession(input),
            "Reading session logged.",
            "The reading session could not be saved.",
          )
        : await runOperation(
            () =>
              onEditSession({
                ...input,
                id: sessionBeingEdited.id,
              }),
            "Reading session updated.",
            "The reading session could not be updated.",
          );

    if (didSave) {
      resetSessionEditor();
      setIsSessionComposerOpen(false);
    }
  };

  const handleBookUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ratingValue = String(data.get("rating") ?? "");
    const input: ReadingBookUpdate = {
      author: String(data.get("author") ?? "").trim(),
      currentPage: Number(data.get("currentPage")),
      finalReflection: String(data.get("finalReflection") ?? "").trim(),
      id: String(data.get("id")),
      rating: ratingValue.length === 0 ? null : Number(ratingValue),
      status: String(data.get("status")) as ReadingBookStatus,
      title: String(data.get("title") ?? "").trim(),
      totalPages: Number(data.get("totalPages")),
    };

    await runOperation(
      () => onEditBook(input),
      "Book details and progress updated.",
      "The book could not be updated.",
    );
  };

  const handleRemoveSession = async (session: ReadingSession) => {
    if (
      operationLockRef.current ||
      !window.confirm("Delete this reading session? This cannot be undone.")
    ) {
      return;
    }

    const removalKey = `session:${session.id}`;
    setPendingRemovalKey(removalKey);
    const didRemove = await runOperation(
      () => onRemoveSession(session.id),
      "Reading session deleted.",
      "The reading session could not be deleted.",
    );
    setPendingRemovalKey(null);

    if (didRemove && sessionEditor.session?.id === session.id) {
      resetSessionEditor();
      setIsSessionComposerOpen(false);
    }
  };

  const handleRemoveBook = async (book: ReadingBook) => {
    if (operationLockRef.current) {
      return;
    }

    const relatedSessionCount = sessions.filter(
      (session) => session.bookId === book.id,
    ).length;
    const sessionWarning =
      relatedSessionCount === 0
        ? ""
        : ` and ${relatedSessionCount} reading ${
            relatedSessionCount === 1 ? "session" : "sessions"
          }`;

    if (
      !window.confirm(
        `Delete "${book.title}"${sessionWarning}? This cannot be undone.`,
      )
    ) {
      return;
    }

    const removalKey = `book:${book.id}`;
    setPendingRemovalKey(removalKey);
    const didRemove = await runOperation(
      () => onRemoveBook(book.id),
      "Book deleted from the library.",
      "The book could not be deleted.",
    );
    setPendingRemovalKey(null);

    if (didRemove && sessionTargetBookId === book.id) {
      resetSessionEditor(book.id);
      setIsSessionComposerOpen(false);
    }
  };

  return (
    <aside
      aria-label="Celestial reading library"
      className="immersive-dashboard celestial-library-dashboard"
    >
      <header className="immersive-dashboard__header library-dashboard__header">
        <div>
          <span>Reading · Celestial Library</span>
          <strong>{currentBook?.title ?? "Choose your next book"}</strong>
          <p>
            {currentBook === null
              ? "Build a quiet record of books, sessions, and ideas."
              : `${currentBook.author || "Unknown author"} · page ${currentBook.currentPage} of ${currentBook.totalPages}`}
          </p>
          {currentBook !== null ? (
            <div className="library-action">
              <button
                aria-controls={sessionComposerId}
                aria-expanded={isSessionComposerOpen}
                disabled={isSaving}
                onClick={() => openSessionEditor(currentBook.id, null)}
                type="button"
              >
                Continue reading
              </button>
            </div>
          ) : null}
        </div>
        <div aria-label="Weekly reading summary" className="immersive-metrics">
          <span>
            <strong>{formatMinutes(summary.timeThisWeekMinutes)}</strong>Time
            this week
          </span>
          <span>
            <strong>{summary.pagesThisWeek}</strong>Pages this week
          </span>
          <span>
            <strong>{books.length}</strong>Books saved
          </span>
        </div>
      </header>

      <div className="library-dashboard__progress">
        <span>Current book progress</span>
        <i aria-hidden="true">
          <b style={{ width: `${currentProgress * 100}%` }} />
        </i>
        <strong>{Math.round(currentProgress * 100)}%</strong>
      </div>

      <div className="library-dashboard__grid">
        <section className="immersive-panel library-reflections">
          <header>
            <span>Recent reflections</span>
          </header>
          {summary.recentReflections.length === 0 ? (
            <p>Reflections from reading sessions will collect here.</p>
          ) : (
            <ul>
              {summary.recentReflections.map((session) => (
                <li key={session.id}>
                  <time dateTime={session.occurredOn}>
                    {formatDate(session.occurredOn)}
                  </time>
                  <p>{session.reflection}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="immersive-panel library-next-books">
          <header>
            <span>Want to read next</span>
          </header>
          {summary.wantToReadNext.length === 0 ? (
            <p>Save future books with “Want to read” status.</p>
          ) : (
            <ul>
              {summary.wantToReadNext.map((book) => (
                <li key={book.id}>
                  <strong>{book.title}</strong>
                  <span>{book.author || "Unknown author"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <details
          className="immersive-panel library-action"
          open={books.length === 0}
        >
          <summary>Add a book</summary>
          <form onSubmit={handleBookSubmit}>
            <label>
              Title
              <input name="title" required type="text" />
            </label>
            <label>
              Author
              <input name="author" type="text" />
            </label>
            <label>
              Total pages
              <input min="1" name="totalPages" required type="number" />
            </label>
            <label>
              Status
              <select defaultValue="want-to-read" name="status">
                {Object.entries(readingBookStatusLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
            <button disabled={isSaving} type="submit">
              Add to library
            </button>
          </form>
        </details>

        <details
          className="immersive-panel library-action"
          id={sessionComposerId}
          onToggle={(event) =>
            setIsSessionComposerOpen(event.currentTarget.open)
          }
          open={isSessionComposerOpen}
        >
          <summary>
            {sessionEditor.session === null
              ? "Log reading"
              : "Edit reading session"}
          </summary>
          {books.length === 0 ? (
            <p>Add a book before logging a reading session.</p>
          ) : (
            <form
              key={`${sessionEditor.session?.id ?? "new"}:${sessionTargetBookId}:${sessionEditor.revision}`}
              onSubmit={handleSessionSubmit}
            >
              <label>
                Book
                <select
                  defaultValue={sessionTargetBookId}
                  name="bookId"
                  required
                >
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  defaultValue={
                    sessionEditor.session?.occurredOn ?? todayAsInputValue()
                  }
                  max={todayAsInputValue()}
                  name="occurredOn"
                  required
                  type="date"
                />
              </label>
              <label>
                Minutes
                <input
                  defaultValue={
                    sessionEditor.session?.durationMinutes ?? undefined
                  }
                  min="1"
                  name="durationMinutes"
                  required
                  type="number"
                />
              </label>
              <label>
                Starting page
                <input
                  defaultValue={
                    sessionEditor.session?.startPage ??
                    sessionTargetBook?.currentPage ??
                    0
                  }
                  min="0"
                  name="startPage"
                  required
                  type="number"
                />
              </label>
              <label>
                Ending page
                <input
                  defaultValue={sessionEditor.session?.endPage ?? undefined}
                  min="0"
                  name="endPage"
                  required
                  type="number"
                />
              </label>
              <label className="library-action__wide">
                Reflection
                <textarea
                  defaultValue={sessionEditor.session?.reflection ?? ""}
                  maxLength={1600}
                  name="reflection"
                  rows={2}
                />
              </label>
              <button disabled={isSaving} type="submit">
                {isSaving
                  ? "Saving"
                  : sessionEditor.session === null
                    ? "Save reading session"
                    : "Save changes"}
              </button>
              {sessionEditor.session !== null ? (
                <button
                  disabled={isSaving}
                  onClick={() => resetSessionEditor()}
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
            </form>
          )}
        </details>

        <details className="immersive-panel library-collection">
          <summary>Library · {books.length}</summary>
          {isLoading ? (
            <p>Opening the library.</p>
          ) : books.length === 0 ? (
            <p>No books saved yet.</p>
          ) : (
            <div className="library-book-list">
              {books.map((book) => (
                <form key={book.id} onSubmit={handleBookUpdate}>
                  <input name="id" type="hidden" value={book.id} />
                  <div>
                    <strong>{book.title}</strong>
                    <span>{book.author || "Unknown author"}</span>
                  </div>
                  <label>
                    Title
                    <input
                      defaultValue={book.title}
                      name="title"
                      required
                      type="text"
                    />
                  </label>
                  <label>
                    Author
                    <input
                      defaultValue={book.author}
                      name="author"
                      type="text"
                    />
                  </label>
                  <label>
                    Total pages
                    <input
                      defaultValue={book.totalPages}
                      min="1"
                      name="totalPages"
                      required
                      type="number"
                    />
                  </label>
                  <label>
                    Current page
                    <input
                      defaultValue={book.currentPage}
                      max={book.totalPages}
                      min="0"
                      name="currentPage"
                      required
                      type="number"
                    />
                  </label>
                  <label>
                    Status
                    <select defaultValue={book.status} name="status">
                      {Object.entries(readingBookStatusLabels).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Rating
                    <input
                      defaultValue={book.rating ?? ""}
                      max="5"
                      min="1"
                      name="rating"
                      placeholder="1–5"
                      type="number"
                    />
                  </label>
                  <label className="library-action__wide">
                    Final reflection
                    <textarea
                      defaultValue={book.finalReflection}
                      maxLength={2400}
                      name="finalReflection"
                      rows={2}
                    />
                  </label>
                  <button disabled={isSaving} type="submit">
                    Update book
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={() => void handleRemoveBook(book)}
                    type="button"
                  >
                    {pendingRemovalKey === `book:${book.id}`
                      ? "Deleting"
                      : "Delete book"}
                  </button>
                </form>
              ))}
            </div>
          )}
        </details>

        <details className="immersive-panel library-history">
          <summary>Past reading sessions · {sessions.length}</summary>
          {sessions.length === 0 ? (
            <p>No reading sessions logged yet.</p>
          ) : (
            <ul>
              {sessions.map((session) => {
                const book = books.find(
                  (candidate) => candidate.id === session.bookId,
                );
                return (
                  <li key={session.id}>
                    <time dateTime={session.occurredOn}>
                      {formatDate(session.occurredOn)}
                    </time>
                    <strong>{book?.title ?? "Unknown book"}</strong>
                    <span>
                      {session.durationMinutes} min · pages {session.startPage}–
                      {session.endPage}
                    </span>
                    {session.reflection.length > 0 ? (
                      <p>{session.reflection}</p>
                    ) : null}
                    <span className="library-action library-action__wide">
                      <button
                        disabled={isSaving}
                        onClick={() =>
                          openSessionEditor(session.bookId, session)
                        }
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isSaving}
                        onClick={() => void handleRemoveSession(session)}
                        type="button"
                      >
                        {pendingRemovalKey === `session:${session.id}`
                          ? "Deleting"
                          : "Delete"}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </details>
      </div>

      <p className="immersive-dashboard__feedback">
        Saved locally first. Cloud sync status is shown in Mission.
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
