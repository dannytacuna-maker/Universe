"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import type {
  WeeklyReview,
  WeeklyReviewInput,
} from "./mission-operating-record";
import { getWeekStartKey } from "./mission-operating-record";
import type {
  MissionPattern,
  MissionReflectionEntry,
} from "./mission-intelligence";
import styles from "./mission-operating-deck.module.css";
import { ReflectionIntelligence } from "./reflection-intelligence";

type WeeklyReviewPanelProps = Readonly<{
  onSubmit: (input: WeeklyReviewInput) => Promise<void>;
  patterns: readonly MissionPattern[];
  reflections: readonly MissionReflectionEntry[];
  reviews: readonly WeeklyReview[];
}>;

type ReviewDraft = Omit<WeeklyReviewInput, "weekStart">;

const emptyDraft: ReviewDraft = {
  adjustment: "",
  friction: "",
  neglected: "",
  nextFocus: "",
  proudOf: "",
};

export function WeeklyReviewPanel({
  onSubmit,
  patterns,
  reflections,
  reviews,
}: WeeklyReviewPanelProps) {
  const weekStart = getWeekStartKey();
  const currentReview = useMemo(
    () => reviews.find((review) => review.weekStart === weekStart) ?? null,
    [reviews, weekStart],
  );
  const [draft, setDraft] = useState<ReviewDraft>(currentReview ?? emptyDraft);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isDraftDirtyRef = useRef(false);

  useEffect(() => {
    if (isDraftDirtyRef.current || currentReview === null) {
      return;
    }

    setDraft({
      adjustment: currentReview.adjustment,
      friction: currentReview.friction,
      neglected: currentReview.neglected,
      nextFocus: currentReview.nextFocus,
      proudOf: currentReview.proudOf,
    });
  }, [currentReview]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    try {
      await onSubmit({ ...draft, weekStart });
      isDraftDirtyRef.current = false;
      setFeedback("Weekly review saved. The next adjustment is now explicit.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The review could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraft = (field: keyof ReviewDraft, value: string) => {
    isDraftDirtyRef.current = true;
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className={styles.sectionStack}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Weekly review</span>
          <h2>Notice. Learn. Adjust.</h2>
        </div>
        <time className={styles.capacity} dateTime={weekStart}>
          Week of{" "}
          {new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            month: "short",
          }).format(new Date(`${weekStart}T12:00:00`))}
        </time>
      </header>
      <p className={styles.sectionIntro}>
        The review changes the system; it does not grade the person.
      </p>

      <form className={styles.reviewForm} onSubmit={handleSubmit}>
        <label>
          <span>What are you proud of?</span>
          <textarea
            onChange={(event) => updateDraft("proudOf", event.target.value)}
            placeholder="Evidence of progress, consistency, courage, or care"
            rows={3}
            value={draft.proudOf}
          />
        </label>
        <label>
          <span>What was neglected?</span>
          <textarea
            onChange={(event) => updateDraft("neglected", event.target.value)}
            placeholder="A life area that became too quiet"
            rows={3}
            value={draft.neglected}
          />
        </label>
        <label>
          <span>Where did friction appear?</span>
          <textarea
            onChange={(event) => updateDraft("friction", event.target.value)}
            placeholder="Environment, energy, schedule, or unclear next action"
            rows={3}
            value={draft.friction}
          />
        </label>
        <label>
          <span>What will you change?</span>
          <textarea
            onChange={(event) => updateDraft("adjustment", event.target.value)}
            placeholder="One small system adjustment"
            rows={3}
            value={draft.adjustment}
          />
        </label>
        <label className={styles.wideField}>
          <span>What deserves focus next week?</span>
          <input
            onChange={(event) => updateDraft("nextFocus", event.target.value)}
            placeholder="A clear direction, not a list"
            value={draft.nextFocus}
          />
        </label>
        <div className={styles.formFooter}>
          <button
            className={styles.primaryAction}
            disabled={isSaving}
            type="submit"
          >
            {isSaving
              ? "Saving…"
              : currentReview === null
                ? "Save review"
                : "Update review"}
          </button>
          <p aria-live="polite" className={styles.feedback}>
            {feedback}
          </p>
        </div>
      </form>

      {reviews.filter((review) => review.weekStart !== weekStart).length > 0 ? (
        <details className={styles.composer}>
          <summary>Past reviews</summary>
          <div className={styles.reviewHistory}>
            {reviews
              .filter((review) => review.weekStart !== weekStart)
              .slice(0, 8)
              .map((review) => (
                <article key={review.weekStart}>
                  <time dateTime={review.weekStart}>{review.weekStart}</time>
                  <strong>
                    {review.nextFocus || "No next focus recorded"}
                  </strong>
                  {review.adjustment ? <p>{review.adjustment}</p> : null}
                </article>
              ))}
          </div>
        </details>
      ) : null}

      <ReflectionIntelligence patterns={patterns} reflections={reflections} />
    </div>
  );
}
