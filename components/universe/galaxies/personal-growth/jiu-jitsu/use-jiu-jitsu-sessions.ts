"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { subscribeToMissionDataChanges } from "@/lib/mission-record-sync";

import { deriveJiuJitsuProgress } from "./jiu-jitsu-progress";
import {
  deleteJiuJitsuSession,
  listJiuJitsuSessions,
  saveJiuJitsuSession,
  updateJiuJitsuSession,
} from "./jiu-jitsu-session-repository";
import type {
  JiuJitsuSession,
  JiuJitsuSessionUpdate,
  NewJiuJitsuSession,
} from "./jiu-jitsu-session";

export function useJiuJitsuSessions() {
  const [sessions, setSessions] = useState<readonly JiuJitsuSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const load = () =>
      listJiuJitsuSessions().then((storedSessions) => {
        if (isCurrent) {
          setSessions(storedSessions);
          setStorageError(null);
        }
      });

    void load()
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

    const unsubscribe = subscribeToMissionDataChanges(() => {
      void load();
    });

    return () => {
      isCurrent = false;
      unsubscribe();
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

  const editSession = useCallback(async (input: JiuJitsuSessionUpdate) => {
    const updated = await updateJiuJitsuSession(input);
    setSessions((current) =>
      current
        .map((session) => (session.id === updated.id ? updated : session))
        .toSorted((first, second) =>
          second.occurredOn.localeCompare(first.occurredOn),
        ),
    );
    setStorageError(null);
  }, []);

  const progress = useMemo(() => deriveJiuJitsuProgress(sessions), [sessions]);

  return {
    addSession,
    editSession,
    isLoading,
    progress,
    removeSession,
    sessions,
    storageError,
  };
}
