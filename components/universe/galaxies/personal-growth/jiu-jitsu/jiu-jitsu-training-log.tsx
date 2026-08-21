"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";

import type { JiuJitsuProgress } from "./jiu-jitsu-progress";
import {
  jiuJitsuClassTypeLabels,
  type JiuJitsuClassType,
  type JiuJitsuSession,
  type JiuJitsuSessionUpdate,
  type NewJiuJitsuSession,
} from "./jiu-jitsu-session";

type JiuJitsuTrainingLogProps = Readonly<{
  isLoading: boolean;
  isVisible: boolean;
  onAddSession: (session: NewJiuJitsuSession) => Promise<void>;
  onEditSession: (session: JiuJitsuSessionUpdate) => Promise<void>;
  onRemoveSession: (sessionId: string) => Promise<void>;
  progress: JiuJitsuProgress;
  sessions: readonly JiuJitsuSession[];
  storageError: string | null;
}>;

function todayAsInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function JiuJitsuTrainingLog({
  isLoading,
  isVisible,
  onAddSession,
  onEditSession,
  onRemoveSession,
  progress,
  sessions,
  storageError,
}: JiuJitsuTrainingLogProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const submissionLockRef = useRef(false);
  const removalLockRef = useRef(false);

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId !== "jiu-jitsu-training-log") setIsOpen(false);
      }),
    [],
  );

  if (!isVisible) {
    return null;
  }

  const editingSession =
    sessions.find((session) => session.id === editingSessionId) ?? null;
  const recentSessions = sessions.slice(0, 4);
  const hasDetails =
    editingSession !== null &&
    (editingSession.techniques.length > 0 ||
      editingSession.reflection.length > 0 ||
      editingSession.notes.length > 0 ||
      editingSession.mobilityWork);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLockRef.current) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const techniques = String(data.get("techniques") ?? "")
      .split(",")
      .map((technique) => technique.trim())
      .filter((technique) => technique.length > 0);
    const input: NewJiuJitsuSession = {
      classType: String(data.get("classType")) as JiuJitsuClassType,
      durationMinutes: Number(data.get("durationMinutes")),
      mobilityWork: data.get("mobilityWork") === "on",
      notes: String(data.get("notes") ?? "").trim(),
      occurredOn: String(data.get("occurredOn")),
      reflection: String(data.get("reflection") ?? "").trim(),
      sparringRounds: Number(data.get("sparringRounds")),
      techniques,
    };

    submissionLockRef.current = true;
    setIsSaving(true);
    setFeedback("");

    try {
      if (editingSession === null) {
        await onAddSession(input);
        form.reset();
        setFeedback("Session saved.");
      } else {
        await onEditSession({ ...input, id: editingSession.id });
        setEditingSessionId(null);
        setFeedback("Session updated.");
      }
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The training session could not be saved.",
      );
    } finally {
      submissionLockRef.current = false;
      setIsSaving(false);
    }
  };

  const handleRemove = async (sessionId: string) => {
    if (
      removalLockRef.current ||
      !window.confirm("Delete this training session? This cannot be undone.")
    ) {
      return;
    }

    removalLockRef.current = true;
    setPendingRemovalId(sessionId);
    setFeedback("");

    try {
      await onRemoveSession(sessionId);
      if (editingSessionId === sessionId) {
        setEditingSessionId(null);
      }
      setFeedback("Session removed.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The training session could not be removed.",
      );
    } finally {
      removalLockRef.current = false;
      setPendingRemovalId(null);
    }
  };

  const handleEdit = (sessionId: string) => {
    setEditingSessionId(sessionId);
    activateInterfaceSurface("jiu-jitsu-training-log");
    setIsOpen(true);
    setFeedback("");
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setFeedback("");
  };

  return (
    <aside className="jiu-jitsu-log" data-open={isOpen}>
      <div className="jiu-jitsu-log__summary">
        <div>
          <span>Jiu-Jitsu</span>
          <strong>
            {isLoading
              ? "Opening log"
              : `${progress.weeklySessions} this week`}
          </strong>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() =>
            setIsOpen((current) => {
              const next = !current;
              if (next) activateInterfaceSurface("jiu-jitsu-training-log");
              return next;
            })
          }
          type="button"
        >
          {isOpen ? "Close" : "Log"}
        </button>
      </div>

      {isOpen ? (
        <div className="jiu-jitsu-log__panel" id={panelId}>
          <p className="jiu-jitsu-log__pulse" aria-label="Training summary">
            <strong>{progress.totalSessions}</strong> sessions
            <span aria-hidden="true">·</span>
            <strong>{progress.totalRounds}</strong> rounds
          </p>

          {editingSession !== null ? (
            <div className="jiu-jitsu-log__editing">
              <span>Editing {formatSessionDate(editingSession.occurredOn)}</span>
              <button disabled={isSaving} onClick={cancelEdit} type="button">
                Cancel
              </button>
            </div>
          ) : null}

          <form
            className="jiu-jitsu-log__form"
            key={editingSession?.id ?? "new-session"}
            onSubmit={handleSubmit}
          >
            <label>
              Date
              <input
                defaultValue={editingSession?.occurredOn ?? todayAsInputValue()}
                max={todayAsInputValue()}
                name="occurredOn"
                required
                type="date"
              />
            </label>
            <label>
              Session
              <select
                defaultValue={editingSession?.classType ?? "gi"}
                name="classType"
              >
                {Object.entries(jiuJitsuClassTypeLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Minutes
              <input
                defaultValue={editingSession?.durationMinutes ?? 60}
                max="360"
                min="1"
                name="durationMinutes"
                required
                type="number"
              />
            </label>
            <label>
              Rounds
              <input
                defaultValue={editingSession?.sparringRounds ?? 0}
                max="50"
                min="0"
                name="sparringRounds"
                required
                type="number"
              />
            </label>

            <details
              className="jiu-jitsu-log__more"
              open={hasDetails}
            >
              <summary>Notes &amp; details</summary>
              <div className="jiu-jitsu-log__more-body">
                <label className="jiu-jitsu-log__wide-field">
                  Techniques
                  <input
                    defaultValue={editingSession?.techniques.join(", ") ?? ""}
                    name="techniques"
                    placeholder="Comma-separated"
                    type="text"
                  />
                </label>
                <label className="jiu-jitsu-log__wide-field">
                  Reflection
                  <textarea
                    defaultValue={editingSession?.reflection ?? ""}
                    maxLength={1200}
                    name="reflection"
                    rows={2}
                  />
                </label>
                <label className="jiu-jitsu-log__wide-field">
                  Notes
                  <textarea
                    defaultValue={editingSession?.notes ?? ""}
                    maxLength={1200}
                    name="notes"
                    rows={2}
                  />
                </label>
                <label className="jiu-jitsu-log__check">
                  <input
                    defaultChecked={editingSession?.mobilityWork ?? false}
                    name="mobilityWork"
                    type="checkbox"
                  />
                  Mobility done
                </label>
              </div>
            </details>

            <button
              className="jiu-jitsu-log__save"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? "Saving"
                : editingSession === null
                  ? "Save session"
                  : "Save changes"}
            </button>
          </form>

          <details className="jiu-jitsu-log__history" open={sessions.length > 0}>
            <summary>
              Recent
              <span>{sessions.length}</span>
            </summary>
            {recentSessions.length === 0 ? (
              <p>No sessions yet.</p>
            ) : (
              <ul>
                {recentSessions.map((session) => (
                  <li key={session.id}>
                    <div>
                      <strong>{formatSessionDate(session.occurredOn)}</strong>
                      <span>
                        {jiuJitsuClassTypeLabels[session.classType]} ·{" "}
                        {session.durationMinutes}m
                        {session.sparringRounds > 0
                          ? ` · ${session.sparringRounds}r`
                          : ""}
                      </span>
                    </div>
                    <div className="jiu-jitsu-log__history-actions">
                      <button
                        disabled={pendingRemovalId !== null}
                        onClick={() => handleEdit(session.id)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        disabled={pendingRemovalId !== null}
                        onClick={() => void handleRemove(session.id)}
                        type="button"
                      >
                        {pendingRemovalId === session.id
                          ? "Removing"
                          : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>

          {storageError !== null ? (
            <p className="jiu-jitsu-log__error">{storageError}</p>
          ) : null}
          <p aria-live="polite" className="jiu-jitsu-log__feedback">
            {feedback}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
