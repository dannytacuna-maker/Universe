"use client";

import { useRef, useState, type FormEvent } from "react";

import type {
  NewUniversityAssignment,
  UniversityAssignment,
  UniversityAssignmentStatus,
  UniversityAssignmentUpdate,
  UniversityCourseId,
} from "./university-record";
import {
  formatUniversityDeadline,
  toDateTimeInputValue,
} from "./university-record-format";
import { isAssignmentResolved } from "./university-operations-summary";
import styles from "./university-operations-dashboard.module.css";

const assignmentStatusOptions = [
  { id: "planned", label: "Planned" },
  { id: "in-progress", label: "In progress" },
  { id: "submitted", label: "Submitted" },
  { id: "complete", label: "Complete" },
] as const satisfies readonly {
  id: UniversityAssignmentStatus;
  label: string;
}[];

type UniversityAssignmentPanelProps = Readonly<{
  assignments: readonly UniversityAssignment[];
  courseId: UniversityCourseId;
  onAdd: (input: NewUniversityAssignment) => Promise<void>;
  onEdit: (input: UniversityAssignmentUpdate) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}>;

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The assignment could not be updated.";
}

export function UniversityAssignmentPanel({
  assignments,
  courseId,
  onAdd,
  onEdit,
  onRemove,
}: UniversityAssignmentPanelProps) {
  const pendingGuard = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(
    assignments.length === 0,
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [referenceTime] = useState(() => Date.now());
  const editingAssignment =
    assignments.find((assignment) => assignment.id === editingId) ?? null;

  const openNewAssignment = () => {
    setEditingId(null);
    setIsComposerOpen(true);
    setDeleteCandidateId(null);
    setFeedback("");
  };

  const openAssignmentEditor = (assignmentId: string) => {
    setEditingId(assignmentId);
    setIsComposerOpen(true);
    setDeleteCandidateId(null);
    setFeedback("");
  };

  const closeComposer = () => {
    setEditingId(null);
    setIsComposerOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pendingGuard.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    pendingGuard.current = true;
    setPendingAction("save");
    setFeedback("");

    try {
      const deadline = new Date(String(formData.get("dueAt")));

      if (Number.isNaN(deadline.getTime())) {
        throw new Error("Choose a valid assignment deadline.");
      }

      const dueAt = deadline.toISOString();
      const input: NewUniversityAssignment = {
        courseId,
        details: String(formData.get("details") ?? ""),
        dueAt,
        status: String(formData.get("status")) as UniversityAssignmentStatus,
        title: String(formData.get("title") ?? ""),
      };

      if (editingAssignment === null) {
        await onAdd(input);
        setFeedback("Assignment added.");
      } else {
        await onEdit({ ...input, id: editingAssignment.id });
        setFeedback("Assignment updated.");
      }

      closeComposer();
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const handleDelete = async (assignment: UniversityAssignment) => {
    if (pendingGuard.current) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(assignment.id);
    setFeedback("");

    try {
      await onRemove(assignment.id);
      setDeleteCandidateId(null);
      setFeedback(`“${assignment.title}” was deleted.`);
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  return (
    <section
      aria-labelledby="university-assignments-title"
      className={styles.recordPanel}
    >
      <header className={styles.sectionHeading}>
        <div>
          <span>Course work</span>
          <h3 id="university-assignments-title">Assignments</h3>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={openNewAssignment}
          type="button"
        >
          Add assignment
        </button>
      </header>

      {isComposerOpen ? (
        <form
          className={styles.recordForm}
          key={editingAssignment?.id ?? "new-assignment"}
          onSubmit={handleSubmit}
        >
          <div className={styles.formHeading}>
            <strong>
              {editingAssignment === null
                ? "New assignment"
                : "Edit assignment"}
            </strong>
            <button onClick={closeComposer} type="button">
              Cancel
            </button>
          </div>
          <label className={styles.wideField}>
            <span>Assignment</span>
            <input
              defaultValue={editingAssignment?.title ?? ""}
              maxLength={160}
              name="title"
              required
            />
          </label>
          <label>
            <span>Deadline</span>
            <input
              defaultValue={
                editingAssignment === null
                  ? ""
                  : toDateTimeInputValue(editingAssignment.dueAt)
              }
              name="dueAt"
              required
              type="datetime-local"
            />
          </label>
          <label>
            <span>Status</span>
            <select
              defaultValue={editingAssignment?.status ?? "planned"}
              name="status"
            >
              {assignmentStatusOptions.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wideField}>
            <span>Context</span>
            <textarea
              defaultValue={editingAssignment?.details ?? ""}
              maxLength={1600}
              name="details"
              placeholder="Deliverable, next step, or useful context"
              rows={3}
            />
          </label>
          <button
            className={styles.primaryButton}
            disabled={pendingAction !== null}
            type="submit"
          >
            {pendingAction === "save"
              ? "Saving…"
              : editingAssignment === null
                ? "Save assignment"
                : "Save changes"}
          </button>
        </form>
      ) : null}

      {assignments.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>No assignments yet</strong>
          <p>Add only work that has a real deliverable or deadline.</p>
        </div>
      ) : (
        <ol className={styles.recordList}>
          {assignments.map((assignment) => {
            const isOverdue =
              !isAssignmentResolved(assignment) &&
              Date.parse(assignment.dueAt) < referenceTime;
            const isConfirmingDelete = deleteCandidateId === assignment.id;

            return (
              <li data-overdue={isOverdue} key={assignment.id}>
                <div className={styles.recordTopline}>
                  <span data-status={assignment.status}>
                    {assignmentStatusOptions.find(
                      (status) => status.id === assignment.status,
                    )?.label ?? assignment.status}
                  </span>
                  <time dateTime={assignment.dueAt}>
                    {formatUniversityDeadline(assignment.dueAt)}
                  </time>
                </div>
                <strong>{assignment.title}</strong>
                {assignment.details.length > 0 ? (
                  <p>{assignment.details}</p>
                ) : null}
                <div className={styles.recordActions}>
                  {isConfirmingDelete ? (
                    <>
                      <button
                        className={styles.dangerButton}
                        disabled={pendingAction !== null}
                        onClick={() => void handleDelete(assignment)}
                        type="button"
                      >
                        {pendingAction === assignment.id
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
                    <>
                      <button
                        onClick={() => openAssignmentEditor(assignment.id)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteCandidateId(assignment.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </>
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
