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
