"use client";

import { useEffect, useId, useState } from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";

import {
  strengthWorkoutSplit,
  type StrengthWorkoutDayId,
} from "./strength-physique-plan";
import type { StrengthProgress } from "./strength-physique-progress";
import type {
  BodyWeightEntry,
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
  NewStrengthTrainingSession,
  StrengthLiftObservation,
  StrengthPersonalRecord,
  StrengthTrainingSession,
  StrengthTrainingSessionUpdate,
} from "./strength-physique-record";
import { StrengthRecords } from "./strength-records";
import { StrengthSessionLog } from "./strength-session-log";
import { WorkoutSplit } from "./workout-split";

type WhisTrainingAssistantProps = Readonly<{
  bodyWeightEntries: readonly BodyWeightEntry[];
  isLoading: boolean;
  isVisible: boolean;
  liftHistory: readonly StrengthLiftObservation[];
  onAddBodyWeight: (input: NewBodyWeightEntry) => Promise<void>;
  onAddTrainingSession: (input: NewStrengthTrainingSession) => Promise<void>;
  onEditTrainingSession: (
    input: StrengthTrainingSessionUpdate,
  ) => Promise<void>;
  onRemoveBodyWeight: (entryId: string) => Promise<void>;
  onRemoveTrainingSession: (sessionId: string) => Promise<void>;
  onToggleWorkout: (
    dayId: StrengthWorkoutDayId,
    completed: boolean,
  ) => Promise<void>;
  onUpdatePersonalRecord: (input: NewStrengthPersonalRecord) => Promise<void>;
  personalRecords: readonly StrengthPersonalRecord[];
  progress: StrengthProgress;
  storageError: string | null;
  trainingSessions: readonly StrengthTrainingSession[];
}>;

export function WhisTrainingAssistant({
  bodyWeightEntries,
  isLoading,
  isVisible,
  liftHistory,
  onAddBodyWeight,
  onAddTrainingSession,
  onEditTrainingSession,
  onRemoveBodyWeight,
  onRemoveTrainingSession,
  onToggleWorkout,
  onUpdatePersonalRecord,
  personalRecords,
  progress,
  storageError,
  trainingSessions,
}: WhisTrainingAssistantProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const nextWorkout = strengthWorkoutSplit.find(
    (workout) => !progress.completedDayIds.includes(workout.id),
  );
  const focusName = isLoading
    ? "Preparing"
    : nextWorkout === undefined
      ? "Recovery"
      : nextWorkout.name;

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId !== "strength-whis") setIsOpen(false);
      }),
    [],
  );

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
        <div className="whis-assistant__welcome">
          <span>Whis</span>
          <strong>{focusName}</strong>
          <p>
            {progress.weeklyCompleted}/6 this week
            {progress.latestWeightKg === null
              ? ""
              : ` · ${progress.latestWeightKg.toFixed(1)} kg`}
          </p>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen((current) => {
              const next = !current;
              if (next) activateInterfaceSurface("strength-whis");
              return next;
            });
          }}
          type="button"
        >
          {isOpen ? "Close" : "Train"}
        </button>
      </div>

      {isOpen ? (
        <div className="strength-tracker__panel" id={panelId}>
          <p className="whis-assistant__pulse" aria-label="Training summary">
            <strong>{progress.weeklyCompleted}</strong> week
            <span aria-hidden="true">·</span>
            <strong>{trainingSessions.length}</strong> logged
            {progress.latestWeightKg === null ? null : (
              <>
                <span aria-hidden="true">·</span>
                <strong>{progress.latestWeightKg.toFixed(1)}</strong> kg
              </>
            )}
          </p>

          <StrengthSessionLog
            onAdd={onAddTrainingSession}
            onEdit={onEditTrainingSession}
            onRemove={onRemoveTrainingSession}
            sessions={trainingSessions}
          />

          <details className="whis-assistant__more">
            <summary>Weekly split</summary>
            <WorkoutSplit
              completedDayIds={progress.completedDayIds}
              onToggleWorkout={onToggleWorkout}
            />
          </details>

          <details className="whis-assistant__more">
            <summary>Records &amp; body weight</summary>
            <StrengthRecords
              bodyWeightEntries={bodyWeightEntries}
              liftHistory={liftHistory}
              onAddBodyWeight={onAddBodyWeight}
              onRemoveBodyWeight={onRemoveBodyWeight}
              onUpdatePersonalRecord={onUpdatePersonalRecord}
              personalRecords={personalRecords}
            />
          </details>

          {storageError !== null ? (
            <p className="strength-tracker__error">{storageError}</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
