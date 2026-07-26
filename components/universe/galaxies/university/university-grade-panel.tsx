"use client";

import { useRef, useState, type FormEvent } from "react";

import type {
  NewUniversityGrade,
  UniversityCourseId,
  UniversityGrade,
} from "./university-record";
import {
  formatUniversityDate,
  getUniversityDateInputValue,
} from "./university-record-format";
import { deriveUniversityGradeTrajectory } from "./university-operations-summary";
import styles from "./university-operations-dashboard.module.css";

const scoreFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
});

type UniversityGradePanelProps = Readonly<{
  courseId: UniversityCourseId;
  grades: readonly UniversityGrade[];
  onAdd: (input: NewUniversityGrade) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}>;

function formatPercent(value: number) {
  return `${scoreFormatter.format(value)}%`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The grade could not be updated.";
}

export function UniversityGradePanel({
  courseId,
  grades,
  onAdd,
  onRemove,
}: UniversityGradePanelProps) {
  const pendingGuard = useRef(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [today] = useState(getUniversityDateInputValue);
  const trajectory = deriveUniversityGradeTrajectory(grades);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pendingGuard.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const weightValue = String(formData.get("weightPercent") ?? "").trim();
    const input: NewUniversityGrade = {
      courseId,
      label: String(formData.get("label") ?? ""),
      maximumScore: Number(formData.get("maximumScore")),
      occurredOn: String(formData.get("occurredOn") ?? ""),
      score: Number(formData.get("score")),
      weightPercent:
        weightValue.length === 0 ? null : Number.parseFloat(weightValue),
    };

    pendingGuard.current = true;
    setPendingAction("save");
    setFeedback("");

    try {
      await onAdd(input);
      form.reset();
      setFeedback("Assessment recorded.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const handleDelete = async (grade: UniversityGrade) => {
    if (pendingGuard.current) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(grade.id);
    setFeedback("");

    try {
      await onRemove(grade.id);
      setDeleteCandidateId(null);
      setFeedback(`“${grade.label}” was deleted.`);
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  return (
    <section
      aria-labelledby="university-grades-title"
      className={styles.recordPanel}
    >
      <header className={styles.sectionHeading}>
        <div>
          <span>Academic signal</span>
          <h3 id="university-grades-title">Grade trajectory</h3>
        </div>
        <strong className={styles.trajectoryValue}>
          {trajectory.averagePercent === null
            ? "No data"
            : formatPercent(trajectory.averagePercent)}
        </strong>
      </header>

      <div className={styles.trajectorySummary}>
        <span>
          <small>Basis</small>
          <strong>
            {trajectory.averagePercent === null
              ? "Awaiting assessment"
              : trajectory.method === "weighted"
                ? "Weighted trajectory"
                : "Recorded average"}
          </strong>
        </span>
        <span>
          <small>Latest movement</small>
          <strong>
            {trajectory.deltaFromPrevious === null
              ? "Not enough history"
              : `${trajectory.deltaFromPrevious >= 0 ? "+" : ""}${scoreFormatter.format(trajectory.deltaFromPrevious)} pts`}
          </strong>
        </span>
        {trajectory.recordedWeightPercent !== null ? (
          <span>
            <small>Weight recorded</small>
            <strong>{formatPercent(trajectory.recordedWeightPercent)}</strong>
          </span>
        ) : null}
      </div>

      <details className={styles.composer} open={grades.length === 0}>
        <summary>Add an assessment</summary>
        <form className={styles.recordForm} onSubmit={handleSubmit}>
          <label className={styles.wideField}>
            <span>Assessment</span>
            <input
              maxLength={140}
              name="label"
              placeholder="Exam, presentation, or project"
              required
            />
          </label>
          <label>
            <span>Score</span>
            <input
              inputMode="decimal"
              min="0"
              name="score"
              required
              step="0.01"
              type="number"
            />
          </label>
          <label>
            <span>Maximum</span>
            <input
              defaultValue="100"
              inputMode="decimal"
              min="0.01"
              name="maximumScore"
              required
              step="0.01"
              type="number"
            />
          </label>
          <label>
            <span>Date</span>
            <input
              defaultValue={today}
              max={today}
              name="occurredOn"
              required
              type="date"
            />
          </label>
          <label>
            <span>Course weight · optional</span>
            <input
              inputMode="decimal"
              max="100"
              min="0.01"
              name="weightPercent"
              placeholder="%"
              step="0.01"
              type="number"
            />
          </label>
          <button
            className={styles.primaryButton}
            disabled={pendingAction !== null}
            type="submit"
          >
            {pendingAction === "save" ? "Saving…" : "Save assessment"}
          </button>
        </form>
      </details>

      {grades.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>No grades recorded</strong>
          <p>The trajectory remains quiet until a real result is available.</p>
        </div>
      ) : (
        <ol className={styles.recordList}>
          {grades.map((grade) => {
            const percentage = (grade.score / grade.maximumScore) * 100;
            const isConfirmingDelete = deleteCandidateId === grade.id;

            return (
              <li key={grade.id}>
                <div className={styles.recordTopline}>
                  <time dateTime={grade.occurredOn}>
                    {formatUniversityDate(grade.occurredOn)}
                  </time>
                  <span>{formatPercent(percentage)}</span>
                </div>
                <strong>{grade.label}</strong>
                <p>
                  {scoreFormatter.format(grade.score)} /{" "}
                  {scoreFormatter.format(grade.maximumScore)}
                  {grade.weightPercent === null
                    ? " · no course weight recorded"
                    : ` · ${formatPercent(grade.weightPercent)} of course`}
                </p>
                <div className={styles.recordActions}>
                  {isConfirmingDelete ? (
                    <>
                      <button
                        className={styles.dangerButton}
                        disabled={pendingAction !== null}
                        onClick={() => void handleDelete(grade)}
                        type="button"
                      >
                        {pendingAction === grade.id
                          ? "Deleting…"
                          : "Confirm delete"}
                      </button>
                      <button
                        disabled={pendingAction !== null}
                        onClick={() => setDeleteCandidateId(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteCandidateId(grade.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p aria-live="polite" className={styles.feedback}>
        {feedback}
      </p>
    </section>
  );
}
