"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { StrengthWorkoutDayId } from "./strength-physique-plan";
import {
  deriveStrengthProgress,
  getLocalWeekStart,
} from "./strength-physique-progress";
import type {
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
} from "./strength-physique-record";
import {
  deleteBodyWeightEntry,
  listStrengthPhysiqueData,
  saveBodyWeightEntry,
  saveStrengthPersonalRecord,
  setWorkoutCompletion,
  type StrengthPhysiqueData,
} from "./strength-physique-repository";

const emptyData: StrengthPhysiqueData = {
  bodyWeightEntries: [],
  completions: [],
  personalRecords: [],
};

export function useStrengthPhysique() {
  const [data, setData] = useState<StrengthPhysiqueData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [weekStart] = useState(() =>
    typeof window === "undefined" ? "" : getLocalWeekStart(new Date()),
  );

  useEffect(() => {
    let isCurrent = true;

    void listStrengthPhysiqueData()
      .then((storedData) => {
        if (isCurrent) {
          setData(storedData);
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
      const record = await saveStrengthPersonalRecord(input);
      setData((current) => ({
        ...current,
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
    bodyWeightEntries: data.bodyWeightEntries,
    isLoading,
    personalRecords: data.personalRecords,
    progress,
    removeBodyWeight,
    storageError,
    toggleWorkout,
    updatePersonalRecord,
    weekStart,
  };
}
