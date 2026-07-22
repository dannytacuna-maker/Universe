export const strengthWorkoutDayIds = [
  "push-a",
  "pull-a",
  "legs-a",
  "push-b",
  "pull-b",
  "legs-b",
] as const;

export type StrengthWorkoutDayId = (typeof strengthWorkoutDayIds)[number];

export type StrengthWorkoutDay = Readonly<{
  dayNumber: number;
  focus: string;
  groups: readonly Readonly<{
    exerciseCount: string;
    muscleGroup: string;
  }>[];
  id: StrengthWorkoutDayId;
  name: string;
}>;

const pushGroups = [
  { exerciseCount: "3 exercises", muscleGroup: "Chest" },
  { exerciseCount: "1–2 exercises", muscleGroup: "Shoulders" },
  { exerciseCount: "2–3 exercises", muscleGroup: "Triceps" },
] as const;

const pullGroups = [
  { exerciseCount: "3 exercises", muscleGroup: "Back" },
  { exerciseCount: "1–2 exercises", muscleGroup: "Rear delts" },
  { exerciseCount: "2–3 exercises", muscleGroup: "Biceps" },
] as const;

const legGroups = [
  { exerciseCount: "3 exercises", muscleGroup: "Legs" },
  { exerciseCount: "1 exercise", muscleGroup: "Calves" },
] as const;

export const strengthWorkoutSplit = [
  {
    dayNumber: 1,
    focus: "Chest · shoulders · triceps",
    groups: pushGroups,
    id: "push-a",
    name: "Push A",
  },
  {
    dayNumber: 2,
    focus: "Back · rear delts · biceps",
    groups: pullGroups,
    id: "pull-a",
    name: "Pull A",
  },
  {
    dayNumber: 3,
    focus: "Legs · calves",
    groups: legGroups,
    id: "legs-a",
    name: "Legs A",
  },
  {
    dayNumber: 4,
    focus: "Chest · shoulders · triceps",
    groups: pushGroups,
    id: "push-b",
    name: "Push B",
  },
  {
    dayNumber: 5,
    focus: "Back · rear delts · biceps",
    groups: pullGroups,
    id: "pull-b",
    name: "Pull B",
  },
  {
    dayNumber: 6,
    focus: "Legs · calves",
    groups: legGroups,
    id: "legs-b",
    name: "Legs B",
  },
] as const satisfies readonly StrengthWorkoutDay[];

export const strengthLiftIds = ["bench-press", "squat", "deadlift"] as const;

export type StrengthLiftId = (typeof strengthLiftIds)[number];

export const strengthLiftLabels: Readonly<Record<StrengthLiftId, string>> = {
  "bench-press": "Bench press",
  deadlift: "Deadlift",
  squat: "Squat",
};
