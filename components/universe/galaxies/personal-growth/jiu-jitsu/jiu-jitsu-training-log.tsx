"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import {
  MissionWorkspace,
  WorkspaceGrid,
  WorkspacePanel,
} from "@/components/ui/mission-workspace";

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

const rhythmWeekCount = 12;
const millisecondsPerDay = 86_400_000;

type WeeklyRhythmEntry = Readonly<{
  count: number;
  isCurrent: boolean;
  label: string;
}>;

function deriveWeeklyRhythm(
  sessions: readonly JiuJitsuSession[],
  now = new Date(),
): readonly WeeklyRhythmEntry[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (today.getDay() + 6) % 7;
  const currentWeekStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - mondayOffset,
  ).getTime();
  const counts = Array.from({ length: rhythmWeekCount }, () => 0);

  for (const session of sessions) {
    const occurred = new Date(`${session.occurredOn}T00:00:00`).getTime();
    const daysBeforeWeek = Math.round(
      (currentWeekStart - occurred) / millisecondsPerDay,
    );
    const weeksAgo = daysBeforeWeek <= 0 ? 0 : Math.ceil(daysBeforeWeek / 7);
    const index = rhythmWeekCount - 1 - weeksAgo;
    if (index >= 0) counts[index] = (counts[index] ?? 0) + 1;
  }

  const labelFormatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  });

  return counts.map((count, index) => {
    const weekStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - mondayOffset - (rhythmWeekCount - 1 - index) * 7,
    );
    return {
      count,
      isCurrent: index === rhythmWeekCount - 1,
      label: labelFormatter.format(weekStart),
    };
  });
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
  const [isOpen, setIsOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const submissionLockRef = useRef(false);
  const removalLockRef = useRef(false);
  const weeklyRhythm = useMemo(() => deriveWeeklyRhythm(sessions), [sessions]);

  if (!isVisible) {
    return null;
  }

  const editingSession =
    sessions.find((session) => session.id === editingSessionId) ?? null;
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
    setFeedback("");
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setFeedback("");
  };

  const totalMinutes = sessions.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );
  const peakWeek = Math.max(1, ...weeklyRhythm.map((week) => week.count));

  return (
    <MissionWorkspace
      accent="126 206 190"
      description="Log every class, then review the rhythm of your training."
      eyebrow="Personal Growth · Jiu-Jitsu"
      isBusy={isLoading}
      isOpen={isOpen}
      launcherLabel="Log"
      metrics={[
        {
          hint: "last 7 days",
          id: "week",
          label: "This week",
          tone: progress.weeklySessions > 0 ? "positive" : "neutral",
          value: progress.weeklySessions,
        },
        {
          id: "sessions",
          label: "Sessions",
          value: progress.totalSessions,
        },
        {
          id: "hours",
          label: "Mat hours",
          value: (totalMinutes / 60).toFixed(1),
        },
        {
          id: "rounds",
          label: "Sparring rounds",
          value: progress.totalRounds,
        },
        {
          hint: "of the last 8 weeks",
          id: "consistency",
          label: "Active weeks",
          value: `${Math.round(progress.consistency * 8)}/8`,
        },
      ]}
      onOpenChange={setIsOpen}
      status={
        isLoading
          ? "Opening log"
          : `${progress.weeklySessions} session${progress.weeklySessions === 1 ? "" : "s"} this week`
      }
      surfaceId="jiu-jitsu-training-log"
      title="Training log"
    >
      <WorkspaceGrid className="jiu-jitsu-log">
        <WorkspacePanel
          count={`${peakWeek} peak`}
          eyebrow="Last 12 weeks"
          span={12}
          title="Training rhythm"
        >
          <ol
            aria-label="Sessions per week, oldest first"
            className="jiu-jitsu-log__rhythm"
          >
            {weeklyRhythm.map((week) => (
              <li
                aria-label={`${week.label}: ${week.count} sessions`}
                data-current={week.isCurrent}
                key={week.label}
                style={
                  {
                    "--bar": week.count / peakWeek,
                  } as CSSProperties
                }
              >
                <i aria-hidden="true" />
                <span aria-hidden="true">{week.count}</span>
                <small aria-hidden="true">{week.label}</small>
              </li>
            ))}
          </ol>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow={editingSession === null ? "New entry" : "Editing"}
          span={5}
          title={editingSession === null ? "Log a session" : "Edit session"}
        >
          {editingSession !== null ? (
            <div className="jiu-jitsu-log__editing">
              <span>
                Editing {formatSessionDate(editingSession.occurredOn)}
              </span>
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

            <details className="jiu-jitsu-log__more" open={hasDetails}>
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
          <p aria-live="polite" className="jiu-jitsu-log__feedback">
            {feedback}
          </p>
        </WorkspacePanel>

        <WorkspacePanel
          count={sessions.length}
          eyebrow="History"
          span={7}
          title="All sessions"
        >
          <div className="jiu-jitsu-log__history">
            {sessions.length === 0 ? (
              <p>No sessions yet. Your first class will appear here.</p>
            ) : (
              <ul>
                {sessions.map((session) => (
                  <li
                    data-editing={session.id === editingSessionId}
                    key={session.id}
                  >
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
          </div>

          {storageError !== null ? (
            <p className="jiu-jitsu-log__error">{storageError}</p>
          ) : null}
        </WorkspacePanel>
      </WorkspaceGrid>
    </MissionWorkspace>
  );
}
