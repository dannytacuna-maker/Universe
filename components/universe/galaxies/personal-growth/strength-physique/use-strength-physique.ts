"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { subscribeToMissionDataChanges } from "@/lib/mission-record-sync";

import type { StrengthWorkoutDayId } from "./strength-physique-plan";
import {
  deriveStrengthProgress,
  getLocalWeekStart,
} from "./strength-physique-progress";
import type {
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
  NewStrengthTrainingSession,
  StrengthTrainingSessionUpdate,
} from "./strength-physique-record";
import {
  deleteStrengthTrainingSession,
  deleteBodyWeightEntry,
  listStrengthPhysiqueData,
  saveBodyWeightEntry,
  saveStrengthPersonalRecord,
  saveStrengthTrainingSession,
  setWorkoutCompletion,
  updateStrengthTrainingSession,
  type StrengthPhysiqueData,
} from "./strength-physique-repository";

const emptyData: StrengthPhysiqueData = {
  bodyWeightEntries: [],
  completions: [],
  liftHistory: [],
  personalRecords: [],
  sessions: [],
};

export function useStrengthPhysique() {
  const [data, setData] = useState<StrengthPhysiqueData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() =>
    typeof window === "undefined" ? "" : getLocalWeekStart(new Date()),
  );

  useEffect(() => {
    let isCurrent = true;

    const load = () =>
      listStrengthPhysiqueData().then((storedData) => {
        if (isCurrent) {
          setData(storedData);
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

  useEffect(() => {
    const refreshWeek = () => setWeekStart(getLocalWeekStart(new Date()));
    document.addEventListener("visibilitychange", refreshWeek);
    return () => document.removeEventListener("visibilitychange", refreshWeek);
  }, []);

  const toggleWorkout = useCallback(
    async (dayId: StrengthWorkoutDayId, completed: boolean) => {
      const currentWeekStart = weekStart || getLocalWeekStart(new Date());
      const completion = await setWorkoutCompletion(
        dayId,
        currentWeekStart,
        completed,
      );

      setData((current) => ({
        ...current,
        completions:
          completion === null
            ? current.completions.filter(
                (item) =>
                  !(
                    item.dayId === dayId && item.weekStart === currentWeekStart
                  ),
              )
            : [
                ...current.completions.filter(
                  (item) => item.id !== completion.id,
                ),
                completion,
              ],
      }));
      setStorageError(null);
    },
    [weekStart],
  );

  const updatePersonalRecord = useCallback(
    async (input: NewStrengthPersonalRecord) => {
      const { observation, record } = await saveStrengthPersonalRecord(input);
      setData((current) => ({
        ...current,
        liftHistory: [observation, ...current.liftHistory].toSorted(
          (first, second) => second.achievedOn.localeCompare(first.achievedOn),
        ),
        personalRecords: [
          ...current.personalRecords.filter(
            (item) => item.liftId !== record.liftId,
          ),
          record,
        ],
      }));
      setStorageError(null);
    },
    [],
  );

  const addBodyWeight = useCallback(async (input: NewBodyWeightEntry) => {
    const entry = await saveBodyWeightEntry(input);
    setData((current) => ({
      ...current,
      bodyWeightEntries: [entry, ...current.bodyWeightEntries].toSorted(
        (first, second) => second.measuredOn.localeCompare(first.measuredOn),
      ),
    }));
    setStorageError(null);
  }, []);

  const removeBodyWeight = useCallback(async (entryId: string) => {
    await deleteBodyWeightEntry(entryId);
    setData((current) => ({
      ...current,
      bodyWeightEntries: current.bodyWeightEntries.filter(
        (entry) => entry.id !== entryId,
      ),
    }));
    setStorageError(null);
  }, []);

  const addTrainingSession = useCallback(
    async (input: NewStrengthTrainingSession) => {
      const session = await saveStrengthTrainingSession(input);
      setData((current) => ({
        ...current,
        sessions: [session, ...current.sessions].toSorted((first, second) =>
          second.occurredOn.localeCompare(first.occurredOn),
        ),
      }));
      setStorageError(null);
    },
    [],
  );

  const editTrainingSession = useCallback(
    async (input: StrengthTrainingSessionUpdate) => {
      const updated = await updateStrengthTrainingSession(input);
      setData((current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id === updated.id ? updated : session,
        ),
      }));
      setStorageError(null);
    },
    [],
  );

  const removeTrainingSession = useCallback(async (sessionId: string) => {
    await deleteStrengthTrainingSession(sessionId);
    setData((current) => ({
      ...current,
      sessions: current.sessions.filter((session) => session.id !== sessionId),
    }));
    setStorageError(null);
  }, []);

  const progress = useMemo(
    () =>
      deriveStrengthProgress(
        data.completions,
        data.personalRecords,
        data.bodyWeightEntries,
        weekStart,
      ),
    [data, weekStart],
  );

  return {
    addBodyWeight,
    addTrainingSession,
    bodyWeightEntries: data.bodyWeightEntries,
    isLoading,
    personalRecords: data.personalRecords,
    liftHistory: data.liftHistory,
    progress,
    removeBodyWeight,
    removeTrainingSession,
    editTrainingSession,
    sessions: data.sessions,
    storageError,
    toggleWorkout,
    updatePersonalRecord,
    weekStart,
  };
}
