export const googleCalendarEventsReadonlyScope =
  "https://www.googleapis.com/auth/calendar.events.readonly";

export type CalendarScheduleEvent = Readonly<{
  allDay: boolean;
  endsAt: string | null;
  htmlLink: string | null;
  id: string;
  location: string | null;
  startsAt: string;
  title: string;
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

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
