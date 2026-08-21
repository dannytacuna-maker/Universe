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
        isCompleted ? "Marked incomplete." : "Marked complete.",
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
      className="strength-tracker__section strength-split-section"
    >
      <header className="strength-tracker__section-heading">
        <div>
          <span>Week</span>
          <strong id="strength-split-title">PPL rhythm</strong>
        </div>
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
