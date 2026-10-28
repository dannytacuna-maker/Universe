"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
import {
  getMissionCalendarRecord,
  missionCalendarEventsAround,
  resolveRecordIdFromOccurrenceId,
  type MissionCalendarDraft,
  type MissionCalendarRecurrence,
} from "@/lib/mission-calendar";

import styles from "./home-schedule.module.css";
import { useMissionCalendar } from "./use-mission-calendar";

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

type EditorState =
  | Readonly<{ kind: "closed" }>
  | Readonly<{ kind: "create"; draft: MissionCalendarDraft }>
  | Readonly<{ kind: "edit"; draft: MissionCalendarDraft }>;

const hourHeightPx = 32;
const gridStartHour = 7;
const gridEndHour = 22;
const minEventHeightPx = 26;

const categoryOptions = [
  { label: "All categories", value: "all" },
  ...(
    Object.entries(calendarEventToneLabels) as Array<
      [CalendarEventTone, string]
    >
  ).map(([value, label]) => ({ label, value })),
] as const;

const toneOptions = (
  Object.entries(calendarEventToneLabels) as Array<[CalendarEventTone, string]>
).map(([value, label]) => ({ label, value }));

const weekdayOptions = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
] as const;

const recurrenceOptions = [
  { label: "Every week", value: "weekly" },
  { label: "One day only", value: "once" },
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
  let earliest = gridStartHour * 60;
  let latest = gridEndHour * 60;

  for (const event of events) {
    const range = eventRangeMinutes(event);
    earliest = Math.min(earliest, range.startMinutes);
    latest = Math.max(latest, range.endMinutes);
  }

  return {
    endHour: Math.min(24, Math.max(gridEndHour, Math.ceil(latest / 60))),
    startHour: Math.max(0, Math.min(gridStartHour, Math.floor(earliest / 60))),
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

function createDraftForDay(day: Date): MissionCalendarDraft {
  const dateKey = toDateKey(day);
  return {
    dateKey,
    endTime: "11:00",
    location: "",
    recurrence: "once",
    startTime: "10:00",
    title: "",
    tone: "university",
    weekday: day.getDay(),
  };
}

function draftFromRecordId(
  occurrenceId: string,
  fallbackDay: Date,
): MissionCalendarDraft | null {
  const recordId = resolveRecordIdFromOccurrenceId(occurrenceId);
  const record = getMissionCalendarRecord(recordId);
  if (!record) return null;

  return {
    dateKey: record.dateKey ?? toDateKey(fallbackDay),
    endTime: record.endTime,
    id: record.id,
    location: record.location ?? "",
    recurrence: record.recurrence,
    startTime: record.startTime,
    title: record.title,
    tone: record.tone,
    weekday: record.weekday ?? fallbackDay.getDay(),
  };
}

export function HomeSchedule() {
  const { records, remove, save } = useMissionCalendar();
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfLocalDay(new Date()),
  );
  const [category, setCategory] = useState<string>("all");
  const [editor, setEditor] = useState<EditorState>({ kind: "closed" });
  const [editorError, setEditorError] = useState<string | null>(null);
  const gridShellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const events = useMemo(
    () => missionCalendarEventsAround(selectedDate, 8, records),
    [records, selectedDate],
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

  useEffect(() => {
    const shell = gridShellRef.current;
    if (!shell) return;

    const focusMinutes =
      selectedKey === todayKey
        ? minutesSinceDayStart(new Date())
        : timedEvents.length > 0
          ? eventRangeMinutes(timedEvents[0]!).startMinutes
          : 10 * 60;
    const focusTop = ((focusMinutes - startHour * 60) / 60) * hourHeightPx;
    shell.scrollTop = Math.max(0, focusTop - shell.clientHeight * 0.28);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional day focus
  }, [category, selectedKey, startHour]);

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

  const openCreate = () => {
    setEditorError(null);
    setEditor({ kind: "create", draft: createDraftForDay(selectedDate) });
  };

  const openEdit = (occurrenceId: string) => {
    const draft = draftFromRecordId(occurrenceId, selectedDate);
    if (!draft) return;
    setEditorError(null);
    setEditor({ kind: "edit", draft });
  };

  const closeEditor = () => {
    setEditor({ kind: "closed" });
    setEditorError(null);
  };

  const updateDraft = <K extends keyof MissionCalendarDraft>(
    key: K,
    value: MissionCalendarDraft[K],
  ) => {
    setEditor((current) => {
      if (current.kind === "closed") return current;
      return {
        ...current,
        draft: { ...current.draft, [key]: value },
      };
    });
  };

  const submitEditor = () => {
    if (editor.kind === "closed") return;
    try {
      save(editor.draft);
      closeEditor();
    } catch (error) {
      setEditorError(
        error instanceof Error ? error.message : "Could not save the event.",
      );
    }
  };

  const deleteEditorEvent = () => {
    if (editor.kind !== "edit" || !editor.draft.id) return;
    remove(editor.draft.id);
    closeEditor();
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
          <button className={styles.addButton} onClick={openCreate} type="button">
            Add
          </button>
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
              <button
                className={styles.allDayPill}
                data-tone={resolveCalendarEventTone(event)}
                key={event.id}
                onClick={() => openEdit(event.id)}
                type="button"
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.gridShell} ref={gridShellRef}>
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
                <button
                  className={styles.eventPill}
                  data-tone={item.tone}
                  key={item.event.id}
                  onClick={() => openEdit(item.event.id)}
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
                  type="button"
                >
                  <strong>{item.event.title}</strong>
                  <span>
                    {item.timeLabel}
                    {item.event.location ? ` · ${item.event.location}` : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {editor.kind !== "closed" ? (
        <div className={styles.editorBackdrop}>
          <div
            aria-labelledby="calendar-editor-title"
            className={styles.editor}
            role="dialog"
          >
            <div className={styles.editorHeader}>
              <h3 id="calendar-editor-title">
                {editor.kind === "create" ? "Add event" : "Edit event"}
              </h3>
              <button
                className={styles.iconButton}
                onClick={closeEditor}
                type="button"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label className={styles.field}>
              <span>Title</span>
              <input
                autoFocus
                onChange={(event) => updateDraft("title", event.target.value)}
                value={editor.draft.title}
              />
            </label>

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>Start</span>
                <input
                  onChange={(event) =>
                    updateDraft("startTime", event.target.value)
                  }
                  placeholder="14:30"
                  value={editor.draft.startTime}
                />
              </label>
              <label className={styles.field}>
                <span>End</span>
                <input
                  onChange={(event) =>
                    updateDraft("endTime", event.target.value)
                  }
                  placeholder="16:30"
                  value={editor.draft.endTime}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Location</span>
              <input
                onChange={(event) =>
                  updateDraft("location", event.target.value)
                }
                placeholder="E133 · M41"
                value={editor.draft.location}
              />
            </label>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span>Category</span>
                <PillSelect
                  onChange={(value) =>
                    updateDraft("tone", value as CalendarEventTone)
                  }
                  options={toneOptions}
                  value={editor.draft.tone}
                />
              </div>
              <div className={styles.field}>
                <span>Repeats</span>
                <PillSelect
                  onChange={(value) =>
                    updateDraft(
                      "recurrence",
                      value as MissionCalendarRecurrence,
                    )
                  }
                  options={[...recurrenceOptions]}
                  value={editor.draft.recurrence}
                />
              </div>
            </div>

            {editor.draft.recurrence === "weekly" ? (
              <div className={styles.field}>
                <span>Weekday</span>
                <PillSelect
                  onChange={(value) => updateDraft("weekday", Number(value))}
                  options={[...weekdayOptions]}
                  value={String(editor.draft.weekday)}
                />
              </div>
            ) : (
              <label className={styles.field}>
                <span>Date</span>
                <input
                  onChange={(event) =>
                    updateDraft("dateKey", event.target.value)
                  }
                  type="date"
                  value={editor.draft.dateKey}
                />
              </label>
            )}

            {editorError ? (
              <p className={styles.editorError} role="alert">
                {editorError}
              </p>
            ) : null}

            <div className={styles.editorActions}>
              {editor.kind === "edit" ? (
                <button
                  className={styles.deleteButton}
                  onClick={deleteEditorEvent}
                  type="button"
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className={styles.editorActionsRight}>
                <button
                  className={styles.secondaryButton}
                  onClick={closeEditor}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={submitEditor}
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
