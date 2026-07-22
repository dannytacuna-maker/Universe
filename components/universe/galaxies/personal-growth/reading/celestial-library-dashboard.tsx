"use client";

import { useState, type FormEvent } from "react";

import {
  readingBookStatusLabels,
  type NewReadingBook,
  type NewReadingSession,
  type ReadingBook,
  type ReadingBookStatus,
  type ReadingBookUpdate,
  type ReadingSession,
} from "./reading-record";
import type { ReadingSummary } from "./reading-summary";

type CelestialLibraryDashboardProps = Readonly<{
  books: readonly ReadingBook[];
  isLoading: boolean;
  isVisible: boolean;
  onAddBook: (input: NewReadingBook) => Promise<void>;
  onAddSession: (input: NewReadingSession) => Promise<void>;
  onEditBook: (input: ReadingBookUpdate) => Promise<void>;
  sessions: readonly ReadingSession[];
  storageError: string | null;
  summary: ReadingSummary;
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
  sessions,
  storageError,
  summary,
}: CelestialLibraryDashboardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (!isVisible) {
    return null;
  }

  const handleBookSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: NewReadingBook = {
      author: String(data.get("author") ?? ""),
      status: String(data.get("status")) as ReadingBookStatus,
      title: String(data.get("title") ?? ""),
      totalPages: Number(data.get("totalPages")),
    };

    setIsSaving(true);
    setFeedback("");
    try {
      await onAddBook(input);
      form.reset();
      setFeedback("Book added to the Celestial Library.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error ? error.message : "The book could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSessionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: NewReadingSession = {
      bookId: String(data.get("bookId")),
      durationMinutes: Number(data.get("durationMinutes")),
      endPage: Number(data.get("endPage")),
      occurredOn: String(data.get("occurredOn")),
      reflection: String(data.get("reflection") ?? ""),
      startPage: Number(data.get("startPage")),
    };

    setIsSaving(true);
    setFeedback("");
    try {
      await onAddSession(input);
      form.reset();
      setFeedback("Reading session logged.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The reading session could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ratingValue = String(data.get("rating") ?? "");
    const input: ReadingBookUpdate = {
      currentPage: Number(data.get("currentPage")),
      finalReflection: String(data.get("finalReflection") ?? ""),
      id: String(data.get("id")),
      rating: ratingValue.length === 0 ? null : Number(ratingValue),
      status: String(data.get("status")) as ReadingBookStatus,
    };

    setIsSaving(true);
    setFeedback("");
    try {
      await onEditBook(input);
      setFeedback("Book progress updated.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The book could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const currentBook = summary.currentBook;
  const currentProgress =
    currentBook === null
      ? 0
      : Math.min(currentBook.currentPage / currentBook.totalPages, 1);

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
          open={books.length > 0 && sessions.length === 0}
        >
          <summary>Log reading</summary>
          {books.length === 0 ? (
            <p>Add a book before logging a reading session.</p>
          ) : (
            <form onSubmit={handleSessionSubmit}>
              <label>
                Book
                <select name="bookId">
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
                  defaultValue={todayAsInputValue()}
                  max={todayAsInputValue()}
                  name="occurredOn"
                  required
                  type="date"
                />
              </label>
              <label>
                Minutes
                <input min="1" name="durationMinutes" required type="number" />
              </label>
              <label>
                Starting page
                <input min="0" name="startPage" required type="number" />
              </label>
              <label>
                Ending page
                <input min="0" name="endPage" required type="number" />
              </label>
              <label className="library-action__wide">
                Reflection
                <textarea maxLength={1600} name="reflection" rows={2} />
              </label>
              <button disabled={isSaving} type="submit">
                Save reading session
              </button>
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
                    Page
                    <input
                      defaultValue={book.currentPage}
                      max={book.totalPages}
                      min="0"
                      name="currentPage"
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
                    Update
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
                  </li>
                );
              })}
            </ul>
          )}
        </details>
      </div>

      {storageError !== null ? (
        <p className="immersive-dashboard__error">{storageError}</p>
      ) : null}
      <p aria-live="polite" className="immersive-dashboard__feedback">
        {feedback}
      </p>
    </aside>
  );
}
