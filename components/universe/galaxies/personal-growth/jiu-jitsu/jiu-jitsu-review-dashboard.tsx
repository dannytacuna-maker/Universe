"use client";

import { useEffect, useId, useMemo, useState } from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";

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
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const review = useMemo(() => deriveJiuJitsuReview(sessions), [sessions]);

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId !== "jiu-jitsu-review") setIsOpen(false);
      }),
    [],
  );

  if (!isVisible) {
    return null;
  }

  const mobilityPercent = Math.round(review.mobilityCompletionRatio * 100);

  return (
    <>
      <aside
        aria-label="Goku training guidance"
        className="time-chamber-guide"
        data-open={isOpen}
      >
        <div className="time-chamber-guide__welcome">
          <span>Goku · Training partner</span>
          <strong>Hey, Daniel. You made it.</strong>
          <p>Let&apos;s see how the work is adding up.</p>
        </div>
        <div className="time-chamber-guide__signal">
          <span>This week</span>
          <strong>
            {review.weeklySessions} session
            {review.weeklySessions === 1 ? "" : "s"}
          </strong>
          <small>{review.totalRounds} sparring rounds total</small>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() =>
            setIsOpen((current) => {
              const next = !current;
              if (next) activateInterfaceSurface("jiu-jitsu-review");
              return next;
            })
          }
          type="button"
        >
          {isOpen ? "Close" : "Review"}
        </button>
      </aside>

      {isOpen ? (
        <aside
          aria-label="Jiu-Jitsu training review"
          className="immersive-dashboard time-chamber-dashboard"
          id={panelId}
        >
          <header className="immersive-dashboard__header time-chamber-dashboard__header">
            <div>
              <span>Hyperbolic Time Chamber</span>
              <strong>Training review</strong>
            </div>
            <button
              aria-label="Close training review"
              className="immersive-dashboard__close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </header>

          <p className="time-chamber-dashboard__pulse" aria-label="Training totals">
            <span>
              <strong>{review.weeklySessions}</strong> week
            </span>
            <span>
              <strong>{review.monthlySessions}</strong> month
            </span>
            <span>
              <strong>{review.totalHours.toFixed(1)}</strong> hours
            </span>
            <span>
              <strong>{review.totalRounds}</strong> rounds
            </span>
          </p>

          <div className="time-chamber-dashboard__layout">
            <section className="time-chamber-dashboard__calendar" aria-label="Training calendar">
              <header>
                <span>Calendar</span>
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
                {Array.from(
                  { length: review.calendarLeadingDays },
                  (_, index) => (
                    <span aria-hidden="true" key={`empty-${index}`} />
                  ),
                )}
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
            </section>

            <section className="time-chamber-dashboard__sessions" aria-label="Recent sessions">
              <header>
                <span>Recent</span>
              </header>
              {isLoading ? (
                <p>Loading sessions.</p>
              ) : review.recentSessions.length === 0 ? (
                <p>Logged sessions will show here.</p>
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
            </section>
          </div>

          <div className="time-chamber-dashboard__details">
            <details>
              <summary>
                Techniques
                <span>{review.techniques.length}</span>
              </summary>
              {review.techniques.length === 0 ? (
                <p>Techniques from your log will collect here.</p>
              ) : (
                <ul className="technique-cloud">
                  {review.techniques.map((technique) => (
                    <li key={technique}>{technique}</li>
                  ))}
                </ul>
              )}
            </details>

            <details>
              <summary>
                Notes
                <span>{review.recentReflections.length}</span>
              </summary>
              {review.recentReflections.length === 0 ? (
                <p>Session notes will appear here.</p>
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
            </details>
          </div>

          {storageError !== null ? (
            <p className="immersive-dashboard__error">{storageError}</p>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
