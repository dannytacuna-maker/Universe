"use client";

import { useMemo } from "react";

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
  const review = useMemo(() => deriveJiuJitsuReview(sessions), [sessions]);

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Jiu-Jitsu training review"
      className="immersive-dashboard time-chamber-dashboard"
    >
      <header className="immersive-dashboard__header">
        <div>
          <span>Hyperbolic Time Chamber</span>
          <strong>Review Training</strong>
          <p>See the work clearly. Keep the existing logger in orbit.</p>
        </div>
        <div aria-label="Training totals" className="immersive-metrics">
          <span>
            <strong>{review.weeklySessions}</strong>This week
          </span>
          <span>
            <strong>{review.monthlySessions}</strong>This month
          </span>
          <span>
            <strong>{review.totalHours.toFixed(1)}</strong>Total hours
          </span>
          <span>
            <strong>{review.totalRounds}</strong>Sparring rounds
          </span>
        </div>
      </header>

      <div className="time-chamber-dashboard__grid">
        <section className="immersive-panel training-calendar-panel">
          <header>
            <span>Training calendar</span>
            <strong>{review.monthLabel}</strong>
          </header>
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
          <div className="mobility-meter">
            <span>Mobility completion</span>
            <strong>{Math.round(review.mobilityCompletionRatio * 100)}%</strong>
            <i aria-hidden="true">
              <b
                style={{ width: `${review.mobilityCompletionRatio * 100}%` }}
              />
            </i>
          </div>
        </section>

        <section className="immersive-panel">
          <header>
            <span>Recent sessions</span>
          </header>
          {isLoading ? (
            <p>Loading training history.</p>
          ) : review.recentSessions.length === 0 ? (
            <p>Your logged training will appear here.</p>
          ) : (
            <ul className="immersive-session-list">
              {review.recentSessions.map((session) => (
                <li key={session.id}>
                  <time dateTime={session.occurredOn}>
                    {formatDate(session.occurredOn)}
                  </time>
                  <strong>{jiuJitsuClassTypeLabels[session.classType]}</strong>
                  <span>
                    {session.durationMinutes} min · {session.sparringRounds}{" "}
                    rounds
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="immersive-panel">
          <header>
            <span>Techniques learned</span>
          </header>
          {review.techniques.length === 0 ? (
            <p>Techniques from your logger will collect here.</p>
          ) : (
            <ul className="technique-cloud">
              {review.techniques.map((technique) => (
                <li key={technique}>{technique}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="immersive-panel reflection-panel">
          <header>
            <span>Past reflections</span>
          </header>
          {review.recentReflections.length === 0 ? (
            <p>Your post-training reflections will remain visible here.</p>
          ) : (
            <ul>
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
        </section>
      </div>

      {storageError !== null ? (
        <p className="immersive-dashboard__error">{storageError}</p>
      ) : null}
    </aside>
  );
}
