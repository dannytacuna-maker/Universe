"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { subscribeToMissionDataChanges } from "@/lib/mission-record-sync";

import type {
  NewUniversityAssignment,
  NewUniversityGrade,
  NewUniversityNote,
  UniversityAssignmentUpdate,
  UniversityData,
} from "./university-record";
import {
  deleteUniversityAssignment,
  deleteUniversityGrade,
  deleteUniversityNote,
  listUniversityData,
  saveUniversityAssignment,
  saveUniversityGrade,
  saveUniversityNote,
  updateUniversityAssignment,
} from "./university-repository";

const emptyData: UniversityData = { assignments: [], grades: [], notes: [] };

export function useUniversityRecords() {
  const [data, setData] = useState<UniversityData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [summaryReferenceTime] = useState(() => Date.now());

  useEffect(() => {
    let isCurrent = true;
    const load = () =>
      listUniversityData().then((stored) => {
        if (isCurrent) {
          setData(stored);
          setStorageError(null);
        }
      });

    void load()
      .catch((error: unknown) => {
        if (isCurrent) {
          setStorageError(
            error instanceof Error
              ? error.message
              : "University records could not be opened.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });
    const unsubscribe = subscribeToMissionDataChanges(() => void load());

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  const addAssignment = useCallback(async (input: NewUniversityAssignment) => {
    const assignment = await saveUniversityAssignment(input);
    setData((current) => ({
      ...current,
      assignments: [...current.assignments, assignment].toSorted(
        (first, second) => first.dueAt.localeCompare(second.dueAt),
      ),
    }));
  }, []);

  const editAssignment = useCallback(
    async (input: UniversityAssignmentUpdate) => {
      const updated = await updateUniversityAssignment(input);
      setData((current) => ({
        ...current,
        assignments: current.assignments.map((assignment) =>
          assignment.id === updated.id ? updated : assignment,
        ),
      }));
    },
    [],
  );

  const removeAssignment = useCallback(async (id: string) => {
    await deleteUniversityAssignment(id);
    setData((current) => ({
      ...current,
      assignments: current.assignments.filter((item) => item.id !== id),
    }));
  }, []);

  const addGrade = useCallback(async (input: NewUniversityGrade) => {
    const grade = await saveUniversityGrade(input);
    setData((current) => ({
      ...current,
      grades: [grade, ...current.grades],
    }));
  }, []);

  const removeGrade = useCallback(async (id: string) => {
    await deleteUniversityGrade(id);
    setData((current) => ({
      ...current,
      grades: current.grades.filter((item) => item.id !== id),
    }));
  }, []);

  const addNote = useCallback(async (input: NewUniversityNote) => {
    const note = await saveUniversityNote(input);
    setData((current) => ({ ...current, notes: [note, ...current.notes] }));
  }, []);

  const removeNote = useCallback(async (id: string) => {
    await deleteUniversityNote(id);
    setData((current) => ({
      ...current,
      notes: current.notes.filter((item) => item.id !== id),
    }));
  }, []);

  const summary = useMemo(() => {
    const upcoming = data.assignments.filter(
      (assignment) =>
        assignment.status !== "complete" &&
        assignment.status !== "submitted" &&
        Date.parse(assignment.dueAt) >= summaryReferenceTime,
    );
    const overdue = data.assignments.filter(
      (assignment) =>
        assignment.status !== "complete" &&
        assignment.status !== "submitted" &&
        Date.parse(assignment.dueAt) < summaryReferenceTime,
    );

    return {
      nextAssignment: upcoming[0] ?? null,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
    };
  }, [data.assignments, summaryReferenceTime]);

  return {
    ...data,
    addAssignment,
    addGrade,
    addNote,
    editAssignment,
    isLoading,
    removeAssignment,
    removeGrade,
    removeNote,
    storageError,
    summary,
  };
}

export type UniversityRecordsController = ReturnType<
  typeof useUniversityRecords
>;
