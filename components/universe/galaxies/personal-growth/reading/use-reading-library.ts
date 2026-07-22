"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  NewReadingBook,
  NewReadingSession,
  ReadingBook,
  ReadingBookUpdate,
  ReadingSession,
} from "./reading-record";
import {
  listReadingLibraryData,
  saveReadingBook,
  saveReadingSession,
  updateReadingBook,
} from "./reading-repository";
import { deriveReadingSummary } from "./reading-summary";

export function useReadingLibrary() {
  const [books, setBooks] = useState<readonly ReadingBook[]>([]);
  const [sessions, setSessions] = useState<readonly ReadingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void listReadingLibraryData()
      .then((data) => {
        if (isCurrent) {
          setBooks(data.books);
          setSessions(data.sessions);
          setStorageError(null);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setStorageError(
            error instanceof Error
              ? error.message
              : "The reading library could not be opened.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const addBook = useCallback(async (input: NewReadingBook) => {
    const book = await saveReadingBook(input);
    setBooks((current) => [book, ...current]);
    setStorageError(null);
  }, []);

  const editBook = useCallback(async (input: ReadingBookUpdate) => {
    const updated = await updateReadingBook(input);
    setBooks((current) =>
      current.map((book) => (book.id === updated.id ? updated : book)),
    );
    setStorageError(null);
  }, []);

  const addSession = useCallback(async (input: NewReadingSession) => {
    const result = await saveReadingSession(input);
    setBooks((current) =>
      current.map((book) => (book.id === result.book.id ? result.book : book)),
    );
    setSessions((current) => [result.session, ...current]);
    setStorageError(null);
  }, []);

  const summary = useMemo(
    () => deriveReadingSummary(books, sessions),
    [books, sessions],
  );

  return {
    addBook,
    addSession,
    books,
    editBook,
    isLoading,
    sessions,
    storageError,
    summary,
  };
}
