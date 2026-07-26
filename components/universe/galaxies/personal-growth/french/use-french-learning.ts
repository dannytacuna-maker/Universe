"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { subscribeToMissionDataChanges } from "@/lib/mission-record-sync";

import type {
  FrenchLearningProfile,
  FrenchLearningProfileUpdate,
  FrenchPracticeSession,
  FrenchPracticeSessionUpdate,
  FrenchProgressSnapshot,
  NewFrenchPracticeSession,
} from "./french-learning-record";
import {
  deleteFrenchPracticeSession,
  listFrenchLearningData,
  saveFrenchLearningProfile,
  saveFrenchPracticeSession,
  updateFrenchPracticeSession,
} from "./french-learning-repository";
import { deriveFrenchLearningSummary } from "./french-learning-summary";

export function useFrenchLearning() {
  const [profile, setProfile] = useState<FrenchLearningProfile | null>(null);
  const [sessions, setSessions] = useState<readonly FrenchPracticeSession[]>(
    [],
  );
  const [snapshots, setSnapshots] = useState<readonly FrenchProgressSnapshot[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const load = () =>
      listFrenchLearningData().then((data) => {
        if (isCurrent) {
          setProfile(data.profile);
          setSessions(data.sessions);
          setSnapshots(data.snapshots);
          setStorageError(null);
        }
      });

    void load()
      .catch((error: unknown) => {
        if (isCurrent) {
          setStorageError(
            error instanceof Error
              ? error.message
              : "The French learning station could not be opened.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    const unsubscribe = subscribeToMissionDataChanges(() => void load());

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  const updateProfile = useCallback(
    async (input: FrenchLearningProfileUpdate) => {
      const result = await saveFrenchLearningProfile(input);
      setProfile(result.profile);
      setSnapshots((current) => [
        result.snapshot,
        ...current.filter((snapshot) => snapshot.id !== result.snapshot.id),
      ]);
      setStorageError(null);
    },
    [],
  );

  const addSession = useCallback(async (input: NewFrenchPracticeSession) => {
    const session = await saveFrenchPracticeSession(input);
    setSessions((current) => [session, ...current]);
    setStorageError(null);
  }, []);

  const editSession = useCallback(
    async (input: FrenchPracticeSessionUpdate) => {
      const updated = await updateFrenchPracticeSession(input);
      setSessions((current) =>
        current.map((session) =>
          session.id === updated.id ? updated : session,
        ),
      );
      setStorageError(null);
    },
    [],
  );

  const removeSession = useCallback(async (sessionId: string) => {
    await deleteFrenchPracticeSession(sessionId);
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );
    setStorageError(null);
  }, []);

  const summary = useMemo(
    () => deriveFrenchLearningSummary(profile, sessions, snapshots),
    [profile, sessions, snapshots],
  );

  return {
    addSession,
    editSession,
    isLoading,
    profile,
    removeSession,
    sessions,
    snapshots,
    storageError,
    summary,
    updateProfile,
  };
}
