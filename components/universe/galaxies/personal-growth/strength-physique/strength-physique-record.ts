import type {
  StrengthLiftId,
  StrengthWorkoutDayId,
} from "./strength-physique-plan";

export type StrengthWorkoutCompletion = Readonly<{
  completedAt: string;
  dayId: StrengthWorkoutDayId;
  id: string;
  weekStart: string;
}>;

export type StrengthPersonalRecord = Readonly<{
  achievedOn: string;
  liftId: StrengthLiftId;
  updatedAt: string;
  weightKg: number;
}>;

export type StrengthLiftObservation = Readonly<{
  achievedOn: string;
  createdAt: string;
  id: string;
  liftId: StrengthLiftId;
  weightKg: number;
}>;

export type BodyWeightEntry = Readonly<{
  createdAt: string;
  id: string;
  measuredOn: string;
  weightKg: number;
}>;

export type NewStrengthPersonalRecord = Readonly<
  Pick<StrengthPersonalRecord, "achievedOn" | "liftId" | "weightKg">
>;

export type NewBodyWeightEntry = Readonly<
  Pick<BodyWeightEntry, "measuredOn" | "weightKg">
>;

export type StrengthTrainingFocus = "custom" | "legs" | "pull" | "push";

export type StrengthExerciseEntry = Readonly<{
  id: string;
  name: string;
  reps: number;
  sets: number;
  weightKg: number | null;
}>;

export type StrengthTrainingSession = Readonly<{
  createdAt: string;
  exercises: readonly StrengthExerciseEntry[];
  focus: StrengthTrainingFocus;
  id: string;
  mobilityWork: boolean;
  notes: string;
  occurredOn: string;
  perceivedExertion: number | null;
  physiqueNotes: string;
  recoveryWork: boolean;
  reflection: string;
  updatedAt: string;
}>;

export type NewStrengthTrainingSession = Omit<
  StrengthTrainingSession,
  "createdAt" | "id" | "updatedAt"
>;

export type StrengthTrainingSessionUpdate = NewStrengthTrainingSession &
  Readonly<{ id: string }>;
