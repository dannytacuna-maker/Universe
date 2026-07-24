"use client";

import { useState, type FormEvent } from "react";

import type {
  CaptureKind,
  MissionAreaId,
  MissionCapture,
  NewMissionCapture,
} from "./mission-operating-record";
import { findMissionArea, missionAreas } from "./mission-operating-record";
import styles from "./mission-operating-deck.module.css";

const captureKinds = [
  { id: "idea", label: "Idea" },
  { id: "note", label: "Note" },
  { id: "observation", label: "Observation" },
  { id: "task", label: "Action" },
  { id: "reflection", label: "Reflection" },
] as const satisfies readonly { id: CaptureKind; label: string }[];

type CapturePanelProps = Readonly<{
  captures: readonly MissionCapture[];
  onAdd: (input: NewMissionCapture) => Promise<void>;
  onSetStatus: (
    captureId: string,
    status: MissionCapture["status"],
  ) => Promise<void>;
}>;

export function CapturePanel({
  captures,
  onAdd,
  onSetStatus,
}: CapturePanelProps) {
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inbox = captures.filter((capture) => capture.status === "inbox");
  const processed = captures.filter(
    (capture) => capture.status === "processed",
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input: NewMissionCapture = {
      areaId: String(formData.get("areaId")) as MissionAreaId,
      content: String(formData.get("content") ?? ""),
      kind: String(formData.get("kind")) as CaptureKind,
    };
    setIsSaving(true);
    setFeedback("");

    try {
      await onAdd(input);
      form.reset();
      setFeedback("Captured. You can organize it when the moment is right.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The capture could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatus = async (
    capture: MissionCapture,
    status: MissionCapture["status"],
  ) => {
    setFeedback("");

    try {
      await onSetStatus(capture.id, status);
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The capture could not be updated.",
      );
    }
  };

  return (
    <div className={styles.sectionStack}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Capture</span>
          <h2>Hold the thought. Keep moving.</h2>
        </div>
        <span className={styles.capacity}>{inbox.length} in inbox</span>
      </header>
      <p className={styles.sectionIntro}>
        One trusted inbox for ideas, observations, actions, and reflections from
        anywhere in the universe.
      </p>

      <form className={styles.captureComposer} onSubmit={handleSubmit}>
        <textarea
          aria-label="What do you want to capture?"
          name="content"
          placeholder="What deserves to be remembered?"
          required
          rows={4}
        />
        <div>
          <label>
            <span className="sr-only">Capture type</span>
            <select defaultValue="note" name="kind">
              {captureKinds.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Area</span>
            <select defaultValue="general" name="areaId">
              {missionAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className={styles.primaryAction}
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving…" : "Capture"}
          </button>
        </div>
      </form>

      {inbox.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>Inbox clear</strong>
          <p>No loose thought is asking for attention.</p>
        </div>
      ) : (
        <ol className={styles.captureList}>
          {inbox.map((capture) => (
            <li key={capture.id}>
              <div className={styles.captureMeta}>
                <span>{capture.kind}</span>
                <span>{findMissionArea(capture.areaId).label}</span>
                <time dateTime={capture.createdAt}>
                  {new Intl.DateTimeFormat(undefined, {
                    day: "numeric",
                    month: "short",
                  }).format(new Date(capture.createdAt))}
                </time>
              </div>
              <p>{capture.content}</p>
              <button
                onClick={() => void handleStatus(capture, "processed")}
                type="button"
              >
                Mark processed
              </button>
            </li>
          ))}
        </ol>
      )}

      {processed.length > 0 ? (
        <details className={styles.composer}>
          <summary>Processed · {processed.length}</summary>
          <div className={styles.compactList}>
            {processed.slice(0, 12).map((capture) => (
              <div key={capture.id}>
                <span>
                  <strong>{capture.content}</strong>
                  <small>{findMissionArea(capture.areaId).label}</small>
                </span>
                <button
                  onClick={() => void handleStatus(capture, "inbox")}
                  type="button"
                >
                  Return
                </button>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <p aria-live="polite" className={styles.feedback}>
        {feedback}
      </p>
    </div>
  );
}
