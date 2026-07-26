"use client";

import { useState, type FormEvent } from "react";

import { getLocalDateKey } from "@/components/mission-control/mission-operating-record";

import type {
  FrenchLearningProfile,
  FrenchLearningProfileUpdate,
  FrenchPracticeSession,
  FrenchPracticeSessionUpdate,
  NewFrenchPracticeSession,
} from "./french-learning-record";
import {
  frenchPracticeFocusLabels,
  frenchPracticeFocuses,
} from "./french-learning-record";
import type { FrenchLearningSummary } from "./french-learning-summary";
import styles from "./french-station-dashboard.module.css";

type FrenchStationDashboardProps = Readonly<{
  isLoading: boolean;
  isVisible: boolean;
  onAddSession: (input: NewFrenchPracticeSession) => Promise<void>;
  onEditSession: (input: FrenchPracticeSessionUpdate) => Promise<void>;
  onRemoveSession: (sessionId: string) => Promise<void>;
  onUpdateProfile: (input: FrenchLearningProfileUpdate) => Promise<void>;
  profile: FrenchLearningProfile | null;
  sessions: readonly FrenchPracticeSession[];
  storageError: string | null;
  summary: FrenchLearningSummary;
}>;

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The station could not save this change.";
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length === 0 ? null : Number(text);
}

