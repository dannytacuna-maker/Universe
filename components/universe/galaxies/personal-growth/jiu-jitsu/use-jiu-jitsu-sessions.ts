"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { deriveJiuJitsuProgress } from "./jiu-jitsu-progress";
import {
  deleteJiuJitsuSession,
  listJiuJitsuSessions,
  saveJiuJitsuSession,
} from "./jiu-jitsu-session-repository";
import type { JiuJitsuSession, NewJiuJitsuSession } from "./jiu-jitsu-session";

export function useJiuJitsuSessions() {
  const [sessions, setSessions] = useState<readonly JiuJitsuSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void listJiuJitsuSessions()
      .then((storedSessions) => {
        if (isCurrent) {
          setSessions(storedSessions);
          setStorageError(null);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setStorageError(
            error instanceof Error
              ? error.message
              : "Private browser storage could not be opened.",
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

  const addSession = useCallback(async (input: NewJiuJitsuSession) => {
    const session = await saveJiuJitsuSession(input);
    setSessions((current) =>
      [session, ...current].toSorted((first, second) =>
        second.occurredOn.localeCompare(first.occurredOn),
      ),
    );
    setStorageError(null);
  }, []);

  const removeSession = useCallback(async (sessionId: string) => {
    await deleteJiuJitsuSession(sessionId);
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );
    setStorageError(null);
  }, []);

  const progress = useMemo(() => deriveJiuJitsuProgress(sessions), [sessions]);

  return {
    addSession,
    isLoading,
    progress,
    removeSession,
    sessions,
    storageError,
  };
}
