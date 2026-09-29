"use client";

import { useMemo, useState } from "react";

import {
  MissionWorkspace,
  WorkspaceGrid,
  WorkspacePanel,
} from "@/components/ui/mission-workspace";

import { deriveJiuJitsuReview } from "./jiu-jitsu-review";
import {
  jiuJitsuClassTypeLabels,
  type JiuJitsuSession,
} from "./jiu-jitsu-session";

type JiuJitsuReviewDashboardProps = Readonly<{
  isLoading: boolean;
  isVisible: boolean;
  sessions: readonly JiuJitsuSession[];
  storageError: string | null;
}>;

const calendarWeekdays = ["M", "T", "W", "T", "F", "S", "S"] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function JiuJitsuReviewDashboard({
  isLoading,
  isVisible,
  sessions,
  storageError,
}: JiuJitsuReviewDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const review = useMemo(() => deriveJiuJitsuReview(sessions), [sessions]);

  if (!isVisible) {
    return null;
  }

  const mobilityPercent = Math.round(review.mobilityCompletionRatio * 100);

  return (
    <MissionWorkspace
      accent="132 222 208"
      description="Goku's review of every session you have logged in the chamber."
      eyebrow="Hyperbolic Time Chamber"
      isBusy={isLoading}
      isOpen={isOpen}
      launcherDetail={
        <p>
          Hey, Daniel. You made it. {review.totalRounds} sparring rounds and
          counting.
        </p>
      }
      launcherLabel="Review"
      metrics={[
        {
          id: "week",
          label: "This week",
          tone: review.weeklySessions > 0 ? "positive" : "neutral",
          value: review.weeklySessions,
        },
        { id: "month", label: "This month", value: review.monthlySessions },
        {
          id: "hours",
          label: "Total hours",
          value: review.totalHours.toFixed(1),
        },
        { id: "rounds", label: "Sparring rounds", value: review.totalRounds },
        {
          hint: "of sessions",
          id: "mobility",
          label: "Mobility",
          value: `${mobilityPercent}%`,
        },
      ]}
      onOpenChange={setIsOpen}
      placement="start"
      status={`${review.weeklySessions} session${review.weeklySessions === 1 ? "" : "s"} this week`}
      surfaceId="jiu-jitsu-review"
      title="Training review"
    >
      <WorkspaceGrid className="time-chamber-dashboard">
        <WorkspacePanel
          count={review.monthLabel}
          eyebrow="Calendar"
          span={5}
          title="Mat days"
        >
          <div className="training-calendar" role="grid">
            {calendarWeekdays.map((weekday, index) => (
              <span
                className="training-calendar__weekday"
                key={`${weekday}-${index}`}
              >
                {weekday}
              </span>
            ))}
            {Array.from({ length: review.calendarLeadingDays }, (_, index) => (
              <span aria-hidden="true" key={`empty-${index}`} />
            ))}
            {review.calendarDays.map((day) => (
              <span
                aria-label={`${day.day}: ${day.sessionCount} training sessions`}
                className="training-calendar__day"
                data-active={day.sessionCount > 0}
                key={day.day}
                role="gridcell"
              >
                {day.day}
                {day.sessionCount > 0 ? <i aria-hidden="true" /> : null}
              </span>
            ))}
          </div>
          <p className="time-chamber-dashboard__mobility">
            Mobility on {mobilityPercent}% of sessions
          </p>
        </WorkspacePanel>

        <WorkspacePanel
          count={review.recentSessions.length}
          eyebrow="Recent"
          span={7}
          title="Latest sessions"
        >
          {isLoading ? (
            <p className="time-chamber-dashboard__empty">Loading sessions.</p>
          ) : review.recentSessions.length === 0 ? (
            <p className="time-chamber-dashboard__empty">
              Logged sessions will show here.
            </p>
          ) : (
            <ul className="time-chamber-dashboard__session-list">
              {review.recentSessions.map((session) => (
                <li key={session.id}>
                  <time dateTime={session.occurredOn}>
                    {formatDate(session.occurredOn)}
                  </time>
                  <div>
                    <strong>
                      {jiuJitsuClassTypeLabels[session.classType]}
                    </strong>
                    <span>
                      {session.durationMinutes}m
                      {session.sparringRounds > 0
                        ? ` · ${session.sparringRounds}r`
                        : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WorkspacePanel>

        <WorkspacePanel
          count={review.techniques.length}
          eyebrow="Library"
          span={6}
          title="Techniques"
        >
          {review.techniques.length === 0 ? (
            <p className="time-chamber-dashboard__empty">
              Techniques from your log will collect here.
            </p>
          ) : (
            <ul className="technique-cloud">
              {review.techniques.map((technique) => (
                <li key={technique}>{technique}</li>
              ))}
            </ul>
          )}
        </WorkspacePanel>

        <WorkspacePanel
          count={review.recentReflections.length}
          eyebrow="Reflections"
          span={6}
          title="Notes"
        >
          {review.recentReflections.length === 0 ? (
            <p className="time-chamber-dashboard__empty">
              Session notes will appear here.
            </p>
          ) : (
            <ul className="time-chamber-dashboard__notes">
              {review.recentReflections.map((session) => (
                <li key={session.id}>
                  <time dateTime={session.occurredOn}>
                    {formatDate(session.occurredOn)}
                  </time>
                  <p>{session.notes}</p>
                </li>
              ))}
            </ul>
          )}
        </WorkspacePanel>

        {storageError !== null ? (
          <p className="immersive-dashboard__error">{storageError}</p>
        ) : null}
      </WorkspaceGrid>
    </MissionWorkspace>
  );
}
