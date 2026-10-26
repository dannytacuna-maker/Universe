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

type LaidOutEvent = Readonly<{
  column: number;
  columnCount: number;
  endMinutes: number;
  event: CalendarScheduleEvent;
  height: number;
  startMinutes: number;
  timeLabel: string;
  tone: CalendarEventTone;
  top: number;
}>;

const hourHeightPx = 32;
const defaultStartHour = 8;
const defaultEndHour = 18;
const minEventHeightPx = 28;

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

function eventRangeMinutes(event: CalendarScheduleEvent) {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const startMinutes = minutesSinceDayStart(start);
  const endMinutes = Math.max(minutesSinceDayStart(end), startMinutes + 30);
  return {
    endMinutes,
    startMinutes,
    timeLabel: `${formatClock(start)} – ${formatClock(end)}`,
  };
}

function resolveDayWindow(events: readonly CalendarScheduleEvent[]) {
  if (events.length === 0) {
    return { endHour: defaultEndHour, startHour: defaultStartHour };
  }

  let earliest = 24 * 60;
  let latest = 0;
  for (const event of events) {
    const range = eventRangeMinutes(event);
    earliest = Math.min(earliest, range.startMinutes);
    latest = Math.max(latest, range.endMinutes);
  }

  const startHour = Math.max(
    0,
    Math.min(defaultStartHour, Math.floor(earliest / 60) - 0),
  );
  const endHour = Math.min(
    24,
    Math.max(defaultEndHour, Math.ceil(latest / 60)),
  );

  return {
    endHour: Math.max(startHour + 4, endHour),
    startHour,
  };
}

function layoutTimedEvents(
  events: readonly CalendarScheduleEvent[],
  startHour: number,
  endHour: number,
): readonly LaidOutEvent[] {
  const gridStart = startHour * 60;
  const gridEnd = endHour * 60;

  const prepared = events
    .map((event) => {
      const range = eventRangeMinutes(event);
      const startMinutes = Math.max(range.startMinutes, gridStart);
      const endMinutes = Math.min(
        Math.max(range.endMinutes, startMinutes + 20),
        gridEnd,
      );
      return {
        endMinutes,
        event,
        startMinutes,
        timeLabel: range.timeLabel,
        tone: resolveCalendarEventTone(event.title),
      };
    })
    .sort(
      (left, right) =>
        left.startMinutes - right.startMinutes ||
        right.endMinutes - left.endMinutes,
    );

  const columnEnds: number[] = [];
  const withColumns = prepared.map((item) => {
    let column = columnEnds.findIndex((end) => end <= item.startMinutes);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.endMinutes);
    } else {
      columnEnds[column] = item.endMinutes;
    }
    return { ...item, column };
  });

  return withColumns.map((item) => {
    const overlapping = withColumns.filter(
      (other) =>
        other.startMinutes < item.endMinutes &&
        other.endMinutes > item.startMinutes,
    );
    const columnCount = Math.max(
      1,
      ...overlapping.map((other) => other.column + 1),
    );

    return {
      column: item.column,
      columnCount,
      endMinutes: item.endMinutes,
      event: item.event,
      height: Math.max(
        ((item.endMinutes - item.startMinutes) / 60) * hourHeightPx,
        minEventHeightPx,
      ),
      startMinutes: item.startMinutes,
      timeLabel: item.timeLabel,
      tone: item.tone,
      top: ((item.startMinutes - gridStart) / 60) * hourHeightPx,
    };
  });
}

function ChevronLeftIcon() {
  return (
    <svg fill="none" height="14" viewBox="0 0 16 16" width="14" aria-hidden>
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
    <svg fill="none" height="14" viewBox="0 0 16 16" width="14" aria-hidden>
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
  const { endHour, startHour } = resolveDayWindow(timedEvents);
  const hours = Array.from(
    { length: Math.max(endHour - startHour, 1) },
    (_, index) => startHour + index,
  );
  const gridHeight = Math.max(endHour - startHour, 1) * hourHeightPx;
  const laidOut = layoutTimedEvents(timedEvents, startHour, endHour);
  const nowMinutes = minutesSinceDayStart(now);
  const showNowLine =
    selectedKey === todayKey &&
    nowMinutes >= startHour * 60 &&
    nowMinutes <= endHour * 60;
  const nowTop = ((nowMinutes - startHour * 60) / 60) * hourHeightPx;

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
                {allDayEvents.map((event) => {
                  const className = styles.allDayPill;
                  const tone = resolveCalendarEventTone(event.title);
                  if (event.htmlLink) {
                    return (
                      <a
                        className={className}
                        data-tone={tone}
                        href={event.htmlLink}
                        key={event.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {event.title}
                      </a>
                    );
                  }

                  return (
                    <span className={className} data-tone={tone} key={event.id}>
                      {event.title}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className={styles.gridShell}>
            <div
              aria-hidden="true"
              className={styles.timeAxis}
              style={{ height: gridHeight }}
            >
              {hours.map((hour) => (
                <div
                  className={styles.timeTick}
                  key={hour}
                  style={{ top: (hour - startHour) * hourHeightPx }}
                >
                  {`${String(hour).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>

            <div className={styles.dayColumn} style={{ height: gridHeight }}>
              {hours.map((hour) => (
                <div
                  aria-hidden="true"
                  className={styles.hourLine}
                  key={hour}
                  style={{ top: (hour - startHour) * hourHeightPx }}
                />
              ))}

              {showNowLine ? (
                <div
                  aria-hidden="true"
                  className={styles.nowLine}
                  style={{ top: nowTop }}
                />
              ) : null}

              {laidOut.length === 0 ? (
                <div className={styles.emptyDay}>Nothing scheduled</div>
              ) : (
                laidOut.map((item) => {
                  const width = `calc((100% - 0.5rem) / ${item.columnCount})`;
                  const left = `calc(0.25rem + ((100% - 0.5rem) / ${item.columnCount}) * ${item.column})`;
                  const content = (
                    <>
                      <strong>{item.event.title}</strong>
                      <span>{item.timeLabel}</span>
                    </>
                  );
                  const style = {
                    height: item.height,
                    left,
                    top: item.top,
                    width,
                  } as const;

                  if (item.event.htmlLink) {
                    return (
                      <a
                        className={styles.eventPill}
                        data-tone={item.tone}
                        href={item.event.htmlLink}
                        key={item.event.id}
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
                      className={styles.eventPill}
                      data-tone={item.tone}
                      key={item.event.id}
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
