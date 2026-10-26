"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PillSelect } from "@/components/ui/pill-select";
import {
  addDays,
  buildCalendarWeek,
  calendarEventToneLabels,
  eventsForDateKey,
  formatClock,
  resolveCalendarEventTone,
  startOfLocalDay,
  toDateKey,
  type CalendarEventTone,
  type CalendarScheduleEvent,
  type CalendarSchedulePayload,
} from "@/lib/calendar-schedule";

import styles from "./home-schedule.module.css";

type LoadState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; payload: CalendarSchedulePayload }>
  | Readonly<{ kind: "error"; detail: string }>;

const dayStartHour = 8;
const dayEndHour = 20;
const hourHeightPx = 56;

const categoryOptions = [
  { label: "All categories", value: "all" },
  ...(
    Object.entries(calendarEventToneLabels) as Array<
      [CalendarEventTone, string]
    >
  ).map(([value, label]) => ({ label, value })),
] as const;

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

function minutesSinceDayStart(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function eventWindow(event: CalendarScheduleEvent) {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  return { end, start };
}

function layoutEvent(event: CalendarScheduleEvent) {
  if (event.allDay) {
    return {
      allDay: true as const,
      tone: resolveCalendarEventTone(event.title),
    };
  }

  const { end, start } = eventWindow(event);
  const gridStart = dayStartHour * 60;
  const gridEnd = dayEndHour * 60;
  const startMinutes = Math.max(minutesSinceDayStart(start), gridStart);
  const endMinutes = Math.min(
    Math.max(minutesSinceDayStart(end), startMinutes + 30),
    gridEnd,
  );

  return {
    allDay: false as const,
    height: ((endMinutes - startMinutes) / 60) * hourHeightPx,
    timeLabel: `${formatClock(start)} – ${formatClock(end)}`,
    tone: resolveCalendarEventTone(event.title),
    top: ((startMinutes - gridStart) / 60) * hourHeightPx,
  };
}

function ChevronLeftIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16" aria-hidden>
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16" aria-hidden>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function HomeSchedule() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [now] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfLocalDay(new Date()),
  );
  const [category, setCategory] = useState<string>("all");
  const requestIdRef = useRef(0);

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadSchedule();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      requestIdRef.current += 1;
    };
  }, [loadSchedule]);

  const retry = () => {
    setState({ kind: "loading" });
    void loadSchedule();
  };

  const week = useMemo(
    () => buildCalendarWeek(selectedDate, { now }),
    [now, selectedDate],
  );
  const selectedKey = toDateKey(selectedDate);
  const todayKey = toDateKey(now);

  const dayEvents = useMemo(() => {
    if (state.kind !== "ready" || state.payload.status !== "ok") return [];
    const events = eventsForDateKey(state.payload.events, selectedKey);
    if (category === "all") return events;
    return events.filter(
      (event) => resolveCalendarEventTone(event.title) === category,
    );
  }, [category, selectedKey, state]);

  const timedEvents = dayEvents.filter((event) => !event.allDay);
  const allDayEvents = dayEvents.filter((event) => event.allDay);
  const hours = Array.from(
    { length: dayEndHour - dayStartHour + 1 },
    (_, index) => dayStartHour + index,
  );
  const gridHeight = (dayEndHour - dayStartHour) * hourHeightPx;
  const nowMinutes = minutesSinceDayStart(now);
  const showNowLine =
    selectedKey === todayKey &&
    nowMinutes >= dayStartHour * 60 &&
    nowMinutes <= dayEndHour * 60;
  const nowTop = ((nowMinutes - dayStartHour * 60) / 60) * hourHeightPx;

  const shiftWeek = (deltaWeeks: number) => {
    setSelectedDate((current) => addDays(current, deltaWeeks * 7));
  };

  const goToday = () => {
    setSelectedDate(startOfLocalDay(now));
  };

  return (
    <section aria-labelledby="home-schedule-title" className={styles.schedule}>
      <div className={styles.header}>
        <h2 id="home-schedule-title">Calendar</h2>
        <div className={styles.controls}>
          <PillSelect
            className={styles.categorySelect}
            onChange={setCategory}
            options={[...categoryOptions]}
            value={category}
          />
          <div className={styles.navGroup}>
            <button
              aria-label="Previous week"
              className={styles.iconButton}
              onClick={() => shiftWeek(-1)}
              type="button"
            >
              <ChevronLeftIcon />
            </button>
            <button
              className={styles.todayButton}
              onClick={goToday}
              type="button"
            >
              Today
            </button>
            <button
              aria-label="Next week"
              className={styles.iconButton}
              onClick={() => shiftWeek(1)}
              type="button"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      {state.kind === "loading" ? (
        <div className={styles.quiet} role="status">
          Loading schedule…
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div className={styles.panel}>
          <p className={styles.quiet}>{state.detail}</p>
          <button className={styles.action} onClick={retry} type="button">
            Retry
          </button>
        </div>
      ) : null}

      {state.kind === "ready" &&
      (state.payload.status === "needs_calendar_access" ||
        state.payload.status === "unavailable") ? (
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
        <>
          <div aria-label="Week" className={styles.weekStrip} role="tablist">
            {week.map((day) => {
              const selected = day.dateKey === selectedKey;
              return (
                <button
                  aria-selected={selected}
                  className={styles.weekDay}
                  data-selected={selected ? "true" : undefined}
                  data-today={day.isToday ? "true" : undefined}
                  key={day.dateKey}
                  onClick={() => setSelectedDate(day.date)}
                  role="tab"
                  type="button"
                >
                  <span className={styles.weekDayLabel}>{day.weekday}</span>
                  <span className={styles.weekDayNumber}>{day.dayNumber}</span>
                  <span aria-hidden="true" className={styles.weekDayDot} />
                </button>
              );
            })}
          </div>

          {allDayEvents.length > 0 ? (
            <div className={styles.allDayRow}>
              <span className={styles.allDayLabel}>All day</span>
              <div className={styles.allDayEvents}>
                {allDayEvents.map((event) => (
                  <a
                    className={styles.allDayPill}
                    data-tone={resolveCalendarEventTone(event.title)}
                    href={event.htmlLink ?? undefined}
                    key={event.id}
                    rel={event.htmlLink ? "noreferrer" : undefined}
                    target={event.htmlLink ? "_blank" : undefined}
                  >
                    {event.title}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.gridShell}>
            <div className={styles.timeAxis} aria-hidden="true">
              {hours.map((hour) => (
                <div
                  className={styles.timeTick}
                  key={hour}
                  style={{ height: hour === dayEndHour ? 0 : hourHeightPx }}
                >
                  {hour === dayEndHour
                    ? null
                    : `${String(hour).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>

            <div className={styles.dayColumn} style={{ height: gridHeight }}>
              {hours.slice(0, -1).map((hour) => (
                <div
                  aria-hidden="true"
                  className={styles.hourLine}
                  key={hour}
                  style={{ top: (hour - dayStartHour) * hourHeightPx }}
                />
              ))}

              {showNowLine ? (
                <div
                  aria-hidden="true"
                  className={styles.nowLine}
                  style={{ top: nowTop }}
                />
              ) : null}

              {timedEvents.length === 0 ? (
                <div className={styles.emptyDay}>Nothing scheduled</div>
              ) : (
                timedEvents.map((event) => {
                  const layout = layoutEvent(event);
                  if (layout.allDay) return null;

                  const content = (
                    <>
                      <strong>{event.title}</strong>
                      <span>{layout.timeLabel}</span>
                    </>
                  );

                  const className = styles.eventPill;
                  const style = {
                    height: Math.max(layout.height, 44),
                    top: layout.top,
                  } as const;

                  if (event.htmlLink) {
                    return (
                      <a
                        className={className}
                        data-tone={layout.tone}
                        href={event.htmlLink}
                        key={event.id}
                        rel="noreferrer"
                        style={style}
                        target="_blank"
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <div
                      className={className}
                      data-tone={layout.tone}
                      key={event.id}
                      style={style}
                    >
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
