"use client";

import { useId, useState } from "react";

import type { StrengthWorkoutDayId } from "./strength-physique-plan";
import type { StrengthProgress } from "./strength-physique-progress";
import type {
  BodyWeightEntry,
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
  StrengthLiftObservation,
  StrengthPersonalRecord,
} from "./strength-physique-record";
import { StrengthRecords } from "./strength-records";
import { WorkoutSplit } from "./workout-split";

type StrengthPhysiqueTrackerProps = Readonly<{
  bodyWeightEntries: readonly BodyWeightEntry[];
  isLoading: boolean;
  isVisible: boolean;
  liftHistory: readonly StrengthLiftObservation[];
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

export function StrengthPhysiqueTracker({
  bodyWeightEntries,
  isLoading,
  isVisible,
  liftHistory,
  onAddBodyWeight,
  onRemoveBodyWeight,
  onToggleWorkout,
  onUpdatePersonalRecord,
  personalRecords,
  progress,
  storageError,
}: StrengthPhysiqueTrackerProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="strength-tracker" data-open={isOpen}>
      <div className="strength-tracker__summary">
        <div>
          <span>Strength & Physique</span>
          <strong>
            {isLoading
              ? "Loading training plan"
              : `${progress.weeklyCompleted} of 6 sessions this week`}
          </strong>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? "Close" : "Open training"}
        </button>
      </div>

      {isOpen ? (
        <div className="strength-tracker__panel" id={panelId}>
          <WorkoutSplit
            completedDayIds={progress.completedDayIds}
            onToggleWorkout={onToggleWorkout}
          />
          <StrengthRecords
            bodyWeightEntries={bodyWeightEntries}
            liftHistory={liftHistory}
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
