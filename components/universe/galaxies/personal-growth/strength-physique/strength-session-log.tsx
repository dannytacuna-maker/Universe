"use client";

import { useMemo, useState, type FormEvent } from "react";

import type {
  NewStrengthTrainingSession,
  StrengthExerciseEntry,
  StrengthTrainingFocus,
  StrengthTrainingSession,
  StrengthTrainingSessionUpdate,
} from "./strength-physique-record";

type StrengthSessionLogProps = Readonly<{
  onAdd: (input: NewStrengthTrainingSession) => Promise<void>;
  onEdit: (input: StrengthTrainingSessionUpdate) => Promise<void>;
  onRemove: (sessionId: string) => Promise<void>;
  sessions: readonly StrengthTrainingSession[];
}>;

const focusLabels = {
  custom: "Custom",
  legs: "Legs",
  pull: "Pull",
  push: "Push",
} as const satisfies Record<StrengthTrainingFocus, string>;

function localDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function emptyExercise(): StrengthExerciseEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    reps: 8,
    sets: 3,
    weightKg: null,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function StrengthSessionLog({
  onAdd,
  onEdit,
  onRemove,
  sessions,
}: StrengthSessionLogProps) {
  const [exercises, setExercises] = useState<readonly StrengthExerciseEntry[]>([
    emptyExercise(),
  ]);
  const [editingSession, setEditingSession] =
    useState<StrengthTrainingSession | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const summary = useMemo(() => {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    const cutoff = threeWeeksAgo.toISOString().slice(0, 10);
    const recent = sessions.filter((session) => session.occurredOn >= cutoff);
    const neglected = (["push", "pull", "legs"] as const).filter(
      (focus) => !recent.some((session) => session.focus === focus),
    );
    const recoveryCount = recent.filter(
      (session) => session.recoveryWork || session.mobilityWork,
    ).length;

    return {
      neglected,
      recoveryRate:
        recent.length === 0
          ? 0
          : Math.round((recoveryCount / recent.length) * 100),
      totalExercises: sessions.reduce(
        (total, session) => total + session.exercises.length,
        0,
      ),
    };
  }, [sessions]);

  const resetEditor = () => {
    setEditingSession(null);
    setExercises([emptyExercise()]);
  };

  const beginEdit = (session: StrengthTrainingSession) => {
    setEditingSession(session);
    setExercises(session.exercises);
    setFeedback(null);
  };

  const updateExercise = (
    exerciseId: string,
    field: "name" | "reps" | "sets" | "weightKg",
    value: string,
  ) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              [field]:
                field === "name"
                  ? value
                  : field === "weightKg" && value.length === 0
                    ? null
                    : Number(value),
            }
          : exercise,
      ),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const input: NewStrengthTrainingSession = {
      exercises,
      focus: String(data.get("focus")) as StrengthTrainingFocus,
      mobilityWork: data.get("mobilityWork") === "on",
      notes: String(data.get("notes") ?? ""),
      occurredOn: String(data.get("occurredOn")),
      perceivedExertion:
        String(data.get("perceivedExertion") ?? "").length === 0
          ? null
          : Number(data.get("perceivedExertion")),
      physiqueNotes: String(data.get("physiqueNotes") ?? ""),
      recoveryWork: data.get("recoveryWork") === "on",
      reflection: String(data.get("reflection") ?? ""),
    };
    setIsSaving(true);
    setFeedback(null);

    try {
      if (editingSession === null) {
        await onAdd(input);
        setFeedback("Strength session recorded.");
      } else {
        await onEdit({ ...input, id: editingSession.id });
        setFeedback("Strength session updated.");
      }

      form.reset();
      resetEditor();
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The session could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (session: StrengthTrainingSession) => {
    if (
      !window.confirm(`Remove the ${formatDate(session.occurredOn)} session?`)
    ) {
      return;
    }

    setFeedback(null);

    try {
      await onRemove(session.id);
      if (editingSession?.id === session.id) {
        resetEditor();
      }
      setFeedback("Strength session removed.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The session could not be removed.",
      );
    }
  };

  return (
    <section className="strength-session-log">
      <header>
        <div>
          <span>Training record</span>
          <strong>
            {editingSession === null ? "Log this session" : "Edit session"}
          </strong>
        </div>
        <dl>
          <div>
            <dt>Sessions</dt>
            <dd>{sessions.length}</dd>
          </div>
          <div>
            <dt>Recovery</dt>
            <dd>{summary.recoveryRate}%</dd>
          </div>
          <div>
            <dt>Exercise records</dt>
            <dd>{summary.totalExercises}</dd>
          </div>
        </dl>
      </header>

      {summary.neglected.length > 0 && sessions.length > 0 ? (
        <p className="strength-session-log__attention">
          Quiet over the last three weeks:{" "}
          {summary.neglected.map((focus) => focusLabels[focus]).join(", ")}.
        </p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="strength-session-log__basics">
          <label>
            Date
            <input
              defaultValue={editingSession?.occurredOn ?? localDateValue()}
              key={`date-${editingSession?.id ?? "new"}`}
              name="occurredOn"
              required
              type="date"
            />
          </label>
          <label>
            Focus
            <select
              defaultValue={editingSession?.focus ?? "push"}
              key={`focus-${editingSession?.id ?? "new"}`}
              name="focus"
            >
              {Object.entries(focusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Effort <span>1–10, optional</span>
            <input
              defaultValue={editingSession?.perceivedExertion ?? ""}
              key={`effort-${editingSession?.id ?? "new"}`}
              max="10"
              min="1"
              name="perceivedExertion"
              type="number"
            />
          </label>
        </div>

        <fieldset className="strength-session-log__exercises">
          <legend>Exercises</legend>
          {exercises.map((exercise, index) => (
            <div key={exercise.id}>
              <label>
                <span>Movement {index + 1}</span>
                <input
                  aria-label={`Exercise ${index + 1} name`}
                  onChange={(event) =>
                    updateExercise(exercise.id, "name", event.target.value)
                  }
                  placeholder="Choose at the gym"
                  required
                  value={exercise.name}
                />
              </label>
              <label>
                <span>Sets</span>
                <input
                  aria-label={`Exercise ${index + 1} sets`}
                  min="1"
                  onChange={(event) =>
                    updateExercise(exercise.id, "sets", event.target.value)
                  }
                  required
                  type="number"
                  value={exercise.sets}
                />
              </label>
              <label>
                <span>Reps</span>
                <input
                  aria-label={`Exercise ${index + 1} reps`}
                  min="1"
                  onChange={(event) =>
                    updateExercise(exercise.id, "reps", event.target.value)
                  }
                  required
                  type="number"
                  value={exercise.reps}
                />
              </label>
              <label>
                <span>Kg</span>
                <input
                  aria-label={`Exercise ${index + 1} weight in kilograms`}
                  min="0"
                  onChange={(event) =>
                    updateExercise(exercise.id, "weightKg", event.target.value)
                  }
                  step="0.25"
                  type="number"
                  value={exercise.weightKg ?? ""}
                />
              </label>
              {exercises.length > 1 ? (
                <button
                  aria-label={`Remove exercise ${index + 1}`}
                  onClick={() =>
                    setExercises((current) =>
                      current.filter((item) => item.id !== exercise.id),
                    )
                  }
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          <button
            onClick={() =>
              setExercises((current) => [...current, emptyExercise()])
            }
            type="button"
          >
            Add exercise
          </button>
        </fieldset>

        <div className="strength-session-log__notes">
          <label>
            Reflection
            <textarea
              defaultValue={editingSession?.reflection ?? ""}
              key={`reflection-${editingSession?.id ?? "new"}`}
              maxLength={1200}
              name="reflection"
              rows={2}
            />
          </label>
          <label>
            How I felt <span>optional, neutral</span>
            <textarea
              defaultValue={editingSession?.physiqueNotes ?? ""}
              key={`physique-${editingSession?.id ?? "new"}`}
              maxLength={600}
              name="physiqueNotes"
              rows={2}
            />
          </label>
          <label>
            Notes
            <textarea
              defaultValue={editingSession?.notes ?? ""}
              key={`notes-${editingSession?.id ?? "new"}`}
              maxLength={800}
              name="notes"
              rows={2}
            />
          </label>
        </div>

        <div className="strength-session-log__footer">
          <label>
            <input
              defaultChecked={editingSession?.recoveryWork ?? false}
              key={`recovery-${editingSession?.id ?? "new"}`}
              name="recoveryWork"
              type="checkbox"
            />
            Recovery completed
          </label>
          <label>
            <input
              defaultChecked={editingSession?.mobilityWork ?? false}
              key={`mobility-${editingSession?.id ?? "new"}`}
              name="mobilityWork"
              type="checkbox"
            />
            Mobility completed
          </label>
          <button disabled={isSaving} type="submit">
            {isSaving
              ? "Saving…"
              : editingSession === null
                ? "Save session"
                : "Update session"}
          </button>
          {editingSession !== null ? (
            <button onClick={resetEditor} type="button">
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="strength-session-log__history">
        <strong>Recent sessions</strong>
        {sessions.length === 0 ? (
          <p>No strength sessions recorded yet.</p>
        ) : (
          <ul>
            {sessions.slice(0, 6).map((session) => (
              <li key={session.id}>
                <span>
                  <strong>{formatDate(session.occurredOn)}</strong>
                  {focusLabels[session.focus]} · {session.exercises.length}{" "}
                  exercises
                </span>
                <span>
                  <button onClick={() => beginEdit(session)} type="button">
                    Edit
                  </button>
                  <button
                    onClick={() => void handleRemove(session)}
                    type="button"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {feedback !== null ? (
        <p aria-live="polite" className="strength-session-log__feedback">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
