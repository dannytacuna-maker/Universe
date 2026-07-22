"use client";

import { useId, useState, type FormEvent } from "react";

import type { JiuJitsuProgress } from "./jiu-jitsu-progress";
import {
  jiuJitsuClassTypeLabels,
  type JiuJitsuClassType,
  type JiuJitsuSession,
  type NewJiuJitsuSession,
} from "./jiu-jitsu-session";

type JiuJitsuTrainingLogProps = Readonly<{
  isLoading: boolean;
  isVisible: boolean;
  onAddSession: (session: NewJiuJitsuSession) => Promise<void>;
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
  onRemoveSession,
  progress,
  sessions,
  storageError,
}: JiuJitsuTrainingLogProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (!isVisible) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      sparringRounds: Number(data.get("sparringRounds")),
      techniques,
    };

    setIsSaving(true);
    setFeedback("");

    try {
      await onAddSession(input);
      form.reset();
      setFeedback("Training session logged.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The training session could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (sessionId: string) => {
    setFeedback("");

    try {
      await onRemoveSession(sessionId);
      setFeedback("Training session removed.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The training session could not be removed.",
      );
    }
  };

  return (
    <aside className="jiu-jitsu-log" data-open={isOpen}>
      <div className="jiu-jitsu-log__summary">
        <div>
          <span>Jiu-Jitsu</span>
          <strong>
            {isLoading
              ? "Loading training history"
              : `${progress.weeklySessions} this week`}
          </strong>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? "Close" : "Log training"}
        </button>
      </div>

      {isOpen ? (
        <div className="jiu-jitsu-log__panel" id={panelId}>
          <div className="jiu-jitsu-log__metrics" aria-label="Training summary">
            <span>
              <strong>{progress.totalSessions}</strong>Total sessions
            </span>
            <span>
              <strong>{progress.totalRounds}</strong>Sparring rounds
            </span>
          </div>

          <form className="jiu-jitsu-log__form" onSubmit={handleSubmit}>
            <label>
              Date
              <input
                defaultValue={todayAsInputValue()}
                max={todayAsInputValue()}
                name="occurredOn"
                required
                type="date"
              />
            </label>
            <label>
              Session
              <select defaultValue="gi" name="classType">
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
                defaultValue="60"
                max="360"
                min="1"
                name="durationMinutes"
                required
                type="number"
              />
            </label>
            <label>
              Sparring rounds
              <input
                defaultValue="0"
                max="50"
                min="0"
                name="sparringRounds"
                required
                type="number"
              />
            </label>
            <label className="jiu-jitsu-log__wide-field">
              Techniques <span>separate with commas</span>
              <input name="techniques" type="text" />
            </label>
            <label className="jiu-jitsu-log__wide-field">
              Reflection
              <textarea maxLength={1200} name="notes" rows={2} />
            </label>
            <label className="jiu-jitsu-log__check">
              <input name="mobilityWork" type="checkbox" />
              Mobility work completed
            </label>
            <button
              className="jiu-jitsu-log__save"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving" : "Save session"}
            </button>
          </form>

          <div className="jiu-jitsu-log__history">
            <strong>Recent training</strong>
            {sessions.length === 0 ? (
              <p>No sessions logged yet.</p>
            ) : (
              <ul>
                {sessions.slice(0, 3).map((session) => (
                  <li key={session.id}>
                    <span>
                      <strong>{formatSessionDate(session.occurredOn)}</strong>
                      {jiuJitsuClassTypeLabels[session.classType]} ·{" "}
                      {session.durationMinutes} min
                    </span>
                    <button
                      onClick={() => void handleRemove(session.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="jiu-jitsu-log__storage">
            Stored privately in this browser on this device.
          </p>
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
