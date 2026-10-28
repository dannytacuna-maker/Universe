import {
  addDays,
  startOfLocalDay,
  toDateKey,
  type CalendarEventTone,
  type CalendarScheduleEvent,
} from "@/lib/calendar-schedule";

type MissionCalendarTemplate = Readonly<{
  endTime: string;
  location: string | null;
  startTime: string;
  title: string;
  tone: CalendarEventTone;
  weekday: number;
}>;

/**
 * Site-owned weekly schedule mirrored from the owner's Google Calendar week
 * (classes + jiu-jitsu). Not synced live — edit this file when the timetable changes.
 */
const weeklyTemplates = [
  {
    weekday: 1,
    title: "LANGUAGE A III",
    startTime: "14:30",
    endTime: "16:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 1,
    title: "LANGUAGE B II",
    startTime: "16:30",
    endTime: "18:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 1,
    title: "Jiu-Jitsu Training UEM",
    startTime: "20:00",
    endTime: "21:30",
    location: null,
    tone: "jiujitsu",
  },
  {
    weekday: 2,
    title: "HUMAN RESOURCES",
    startTime: "10:30",
    endTime: "12:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 2,
    title: "MANAGEMENT CONTROL",
    startTime: "12:30",
    endTime: "14:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 2,
    title: "FINANCIAL ANALYSIS",
    startTime: "14:30",
    endTime: "16:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 2,
    title: "LOGISTICS & DISTRIBUTION",
    startTime: "16:30",
    endTime: "18:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 2,
    title: "Jiu-Jitsu Training UEM",
    startTime: "20:00",
    endTime: "21:30",
    location: null,
    tone: "jiujitsu",
  },
  {
    weekday: 3,
    title: "LANGUAGE A III",
    startTime: "10:30",
    endTime: "12:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 3,
    title: "LANGUAGE B II",
    startTime: "12:30",
    endTime: "14:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 3,
    title: "MARKETING STRATEGY",
    startTime: "14:30",
    endTime: "16:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 3,
    title: "MERGERS & ACQUISITIONS",
    startTime: "16:30",
    endTime: "18:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 4,
    title: "HUMAN RESOURCES",
    startTime: "10:30",
    endTime: "12:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 4,
    title: "MANAGEMENT CONTROL",
    startTime: "12:30",
    endTime: "14:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 4,
    title: "FINANCIAL ANALYSIS",
    startTime: "14:30",
    endTime: "16:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 4,
    title: "LOGISTICS & DISTRIBUTION",
    startTime: "16:30",
    endTime: "18:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 5,
    title: "CIMA Jiu-Jitsu Open Mat",
    startTime: "11:00",
    endTime: "13:00",
    location: null,
    tone: "jiujitsu",
  },
  {
    weekday: 5,
    title: "MARKETING STRATEGY",
    startTime: "14:30",
    endTime: "16:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    weekday: 5,
    title: "MERGERS & ACQUISITIONS",
    startTime: "16:30",
    endTime: "18:30",
    location: "A351 · M33",
    tone: "university",
  },
] as const satisfies readonly MissionCalendarTemplate[];

function parseClock(value: string) {
  const [hoursText = "0", minutesText = "0"] = value.split(":");
  return {
    hours: Number(hoursText),
    minutes: Number(minutesText),
  };
}

function atLocalTime(day: Date, clock: string) {
  const { hours, minutes } = parseClock(clock);
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildMissionCalendarEvents(
  rangeStart: Date,
  rangeEnd: Date,
): readonly CalendarScheduleEvent[] {
  const start = startOfLocalDay(rangeStart);
  const end = startOfLocalDay(rangeEnd);
  if (end < start) return [];

  const events: CalendarScheduleEvent[] = [];
  let cursor = start;

  while (cursor <= end) {
    const weekday = cursor.getDay();
    const dateKey = toDateKey(cursor);

    for (const template of weeklyTemplates) {
      if (template.weekday !== weekday) continue;

      const startsAt = atLocalTime(cursor, template.startTime);
      const endsAt = atLocalTime(cursor, template.endTime);

      events.push({
        allDay: false,
        endsAt: endsAt.toISOString(),
        htmlLink: null,
        id: `${dateKey}-${slugify(template.title)}-${template.startTime}`,
        location: template.location,
        startsAt: startsAt.toISOString(),
        title: template.title,
        tone: template.tone,
      });
    }

    cursor = addDays(cursor, 1);
  }

  return events.sort(
    (left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

export function missionCalendarEventsAround(
  anchor: Date,
  weekRadius = 8,
): readonly CalendarScheduleEvent[] {
  const center = startOfLocalDay(anchor);
  return buildMissionCalendarEvents(
    addDays(center, -weekRadius * 7),
    addDays(center, weekRadius * 7 + 6),
  );
}
