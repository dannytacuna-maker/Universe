"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeToMissionDataChanges } from "@/lib/mission-record-sync";

import type {
  CycleEvidence,
  GrowthCycle,
  GrowthCycleStatus,
  MissionCapture,
  MissionExperiment,
  MissionExperimentConclusion,
  MissionIdentity,
  MissionIdentityUpdate,
  MissionOperatingData,
  NewGrowthCycle,
  NewMissionCapture,
  NewMissionExperiment,
  WeeklyReview,
  WeeklyReviewInput,
} from "./mission-operating-record";
import { getLocalDateKey, getWeekStartKey } from "./mission-operating-record";
import {
  concludeMissionExperiment,
  listMissionOperatingData,
  saveGrowthCycle,
  saveMissionCapture,
  saveMissionExperiment,
  saveWeeklyReview,
  toggleTodayCycleEvidence,
  updateGrowthCycleStatus,
  updateMissionCaptureStatus,
  updateMissionIdentity,
} from "./mission-operating-repository";

export type CurrentVectorItem = Readonly<{
  cycle: GrowthCycle;
  evidenceThisWeek: number;
  isCompleteToday: boolean;
  isSystemLinked: boolean;
}>;

function describeStorageError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The local mission records could not be updated.";
}

type DomainEvidenceDates = Readonly<
  Partial<Record<GrowthCycle["areaId"], readonly string[]>>
>;

