"use client";

import { useState } from "react";

import {
  strengthWorkoutSplit,
  type StrengthWorkoutDayId,
} from "./strength-physique-plan";

type WorkoutSplitProps = Readonly<{
  completedDayIds: readonly StrengthWorkoutDayId[];
  onToggleWorkout: (
    dayId: StrengthWorkoutDayId,
    completed: boolean,
  ) => Promise<void>;
}>;

export function WorkoutSplit({
  completedDayIds,
  onToggleWorkout,
}: WorkoutSplitProps) {
  const [pendingDayId, setPendingDayId] = useState<StrengthWorkoutDayId | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");

  const handleToggle = async (dayId: StrengthWorkoutDayId) => {
    const isCompleted = completedDayIds.includes(dayId);
    setPendingDayId(dayId);
    setFeedback("");

    try {
      await onToggleWorkout(dayId, !isCompleted);
      setFeedback(
        isCompleted ? "Workout marked incomplete." : "Workout completed.",
      );
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The workout could not be updated.",
      );
    } finally {
      setPendingDayId(null);
    }
  };

  return (
    <section
      aria-labelledby="strength-split-title"
      className="strength-tracker__section"
    >
      <header className="strength-tracker__section-heading">
        <div>
          <span>Weekly rhythm</span>
          <strong id="strength-split-title">Six-day PPL split</strong>
        </div>
        <p>Choose movements that suit the gym and your body that day.</p>
      </header>

      <ol className="strength-split">
        {strengthWorkoutSplit.map((day) => {
          const isCompleted = completedDayIds.includes(day.id);

          return (
            <li data-completed={isCompleted} key={day.id}>
              <button
                aria-label={`${day.name}: ${isCompleted ? "completed" : "not completed"}. Toggle workout status.`}
                aria-pressed={isCompleted}
                disabled={pendingDayId === day.id}
                onClick={() => void handleToggle(day.id)}
                type="button"
              >
                <span className="strength-split__day">Day {day.dayNumber}</span>
                <strong>{day.name}</strong>
                <span>{day.focus}</span>
                <i aria-hidden="true">{isCompleted ? "Done" : "Mark"}</i>
              </button>
              <ul aria-label={`${day.name} exercise overview`}>
                {day.groups.map((group) => (
                  <li key={group.muscleGroup}>
                    <span>{group.muscleGroup}</span>
                    <span>{group.exerciseCount}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="strength-tracker__feedback">
        {feedback}
      </p>
    </section>
  );
}
