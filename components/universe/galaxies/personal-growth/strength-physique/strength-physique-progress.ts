import type {
  BodyWeightEntry,
  StrengthPersonalRecord,
  StrengthWorkoutCompletion,
} from "./strength-physique-record";
import {
  strengthWorkoutDayIds,
  type StrengthWorkoutDayId,
} from "./strength-physique-plan";

export type StrengthProgress = Readonly<{
  completedDayIds: readonly StrengthWorkoutDayId[];
  latestWeightKg: number | null;
  personalRecordCount: number;
  weeklyCompleted: number;
  weeklyCompletionRatio: number;
}>;

export const emptyStrengthProgress: StrengthProgress = {
  completedDayIds: [],
  latestWeightKg: null,
  personalRecordCount: 0,
  weeklyCompleted: 0,
  weeklyCompletionRatio: 0,
};

export function getLocalDateValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function getLocalWeekStart(date: Date) {
  const monday = new Date(date);
  const weekday = monday.getDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return getLocalDateValue(monday);
}

export function deriveStrengthProgress(
  completions: readonly StrengthWorkoutCompletion[],
  personalRecords: readonly StrengthPersonalRecord[],
  bodyWeightEntries: readonly BodyWeightEntry[],
  weekStart: string,
): StrengthProgress {
  if (weekStart.length === 0) {
    return emptyStrengthProgress;
  }

  const completedDayIds = strengthWorkoutDayIds.filter((dayId) =>
    completions.some(
      (completion) =>
        completion.weekStart === weekStart && completion.dayId === dayId,
    ),
  );
  const latestWeight = bodyWeightEntries.toSorted((first, second) =>
    second.measuredOn.localeCompare(first.measuredOn),
  )[0];

  return {
    completedDayIds,
    latestWeightKg: latestWeight?.weightKg ?? null,
    personalRecordCount: personalRecords.length,
    weeklyCompleted: completedDayIds.length,
    weeklyCompletionRatio:
      completedDayIds.length / strengthWorkoutDayIds.length,
  };
}
