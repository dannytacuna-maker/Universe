"use client";

import { useId, useState } from "react";

import {
  strengthWorkoutSplit,
  type StrengthWorkoutDayId,
} from "./strength-physique-plan";
import type { StrengthProgress } from "./strength-physique-progress";
import type {
  BodyWeightEntry,
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
  StrengthPersonalRecord,
} from "./strength-physique-record";
import { StrengthRecords } from "./strength-records";
import { WorkoutSplit } from "./workout-split";

type WhisTrainingAssistantProps = Readonly<{
  bodyWeightEntries: readonly BodyWeightEntry[];
  isLoading: boolean;
  isVisible: boolean;
  onAddBodyWeight: (input: NewBodyWeightEntry) => Promise<void>;
  onRemoveBodyWeight: (entryId: string) => Promise<void>;
  onToggleWorkout: (
    dayId: StrengthWorkoutDayId,
    completed: boolean,
  ) => Promise<void>;
  onUpdatePersonalRecord: (input: NewStrengthPersonalRecord) => Promise<void>;
  personalRecords: readonly StrengthPersonalRecord[];
  progress: StrengthProgress;
  storageError: string | null;
}>;

export function WhisTrainingAssistant({
  bodyWeightEntries,
  isLoading,
  isVisible,
  onAddBodyWeight,
  onRemoveBodyWeight,
  onToggleWorkout,
  onUpdatePersonalRecord,
  personalRecords,
  progress,
  storageError,
}: WhisTrainingAssistantProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const nextWorkout = strengthWorkoutSplit.find(
    (workout) => !progress.completedDayIds.includes(workout.id),
  );
  const guidance = isLoading
    ? "Reviewing your training records"
    : nextWorkout === undefined
      ? "This week's training is complete. Prioritize recovery."
      : `${nextWorkout.name} · ${nextWorkout.focus}`;

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Whis training guidance"
      className="strength-tracker whis-assistant"
      data-open={isOpen}
    >
      <div className="strength-tracker__summary whis-assistant__summary">
        <div>
          <span>Whis · Training attendant</span>
          <strong>{guidance}</strong>
          <small>
            {progress.weeklyCompleted}/6 sessions
            {progress.latestWeightKg === null
              ? ""
              : ` · ${progress.latestWeightKg.toFixed(1)} kg`}
          </small>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? "Close" : "Review training"}
        </button>
      </div>

      {isOpen ? (
        <div className="strength-tracker__panel" id={panelId}>
          <p className="whis-assistant__guidance">
            Consistency first. Select movements that suit today&apos;s equipment
            and execute the intended muscle-group volume with control.
          </p>
          <WorkoutSplit
            completedDayIds={progress.completedDayIds}
            onToggleWorkout={onToggleWorkout}
          />
          <StrengthRecords
            bodyWeightEntries={bodyWeightEntries}
            onAddBodyWeight={onAddBodyWeight}
            onRemoveBodyWeight={onRemoveBodyWeight}
            onUpdatePersonalRecord={onUpdatePersonalRecord}
            personalRecords={personalRecords}
          />
          <p className="strength-tracker__storage">
            Stored privately in this browser on this device.
          </p>
          {storageError !== null ? (
            <p className="strength-tracker__error">{storageError}</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
