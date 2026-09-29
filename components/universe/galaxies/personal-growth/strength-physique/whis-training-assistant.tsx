"use client";

import { useState } from "react";

import {
  MissionWorkspace,
  WorkspaceColumn,
  WorkspaceGrid,
  WorkspacePanel,
} from "@/components/ui/mission-workspace";

import {
  strengthLiftLabels,
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
  const [isOpen, setIsOpen] = useState(false);
  const nextWorkout = strengthWorkoutSplit.find(
    (workout) => !progress.completedDayIds.includes(workout.id),
  );
  const focusName = isLoading
    ? "Preparing"
    : nextWorkout === undefined
      ? "Recovery"
      : nextWorkout.name;

  if (!isVisible) {
    return null;
  }

  const bestLift = personalRecords.reduce<StrengthPersonalRecord | null>(
    (best, record) =>
      best === null || record.weightKg > best.weightKg ? record : best,
    null,
  );

  return (
    <MissionWorkspace
      accent="196 164 238"
      description="Log sessions, keep the Push · Pull · Legs rhythm, and track the big three."
      eyebrow="Whis · Training assistant"
      isBusy={isLoading}
      isOpen={isOpen}
      launcherDetail={
        <p>
          {progress.weeklyCompleted}/6 this week
          {progress.latestWeightKg === null
            ? ""
            : ` · ${progress.latestWeightKg.toFixed(1)} kg`}
        </p>
      }
      launcherLabel="Train"
      metrics={[
        {
          hint: "Push · Pull · Legs ×2",
          id: "week",
          label: "This week",
          tone: progress.weeklyCompleted >= 6 ? "positive" : "neutral",
          value: `${progress.weeklyCompleted}/6`,
        },
        {
          id: "next",
          kind: "text",
          label: "Next focus",
          value: focusName,
        },
        {
          id: "sessions",
          label: "Sessions logged",
          value: trainingSessions.length,
        },
        {
          hint:
            bestLift === null ? undefined : strengthLiftLabels[bestLift.liftId],
          id: "best",
          label: "Heaviest record",
          value: bestLift === null ? "—" : `${bestLift.weightKg} kg`,
        },
        {
          hint: `${bodyWeightEntries.length} entries`,
          id: "weight",
          label: "Body weight",
          value:
            progress.latestWeightKg === null
              ? "—"
              : `${progress.latestWeightKg.toFixed(1)} kg`,
        },
      ]}
      onOpenChange={setIsOpen}
      placement="start"
      status={nextWorkout === undefined ? focusName : `Next: ${focusName}`}
      surfaceId="strength-whis"
      title="Beerus' training grounds"
    >
      <WorkspaceGrid className="strength-tracker whis-assistant">
        <WorkspacePanel span={7}>
          <StrengthSessionLog
            onAdd={onAddTrainingSession}
            onEdit={onEditTrainingSession}
            onRemove={onRemoveTrainingSession}
            sessions={trainingSessions}
          />
        </WorkspacePanel>

        <WorkspaceColumn span={5}>
          <WorkspacePanel>
            <WorkoutSplit
              completedDayIds={progress.completedDayIds}
              onToggleWorkout={onToggleWorkout}
            />
          </WorkspacePanel>
          <WorkspacePanel>
            <StrengthRecords
              bodyWeightEntries={bodyWeightEntries}
              liftHistory={liftHistory}
              onAddBodyWeight={onAddBodyWeight}
              onRemoveBodyWeight={onRemoveBodyWeight}
              onUpdatePersonalRecord={onUpdatePersonalRecord}
              personalRecords={personalRecords}
            />
          </WorkspacePanel>
        </WorkspaceColumn>

        {storageError !== null ? (
          <p className="strength-tracker__error">{storageError}</p>
        ) : null}
      </WorkspaceGrid>
    </MissionWorkspace>
  );
}
