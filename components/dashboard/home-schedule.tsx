"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  googleAccountHasCalendarScope,
  googleCalendarConnectScopes,
  groupCalendarEventsByLocalDay,
  type CalendarScheduleDay,
  type CalendarSchedulePayload,
} from "@/lib/calendar-schedule";

import styles from "./home-schedule.module.css";

type LoadState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; payload: CalendarSchedulePayload }>
  | Readonly<{ kind: "error"; detail: string }>;

function formatEventTime(event: CalendarScheduleDay["events"][number]) {
  if (event.allDay) return "All day";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.startsAt));
}

function formatEventRange(event: CalendarScheduleDay["events"][number]) {
  if (event.allDay || event.endsAt === null) return null;

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.endsAt));
}

function isHappeningNow(
  event: CalendarScheduleDay["events"][number],
  now: Date,
) {
  if (event.allDay) {
    const start = new Date(event.startsAt);
    return (
      start.getFullYear() === now.getFullYear() &&
      start.getMonth() === now.getMonth() &&
      start.getDate() === now.getDate()
    );
  }

  const start = new Date(event.startsAt).getTime();
  const end = event.endsAt
    ? new Date(event.endsAt).getTime()
    : start + 60 * 60 * 1000;
  const stamp = now.getTime();
  return stamp >= start && stamp < end;
}

async function readSchedulePayload(
  response: Response,
): Promise<CalendarSchedulePayload | null> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as CalendarSchedulePayload;
  } catch {
    return null;
  }
}