export function useMissionOperatingSystem(
  domainEvidenceDates: DomainEvidenceDates = {},
) {
  const [data, setData] = useState<MissionOperatingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const load = () => {
      void listMissionOperatingData()
        .then((loaded) => {
          if (isCurrent) {
            setData(loaded);
            setStorageError(null);
          }
        })
        .catch((error: unknown) => {
          if (isCurrent) {
            setStorageError(describeStorageError(error));
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoading(false);
          }
        });
    };

    load();
    const unsubscribe = subscribeToMissionDataChanges(load);

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  const updateIdentity = useCallback(async (input: MissionIdentityUpdate) => {
    try {
      const identity = await updateMissionIdentity(input);
      setData((current) =>
        current === null ? current : { ...current, identity },
      );
      setStorageError(null);
    } catch (error: unknown) {
      setStorageError(describeStorageError(error));
      throw error;
    }
  }, []);

  const addCycle = useCallback(async (input: NewGrowthCycle) => {
    try {
      const cycle = await saveGrowthCycle(input);
      setData((current) =>
        current === null
          ? current
          : { ...current, cycles: [...current.cycles, cycle] },
      );
      setStorageError(null);
    } catch (error: unknown) {
      setStorageError(describeStorageError(error));
      throw error;
    }
  }, []);

  const setCycleStatus = useCallback(
    async (cycleId: string, status: GrowthCycleStatus) => {
      try {
        const updated = await updateGrowthCycleStatus(cycleId, status);
        setData((current) =>
          current === null
            ? current
            : {
                ...current,
                cycles: current.cycles.map((cycle) =>
                  cycle.id === updated.id ? updated : cycle,
                ),
              },
        );
        setStorageError(null);
      } catch (error: unknown) {
        setStorageError(describeStorageError(error));
        throw error;
      }
    },
    [],
  );

  const toggleEvidence = useCallback(async (cycleId: string) => {
    try {
      const evidence = await toggleTodayCycleEvidence(cycleId);
      const evidenceId = `${cycleId}:${getLocalDateKey()}`;
      setData((current) => {
        if (current === null) {
          return current;
        }

        return {
          ...current,
          evidence:
            evidence === null
              ? current.evidence.filter((entry) => entry.id !== evidenceId)
              : [evidence, ...current.evidence],
        };
      });
      setStorageError(null);
    } catch (error: unknown) {
      setStorageError(describeStorageError(error));
      throw error;
    }
  }, []);

  const addCapture = useCallback(async (input: NewMissionCapture) => {
    try {
      const capture = await saveMissionCapture(input);
      setData((current) =>
        current === null
          ? current
          : { ...current, captures: [capture, ...current.captures] },
      );
      setStorageError(null);
    } catch (error: unknown) {
      setStorageError(describeStorageError(error));
      throw error;
    }
  }, []);

  const setCaptureStatus = useCallback(
    async (captureId: string, status: MissionCapture["status"]) => {
      try {
        const updated = await updateMissionCaptureStatus(captureId, status);
        setData((current) =>
          current === null
            ? current
            : {
                ...current,
                captures: current.captures.map((capture) =>
                  capture.id === updated.id ? updated : capture,
                ),
              },
        );
        setStorageError(null);
      } catch (error: unknown) {
        setStorageError(describeStorageError(error));
        throw error;
      }
    },
    [],
  );

  const submitWeeklyReview = useCallback(async (input: WeeklyReviewInput) => {
    try {
      const review = await saveWeeklyReview(input);
      setData((current) => {
        if (current === null) {
          return current;
        }

        const reviews = [
          review,
          ...current.reviews.filter(
            (candidate) => candidate.weekStart !== review.weekStart,
          ),
        ].toSorted((first, second) =>
          second.weekStart.localeCompare(first.weekStart),
        );
        return { ...current, reviews };
      });
      setStorageError(null);
    } catch (error: unknown) {
      setStorageError(describeStorageError(error));
      throw error;
    }
  }, []);

  const addExperiment = useCallback(async (input: NewMissionExperiment) => {
    try {
      const experiment = await saveMissionExperiment(input);
      setData((current) =>
        current === null
          ? current
          : {
              ...current,
              experiments: [experiment, ...current.experiments],
            },
      );
      setStorageError(null);
    } catch (error: unknown) {
      setStorageError(describeStorageError(error));
      throw error;
    }
  }, []);

  const concludeExperiment = useCallback(
    async (input: MissionExperimentConclusion) => {
      try {
        const updated = await concludeMissionExperiment(input);
        setData((current) =>
          current === null
            ? current
            : {
                ...current,
                experiments: current.experiments.map((experiment) =>
                  experiment.id === updated.id ? updated : experiment,
                ),
              },
        );
        setStorageError(null);
      } catch (error: unknown) {
        setStorageError(describeStorageError(error));
        throw error;
      }
    },
    [],
  );

  const currentVector = useMemo<readonly CurrentVectorItem[]>(() => {
    if (data === null) {
      return [];
    }

    const today = getLocalDateKey();
    const weekStart = getWeekStartKey();

    return data.cycles
      .filter((cycle) => cycle.status === "active")
      .toSorted((first, second) => first.priority - second.priority)
      .slice(0, 3)
      .map((cycle) => {
        const cycleEvidence = data.evidence.filter(
          (entry) =>
            entry.cycleId === cycle.id && entry.occurredOn >= weekStart,
        );
        const domainDates = domainEvidenceDates[cycle.areaId];
        const evidenceDates = new Set([
          ...cycleEvidence.map((entry) => entry.occurredOn),
          ...(domainDates ?? []).filter((date) => date >= weekStart),
        ]);
        return {
          cycle,
          evidenceThisWeek: evidenceDates.size,
          isCompleteToday: evidenceDates.has(today),
          isSystemLinked: domainDates !== undefined,
        };
      });
  }, [data, domainEvidenceDates]);

  return {
    addCapture,
    addCycle,
    addExperiment,
    captures: data?.captures ?? ([] as readonly MissionCapture[]),
    concludeExperiment,
    currentVector,
    cycles: data?.cycles ?? ([] as readonly GrowthCycle[]),
    evidence: data?.evidence ?? ([] as readonly CycleEvidence[]),
    experiments: data?.experiments ?? ([] as readonly MissionExperiment[]),
    identity: data?.identity ?? null,
    isLoading,
    reviews: data?.reviews ?? ([] as readonly WeeklyReview[]),
    setCaptureStatus,
    setCycleStatus,
    storageError,
    submitWeeklyReview,
    toggleEvidence,
    updateIdentity,
  } satisfies {
    addCapture: (input: NewMissionCapture) => Promise<void>;
    addCycle: (input: NewGrowthCycle) => Promise<void>;
    addExperiment: (input: NewMissionExperiment) => Promise<void>;
    captures: readonly MissionCapture[];
    concludeExperiment: (input: MissionExperimentConclusion) => Promise<void>;
    currentVector: readonly CurrentVectorItem[];
    cycles: readonly GrowthCycle[];
    evidence: readonly CycleEvidence[];
    experiments: readonly MissionExperiment[];
    identity: MissionIdentity | null;
    isLoading: boolean;
    reviews: readonly WeeklyReview[];
    setCaptureStatus: (
      captureId: string,
      status: MissionCapture["status"],
    ) => Promise<void>;
    setCycleStatus: (
      cycleId: string,
      status: GrowthCycleStatus,
    ) => Promise<void>;
    storageError: string | null;
    submitWeeklyReview: (input: WeeklyReviewInput) => Promise<void>;
    toggleEvidence: (cycleId: string) => Promise<void>;
    updateIdentity: (input: MissionIdentityUpdate) => Promise<void>;
  };
}
