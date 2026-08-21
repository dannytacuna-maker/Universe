"use client";

import { useRef, useState, type FormEvent } from "react";

import type {
  NewUniversityNote,
  UniversityCourseId,
  UniversityNote,
  UniversityNoteKind,
} from "./university-record";
import styles from "./university-operations-dashboard.module.css";

const noteKindOptions = [
  { id: "note", label: "Course note" },
  { id: "reflection", label: "Reflection" },
] as const satisfies readonly { id: UniversityNoteKind; label: string }[];

const noteDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
  year: "numeric",
});

type UniversityNotePanelProps = Readonly<{
  courseId: UniversityCourseId;
  notes: readonly UniversityNote[];
  onAdd: (input: NewUniversityNote) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}>;

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The note could not be updated.";
}

export function UniversityNotePanel({
  courseId,
  notes,
  onAdd,
  onRemove,
}: UniversityNotePanelProps) {
  const pendingGuard = useRef(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pendingGuard.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const input: NewUniversityNote = {
      content: String(formData.get("content") ?? ""),
      courseId,
      kind: String(formData.get("kind")) as UniversityNoteKind,
    };

    pendingGuard.current = true;
    setPendingAction("save");
    setFeedback("");

    try {
      await onAdd(input);
      form.reset();
      setFeedback(
        input.kind === "reflection" ? "Reflection saved." : "Note saved.",
      );
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const handleDelete = async (note: UniversityNote) => {
    if (pendingGuard.current) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(note.id);
    setFeedback("");

    try {
      await onRemove(note.id);
      setDeleteCandidateId(null);
      setFeedback(
        note.kind === "reflection" ? "Reflection deleted." : "Note deleted.",
      );
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  return (
    <section
      aria-labelledby="university-notes-title"
      className={styles.recordPanel}
    >
      <header className={styles.sectionHeading}>
        <div>
          <span>Memory</span>
          <h3 id="university-notes-title">Notes</h3>
        </div>
        <span className={styles.recordCount}>{notes.length}</span>
      </header>

      <details className={styles.composer} open={notes.length === 0}>
        <summary>Record a thought</summary>
        <form className={styles.recordForm} onSubmit={handleSubmit}>
          <label>
            <span>Type</span>
            <select defaultValue="note" name="kind">
              {noteKindOptions.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wideField}>
            <span>What should be kept?</span>
            <textarea
              maxLength={3000}
              name="content"
              placeholder="Capture a useful idea, decision, or honest reflection"
              required
              rows={4}
            />
          </label>
          <button
            className={styles.primaryButton}
            disabled={pendingAction !== null}
            type="submit"
          >
            {pendingAction === "save" ? "Saving…" : "Save to course"}
          </button>
        </form>
      </details>

      {notes.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>No course memory yet</strong>
          <p>Notes and reflections stay attached to this course.</p>
        </div>
      ) : (
        <ol className={styles.noteList}>
          {notes.map((note) => {
            const isConfirmingDelete = deleteCandidateId === note.id;

            return (
              <li key={note.id}>
                <div className={styles.recordTopline}>
                  <span>
                    {note.kind === "reflection" ? "Reflection" : "Note"}
                  </span>
                  <time dateTime={note.updatedAt}>
                    {noteDateFormatter.format(new Date(note.updatedAt))}
                  </time>
                </div>
                <p>{note.content}</p>
                <div className={styles.recordActions}>
                  {isConfirmingDelete ? (
                    <>
                      <button
                        className={styles.dangerButton}
                        disabled={pendingAction !== null}
                        onClick={() => void handleDelete(note)}
                        type="button"
                      >
                        {pendingAction === note.id
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
                      onClick={() => setDeleteCandidateId(note.id)}
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