export function HomeSchedule() {
  const { isLoaded, user } = useUser();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isConnecting, setIsConnecting] = useState(false);
  const [now] = useState(() => new Date());
  const requestIdRef = useRef(0);
  const autoConnectAttemptedRef = useRef(false);

  const loadSchedule = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const response = await fetch("/api/calendar/schedule", {
        cache: "no-store",
      });
      const payload = await readSchedulePayload(response);

      if (requestId !== requestIdRef.current) return;

      if (payload === null) {
        setState({
          kind: "error",
          detail: "Could not load schedule.",
        });
        return;
      }

      setState({ kind: "ready", payload });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState({
        kind: "error",
        detail:
          error instanceof Error ? error.message : "Could not load schedule.",
      });
    }
  }, []);

  const connectCalendar = useCallback(async () => {
    if (!user || isConnecting) return false;

    const googleAccount = user.externalAccounts.find(
      (account) => account.provider === "google",
    );

    if (!googleAccount) {
      setState({
        kind: "error",
        detail: "No Google account is linked to this session.",
      });
      return false;
    }

    setIsConnecting(true);
    try {
      const reauth = await googleAccount.reauthorize({
        additionalScopes: [...googleCalendarConnectScopes],
        oidcPrompt: "consent",
        redirectUrl: `${window.location.origin}/sso-callback`,
      });

      const redirectUrl =
        reauth.verification?.externalVerificationRedirectURL?.href;

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return true;
      }

      const verificationError =
        reauth.verification?.error?.longMessage ||
        reauth.verification?.error?.message;

      setState({
        kind: "error",
        detail:
          verificationError ??
          "Google did not return a calendar connection URL. Confirm custom Google credentials and the calendar.readonly scope are enabled in Clerk.",
      });
      setIsConnecting(false);
      return false;
    } catch (error) {
      setState({
        kind: "error",
        detail:
          error instanceof Error
            ? error.message
            : "Could not start Google Calendar connection.",
      });
      setIsConnecting(false);
      return false;
    }
  }, [isConnecting, user]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadSchedule();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      requestIdRef.current += 1;
    };
  }, [loadSchedule]);

  useEffect(() => {
    if (!isLoaded || !user || autoConnectAttemptedRef.current) return;
    if (state.kind !== "ready") return;
    if (state.payload.status !== "needs_calendar_access") return;

    const googleAccount = user.externalAccounts.find(
      (account) => account.provider === "google",
    );
    if (!googleAccount) return;

    // Already granted in Clerk UI metadata but token refresh failed — still reconnect.
    // Skip auto-redirect only when the user just bounced back without a redirect URL.
    autoConnectAttemptedRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      void connectCalendar();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [connectCalendar, isLoaded, state, user]);

  const retry = () => {
    setState({ kind: "loading" });
    void loadSchedule();
  };

  const days =
    state.kind === "ready" && state.payload.status === "ok"
      ? groupCalendarEventsByLocalDay(state.payload.events, { now })
      : [];
  const eventCount = days.reduce((total, day) => total + day.events.length, 0);
  const googleAccount = user?.externalAccounts.find(
    (account) => account.provider === "google",
  );
  const clientHasScope = googleAccountHasCalendarScope(
    googleAccount?.approvedScopes,
  );

  return (
    <section aria-labelledby="home-schedule-title" className={styles.schedule}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Google Calendar</span>
          <h2 id="home-schedule-title">Schedule</h2>
        </div>
        {state.kind === "ready" && state.payload.status === "ok" ? (
          <span className={styles.meta}>
            {eventCount === 0 ? "Next 7 days clear" : `${eventCount} upcoming`}
          </span>
        ) : null}
      </div>

      {state.kind === "loading" || isConnecting ? (
        <div className={styles.quiet} role="status">
          {isConnecting
            ? "Opening Google to connect calendar…"
            : "Loading schedule…"}
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div className={styles.panel}>
          <p className={styles.quiet}>{state.detail}</p>
          <div className={styles.actions}>
            <button
              className={styles.action}
              onClick={() => void connectCalendar()}
              type="button"
            >
              Connect calendar
            </button>
            <button className={styles.action} onClick={retry} type="button">
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === "ready" &&
      state.payload.status === "needs_calendar_access" &&
      !isConnecting ? (
        <div className={styles.panel}>
          <p className={styles.quiet}>
            {state.payload.detail ??
              "Connect Google Calendar once to show your week here."}
            {clientHasScope
              ? " Calendar access looks granted, but the Google token needs a fresh reconnect."
              : null}
          </p>
          <button
            className={styles.action}
            onClick={() => void connectCalendar()}
            type="button"
          >
            Connect calendar
          </button>
        </div>
      ) : null}

      {state.kind === "ready" && state.payload.status === "unavailable" ? (
        <div className={styles.panel}>
          <p className={styles.quiet}>
            {state.payload.detail ?? "Schedule is unavailable right now."}
          </p>
          <button className={styles.action} onClick={retry} type="button">
            Retry
          </button>
        </div>
      ) : null}

      {state.kind === "ready" && state.payload.status === "ok" ? (
        eventCount === 0 ? (
          <div className={styles.panel}>
            <p className={styles.quiet}>
              Nothing scheduled for the next 7 days.
            </p>
          </div>
        ) : (
          <div className={styles.days}>
            {days
              .filter((day) => day.events.length > 0)
              .map((day) => (
                <div className={styles.day} key={day.dateKey}>
                  <h3 className={styles.dayLabel}>{day.label}</h3>
                  <ul className={styles.events}>
                    {day.events.map((event) => {
                      const ends = formatEventRange(event);
                      const live = isHappeningNow(event, now);

                      return (
                        <li
                          className={styles.event}
                          data-live={live ? "true" : undefined}
                          key={event.id}
                        >
                          <span className={styles.time}>
                            <strong>{formatEventTime(event)}</strong>
                            {ends ? <small>– {ends}</small> : null}
                          </span>
                          <span className={styles.eventBody}>
                            {event.htmlLink ? (
                              <a
                                className={styles.eventTitle}
                                href={event.htmlLink}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {event.title}
                              </a>
                            ) : (
                              <span className={styles.eventTitle}>
                                {event.title}
                              </span>
                            )}
                            {event.location ? (
                              <span className={styles.location}>
                                {event.location}
                              </span>
                            ) : null}
                          </span>
                          {live ? (
                            <span className={styles.live}>Now</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
        )
      ) : null}
    </section>
  );
}
