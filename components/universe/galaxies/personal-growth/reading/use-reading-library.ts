"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { subscribeToMissionDataChanges } from "@/lib/mission-record-sync";

import type {
  NewReadingBook,
  NewReadingSession,
  ReadingBook,
  ReadingBookUpdate,
  ReadingSession,
  ReadingSessionUpdate,
} from "./reading-record";
import {
  deleteReadingBook,
  deleteReadingSession,
  listReadingLibraryData,
  saveReadingBook,
  saveReadingSession,
  updateReadingBook,
  updateReadingSession,
} from "./reading-repository";
import { deriveReadingSummary } from "./reading-summary";

export function useReadingLibrary() {
  const [books, setBooks] = useState<readonly ReadingBook[]>([]);
  const [sessions, setSessions] = useState<readonly ReadingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const load = () =>
      listReadingLibraryData().then((data) => {
        if (isCurrent) {
          setBooks(data.books);
          setSessions(data.sessions);
          setStorageError(null);
        }
      });

    void load()
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

    const unsubscribe = subscribeToMissionDataChanges(() => {
      void load();
    });

    return () => {
      isCurrent = false;
      unsubscribe();
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

  const editSession = useCallback(async (input: ReadingSessionUpdate) => {
    const updated = await updateReadingSession(input);
    setSessions((current) =>
      current.map((session) => (session.id === updated.id ? updated : session)),
    );
    setStorageError(null);
  }, []);

  const removeSession = useCallback(async (sessionId: string) => {
    await deleteReadingSession(sessionId);
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );
    setStorageError(null);
  }, []);

  const removeBook = useCallback(async (bookId: string) => {
    await deleteReadingBook(bookId);
    setBooks((current) => current.filter((book) => book.id !== bookId));
    setSessions((current) =>
      current.filter((session) => session.bookId !== bookId),
    );
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
    editSession,
    isLoading,
    sessions,
    removeBook,
    removeSession,
    storageError,
    summary,
  };
}
