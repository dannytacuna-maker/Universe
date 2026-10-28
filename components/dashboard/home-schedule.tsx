"use client";

import { useEffect, useMemo, useState } from "react";

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
} from "@/lib/calendar-schedule";
import { missionCalendarEventsAround } from "@/lib/mission-calendar";

import styles from "./home-schedule.module.css";

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

const hourHeightPx = 36;
const defaultStartHour = 10;
const defaultEndHour = 21;
const minEventHeightPx = 30;

const categoryOptions = [
  { label: "All categories", value: "all" },
  ...(
    Object.entries(calendarEventToneLabels) as Array<
      [CalendarEventTone, string]
    >
  ).map(([value, label]) => ({ label, value })),
] as const;

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
    Math.min(defaultStartHour, Math.floor(earliest / 60)),
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
        tone: resolveCalendarEventTone(event),
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

function formatSelectedDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function HomeSchedule() {
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfLocalDay(new Date()),
  );
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const events = useMemo(
    () => missionCalendarEventsAround(selectedDate),
    [selectedDate],
  );

  const week = useMemo(
    () => buildCalendarWeek(selectedDate, { now }),
    [now, selectedDate],
  );
  const selectedKey = toDateKey(selectedDate);
  const todayKey = toDateKey(now);

  const dayEvents = useMemo(() => {
    const forDay = eventsForDateKey(events, selectedKey);
    if (category === "all") return forDay;
    return forDay.filter(
      (event) => resolveCalendarEventTone(event) === category,
    );
  }, [category, events, selectedKey]);

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

  const daysWithEvents = useMemo(() => {
    const keys = new Set<string>();
    for (const event of events) {
      if (category !== "all" && resolveCalendarEventTone(event) !== category) {
        continue;
      }
      keys.add(toDateKey(new Date(event.startsAt)));
    }
    return keys;
  }, [category, events]);

  const shiftDay = (deltaDays: number) => {
    setSelectedDate((current) => addDays(current, deltaDays));
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
              aria-label="Previous day"
              className={styles.iconButton}
              onClick={() => shiftDay(-1)}
              type="button"
            >
              <ChevronLeftIcon />
            </button>
            <button
              aria-label="Jump to today"
              className={styles.dateLabel}
              onClick={goToday}
              type="button"
            >
              {formatSelectedDateLabel(selectedDate)}
            </button>
            <button
              aria-label="Next day"
              className={styles.iconButton}
              onClick={() => shiftDay(1)}
              type="button"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <div aria-label="Week" className={styles.weekStrip} role="tablist">
        {week.map((day) => {
          const selected = day.dateKey === selectedKey;
          const hasEvents = daysWithEvents.has(day.dateKey);
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
              <span
                aria-hidden="true"
                className={styles.weekDayDot}
                data-active={hasEvents ? "true" : undefined}
              />
            </button>
          );
        })}
      </div>

      {allDayEvents.length > 0 ? (
        <div className={styles.allDayRow}>
          <span className={styles.allDayLabel}>All day</span>
          <div className={styles.allDayEvents}>
            {allDayEvents.map((event) => (
              <span
                className={styles.allDayPill}
                data-tone={resolveCalendarEventTone(event)}
                key={event.id}
              >
                {event.title}
              </span>
            ))}
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

              return (
                <div
                  className={styles.eventPill}
                  data-tone={item.tone}
                  key={item.event.id}
                  style={{
                    height: item.height,
                    left,
                    top: item.top,
                    width,
                  }}
                  title={
                    item.event.location
                      ? `${item.event.title} · ${item.event.location}`
                      : item.event.title
                  }
                >
                  <strong>{item.event.title}</strong>
                  <span>
                    {item.timeLabel}
                    {item.event.location ? ` · ${item.event.location}` : ""}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
