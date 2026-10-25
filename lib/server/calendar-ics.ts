import ical from "node-ical";

import type {
  CalendarScheduleEvent,
  CalendarSchedulePayload,
} from "@/lib/calendar-schedule";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function asDate(value: Date | string | undefined) {
  if (value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isAllDayEvent(start: Date, end: Date | null, dateType?: string) {
  if (dateType === "date") return true;

  const startLooksDateOnly =
    start.getUTCHours() === 0 &&
    start.getUTCMinutes() === 0 &&
    start.getUTCSeconds() === 0;
  if (!startLooksDateOnly) return false;
  if (end === null) return true;
  return (
    end.getUTCHours() === 0 &&
    end.getUTCMinutes() === 0 &&
    end.getUTCSeconds() === 0
  );
}

function overlapsWindow(
  start: Date,
  end: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const eventEnd = end ?? start;
  return eventEnd >= rangeStart && start < rangeEnd;
}

function durationMs(start: Date, end: Date | null) {
  if (end === null) return 60 * 60 * 1000;
  return Math.max(0, end.getTime() - start.getTime());
}

export async function fetchIcsCalendarSchedule(
  icsUrl: string,
  options: Readonly<{ dayCount?: number; now?: Date }> = {},
): Promise<CalendarSchedulePayload> {
  const dayCount = options.dayCount ?? 7;
  const now = options.now ?? new Date();
  const rangeEnd = addDays(now, dayCount);

  let data: Awaited<ReturnType<typeof ical.async.fromURL>>;
  try {
    data = await ical.async.fromURL(icsUrl);
  } catch (error) {
    return {
      detail:
        error instanceof Error
          ? error.message
          : "Could not load the calendar feed.",
      events: [],
      status: "unavailable",
    };
  }

  const events: CalendarScheduleEvent[] = [];

  for (const item of Object.values(data)) {
    if (!item || typeof item !== "object") continue;
    if (!("type" in item) || item.type !== "VEVENT") continue;

    const baseStart = asDate(item.start);
    if (baseStart === null) continue;

    const baseEnd = asDate(item.end);
    const allDay = isAllDayEvent(
      baseStart,
      baseEnd,
      "datetype" in item && typeof item.datetype === "string"
        ? item.datetype
        : undefined,
    );
    const title =
      typeof item.summary === "string" && item.summary.trim()
        ? item.summary.trim()
        : "Untitled event";
    const location =
      typeof item.location === "string" && item.location.trim()
        ? item.location.trim()
        : null;
    const htmlLink = typeof item.url === "string" ? item.url : null;
    const uid =
      typeof item.uid === "string" && item.uid.trim()
        ? item.uid
        : `${baseStart.toISOString()}-${title}`;

    const rrule =
      "rrule" in item && item.rrule && typeof item.rrule.between === "function"
        ? item.rrule
        : null;

    if (rrule) {
      const occurrences = rrule.between(now, rangeEnd, true);
      const length = durationMs(baseStart, baseEnd);

      for (const occurrence of occurrences) {
        const start = new Date(occurrence);
        const end = new Date(start.getTime() + length);
        events.push({
          allDay,
          endsAt: end.toISOString(),
          htmlLink,
          id: `${uid}-${start.toISOString()}`,
          location,
          startsAt: start.toISOString(),
          title,
        });
      }
      continue;
    }

    if (!overlapsWindow(baseStart, baseEnd, now, rangeEnd)) continue;

    events.push({
      allDay,
      endsAt: baseEnd?.toISOString() ?? null,
      htmlLink,
      id: uid,
      location,
      startsAt: baseStart.toISOString(),
      title,
    });
  }

  events.sort(
    (left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );

  return {
    detail: null,
    events: events.slice(0, 50),
    status: "ok",
  };
}