export function FrenchStationDashboard({
  isLoading,
  isVisible,
  onAddSession,
  onEditSession,
  onRemoveSession,
  onUpdateProfile,
  profile,
  sessions,
  storageError,
  summary,
}: FrenchStationDashboardProps) {
  const [editingSession, setEditingSession] =
    useState<FrenchPracticeSession | null>(null);
  const [practiceDate, setPracticeDate] = useState(getLocalDateKey);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isVisible) return null;

  const profileUrl =
    profile?.duolingoUsername === undefined ||
    profile.duolingoUsername.length === 0
      ? null
      : `https://www.duolingo.com/profile/${encodeURIComponent(profile.duolingoUsername)}`;

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setFeedback("");

    try {
      await onUpdateProfile({
        duolingoScore: optionalNumber(formData.get("duolingoScore")),
        duolingoUsername: String(formData.get("duolingoUsername") ?? ""),
        streakDays: optionalNumber(formData.get("streakDays")),
        weeklyTargetDays: Number(formData.get("weeklyTargetDays")),
        weeklyTargetMinutes: Number(formData.get("weeklyTargetMinutes")),
      });
      setFeedback("Station telemetry updated.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSessionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input: NewFrenchPracticeSession = {
      confidence: Number(formData.get("confidence")),
      durationMinutes: Number(formData.get("durationMinutes")),
      focus: String(formData.get("focus")) as NewFrenchPracticeSession["focus"],
      lessonsCompleted: Number(formData.get("lessonsCompleted")),
      occurredOn: String(formData.get("occurredOn") ?? ""),
      reflection: String(formData.get("reflection") ?? ""),
    };
    setIsSaving(true);
    setFeedback("");

    try {
      if (editingSession === null) {
        await onAddSession(input);
        setFeedback("French practice logged.");
      } else {
        await onEditSession({ ...input, id: editingSession.id });
        setEditingSession(null);
        setFeedback("Practice session corrected.");
      }

      form.reset();
      setPracticeDate(getLocalDateKey());
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSession = async (session: FrenchPracticeSession) => {
    if (!window.confirm("Remove this French practice session?")) return;
    setIsSaving(true);
    setFeedback("");

    try {
      await onRemoveSession(session.id);
      if (editingSession?.id === session.id) setEditingSession(null);
      setFeedback("Practice session removed.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-labelledby="french-station-title" className={styles.station}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Personal Growth · French</span>
          <h1 id="french-station-title">Lumière Station</h1>
          <p>
            Language practice, progress, and reflection without streak pressure.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.status}>Manual Duolingo telemetry</span>
          <a
            className={styles.externalLink}
            href={profileUrl ?? "https://www.duolingo.com/learn"}
            rel="noreferrer"
            target="_blank"
          >
            {profileUrl === null ? "Open Duolingo" : "Open profile"}
          </a>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.telemetry}>
          <span className={styles.sectionLabel}>Station telemetry</span>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span>Duolingo Score</span>
              <strong>{profile?.duolingoScore ?? "—"}</strong>
              <small>{summary.currentLevel}</small>
            </div>
            <div className={styles.metric}>
              <span>Current streak</span>
              <strong>{profile?.streakDays ?? "—"}</strong>
              <small>{profile?.streakDays === 1 ? "day" : "days"}</small>
            </div>
            <div className={styles.metric}>
              <span>Practice this week</span>
              <strong>{summary.daysPracticedThisWeek}</strong>
              <small>days</small>
            </div>
            <div className={styles.metric}>
              <span>Focused time</span>
              <strong>{summary.minutesThisWeek}</strong>
              <small>minutes this week</small>
            </div>
          </div>

          <form
            className={styles.form}
            key={profile?.updatedAt ?? "new-french-profile"}
            onSubmit={handleProfileSubmit}
          >
            <div className={styles.fieldGrid}>
              <label>
                Duolingo username
                <input
                  autoComplete="off"
                  defaultValue={profile?.duolingoUsername ?? ""}
                  name="duolingoUsername"
                />
              </label>
              <label>
                Duolingo Score
                <input
                  defaultValue={profile?.duolingoScore ?? ""}
                  max="160"
                  min="0"
                  name="duolingoScore"
                  type="number"
                />
              </label>
              <label>
                Current streak
                <input
                  defaultValue={profile?.streakDays ?? ""}
                  min="0"
                  name="streakDays"
                  type="number"
                />
              </label>
              <label>
                Practice days / week
                <input
                  defaultValue={profile?.weeklyTargetDays ?? 5}
                  max="7"
                  min="1"
                  name="weeklyTargetDays"
                  required
                  type="number"
                />
              </label>
              <label>
                Minutes / week
                <input
                  defaultValue={profile?.weeklyTargetMinutes ?? 75}
                  max="1000"
                  min="5"
                  name="weeklyTargetMinutes"
                  required
                  step="5"
                  type="number"
                />
              </label>
            </div>
            <button
              className={styles.primaryButton}
              disabled={isSaving || isLoading}
              type="submit"
            >
              Update telemetry
            </button>
            <p className={styles.note}>
              Saved locally first and synchronized across unlocked devices.
              Mission Control never receives your Duolingo password.
            </p>
          </form>
        </aside>

        <div className={styles.practice}>
          <span className={styles.sectionLabel}>
            {editingSession === null
              ? "Log French practice"
              : "Correct practice"}
          </span>
          <form
            className={styles.sessionForm}
            key={editingSession?.id ?? "new-french-session"}
            onSubmit={handleSessionSubmit}
          >
            <div className={styles.fieldGrid}>
              <label>
                Date
                <input
                  defaultValue={editingSession?.occurredOn ?? practiceDate}
                  name="occurredOn"
                  required
                  type="date"
                />
              </label>
              <label>
                Focus
                <select
                  defaultValue={editingSession?.focus ?? "mixed"}
                  name="focus"
                >
                  {frenchPracticeFocuses.map((focus) => (
                    <option key={focus} value={focus}>
                      {frenchPracticeFocusLabels[focus]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Minutes
                <input
                  defaultValue={editingSession?.durationMinutes ?? 15}
                  min="1"
                  name="durationMinutes"
                  required
                  type="number"
                />
              </label>
              <label>
                Lessons completed
                <input
                  defaultValue={editingSession?.lessonsCompleted ?? 1}
                  min="0"
                  name="lessonsCompleted"
                  required
                  type="number"
                />
              </label>
              <label>
                Confidence
                <select
                  defaultValue={editingSession?.confidence ?? 3}
                  name="confidence"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} / 5
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Reflection · optional
              <textarea
                defaultValue={editingSession?.reflection ?? ""}
                name="reflection"
                placeholder="What became easier? What needs another pass?"
              />
            </label>
            <div className={styles.formActions}>
              <button
                className={styles.primaryButton}
                disabled={isSaving || isLoading}
                type="submit"
              >
                {editingSession === null ? "Log practice" : "Save correction"}
              </button>
              {editingSession !== null ? (
                <button
                  className={styles.secondaryButton}
                  onClick={() => setEditingSession(null)}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <p aria-live="polite" className={styles.feedback}>
            {storageError ?? feedback}
          </p>

          <div className={styles.history}>
            <span className={styles.sectionLabel}>Recent practice</span>
            {sessions.length === 0 ? (
              <p className={styles.empty}>
                Your first logged French session will establish this station’s
                baseline.
              </p>
            ) : (
              <ul className={styles.sessionList}>
                {summary.recentSessions.map((session) => (
                  <li className={styles.session} key={session.id}>
                    <div>
                      <strong>
                        {frenchPracticeFocusLabels[session.focus]} ·{" "}
                        {session.durationMinutes} min
                      </strong>
                      <p className={styles.sessionMeta}>
                        {session.occurredOn} · {session.lessonsCompleted}{" "}
                        lessons · confidence {session.confidence}/5
                      </p>
                      {session.reflection.length > 0 ? (
                        <p className={styles.sessionReflection}>
                          {session.reflection}
                        </p>
                      ) : null}
                    </div>
                    <div className={styles.sessionControls}>
                      <button
                        className={styles.textButton}
                        onClick={() => setEditingSession(session)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={styles.textButton}
                        disabled={isSaving}
                        onClick={() => void handleRemoveSession(session)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
