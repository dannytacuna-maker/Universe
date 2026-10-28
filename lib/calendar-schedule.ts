export type CalendarEventTone =
  "french" | "jiujitsu" | "neutral" | "reading" | "strength" | "university";

export type CalendarScheduleEvent = Readonly<{
  allDay: boolean;
  endsAt: string | null;
  htmlLink: string | null;
  id: string;
  location: string | null;
  startsAt: string;
  title: string;
  tone?: CalendarEventTone;
}>;

export type CalendarScheduleDay = Readonly<{
  dateKey: string;
  events: readonly CalendarScheduleEvent[];
  label: string;
}>;

export type CalendarSchedulePayload = Readonly<{
  detail: string | null;
  events: readonly CalendarScheduleEvent[];
  status: "ok" | "needs_calendar_access" | "unavailable";
}>;

export type CalendarWeekDay = Readonly<{
  date: Date;
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
  weekday: string;
}>;

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeekMonday(date: Date) {
  const day = startOfLocalDay(date);
  const weekday = (day.getDay() + 6) % 7;
  return addDays(day, -weekday);
}

export function buildCalendarWeek(
  anchor: Date,
  options: Readonly<{ now?: Date }> = {},
): readonly CalendarWeekDay[] {
  const now = options.now ?? new Date();
  const todayKey = toDateKey(now);
  const monday = startOfWeekMonday(anchor);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    const dateKey = toDateKey(date);
    return {
      date,
      dateKey,
      dayNumber: date.getDate(),
      isToday: dateKey === todayKey,
      weekday: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(
        date,
      ),
    };
  });
}

export function resolveCalendarEventTone(
  titleOrEvent: string | CalendarScheduleEvent,
): CalendarEventTone {
  if (typeof titleOrEvent !== "string" && titleOrEvent.tone) {
    return titleOrEvent.tone;
  }

  const value = (
    typeof titleOrEvent === "string" ? titleOrEvent : titleOrEvent.title
  ).toLowerCase();

  if (/read|book|library|psychology/.test(value)) return "reading";
  if (/jiu|bjj|\bgi\b|no-?gi|grappling|open mat/.test(value)) {
    return "jiujitsu";
  }
  if (/french|français|francais|duolingo/.test(value)) return "french";
  if (
    /univ|lecture|exam|assignment|course|seminar|class\b|language|marketing|human resources|logistics|mergers|financial|management control/.test(
      value,
    )
  ) {
    return "university";
  }
  if (/strength|gym|lift|workout|physique/.test(value)) {
    return "strength";
  }

  return "neutral";
}

export const calendarEventToneLabels = {
  french: "French",
  jiujitsu: "Jiu-Jitsu",
  neutral: "Other",
  reading: "Reading",
  strength: "Strength",
  university: "University",
} as const satisfies Record<CalendarEventTone, string>;

function dayLabel(dateKey: string, todayKey: string, tomorrowKey: string) {
  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";

  const parts = dateKey.split("-").map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

export function groupCalendarEventsByLocalDay(
  events: readonly CalendarScheduleEvent[],
  options: Readonly<{ dayCount?: number; now?: Date }> = {},
): readonly CalendarScheduleDay[] {
  const dayCount = options.dayCount ?? 7;
  const now = options.now ?? new Date();
  const today = startOfLocalDay(now);
  const todayKey = toDateKey(today);
  const tomorrowKey = toDateKey(addDays(today, 1));

  const days: CalendarScheduleDay[] = Array.from(
    { length: dayCount },
    (_, index) => {
      const date = addDays(today, index);
      const dateKey = toDateKey(date);
      return {
        dateKey,
        events: [],
        label: dayLabel(dateKey, todayKey, tomorrowKey),
      };
    },
  );

  const dayMap = new Map(days.map((day) => [day.dateKey, day]));

  for (const event of events) {
    const dateKey = toDateKey(new Date(event.startsAt));
    const day = dayMap.get(dateKey);
    if (!day) continue;

    dayMap.set(dateKey, {
      ...day,
      events: [...day.events, event],
    });
  }

  return days.map((day) => dayMap.get(day.dateKey) ?? day);
}

export function eventsForDateKey(
  events: readonly CalendarScheduleEvent[],
  dateKey: string,
) {
  return events.filter(
    (event) => toDateKey(new Date(event.startsAt)) === dateKey,
  );
}

export function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
