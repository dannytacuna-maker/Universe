import { universityCourseSystems } from "@/components/universe/galaxies/university/university-course-systems";
import type { CourseWeekday } from "@/components/universe/galaxies/university/course-system-definition";
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

const weekdayToJsDay = {
  friday: 5,
  monday: 1,
  thursday: 4,
  tuesday: 2,
  wednesday: 3,
} as const satisfies Record<CourseWeekday, number>;

/**
 * Extra recurring blocks that live outside the university course catalog
 * (training). Edit here when these change.
 */
const trainingTemplates = [
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
    title: "Jiu-Jitsu Training UEM",
    startTime: "20:00",
    endTime: "21:30",
    location: null,
    tone: "jiujitsu",
  },
  {
    weekday: 5,
    title: "CIMA Jiu-Jitsu Open Mat",
    startTime: "11:00",
    endTime: "13:00",
    location: null,
    tone: "jiujitsu",
  },
] as const satisfies readonly MissionCalendarTemplate[];

function courseTemplates(): readonly MissionCalendarTemplate[] {
  return universityCourseSystems.flatMap((course) =>
    course.schedule.map((meeting) => ({
      endTime: meeting.endTime,
      location: `${meeting.room} · ${meeting.group}`,
      startTime: meeting.startTime,
      title: course.displayName.toUpperCase(),
      tone: "university" as const,
      weekday: weekdayToJsDay[meeting.day],
    })),
  );
}

const weeklyTemplates: readonly MissionCalendarTemplate[] = [
  ...courseTemplates(),
  ...trainingTemplates,
];

function parseClock(value: string) {
  const [hoursText = "0", minutesText = "0"] = value.split(":");
  return {
    hours: Number(hoursText),
    minutes: Number(minutesText),
  };
}

/** Local wall-clock ISO without timezone shift (no trailing Z). */
function toLocalDateTimeString(day: Date, clock: string) {
  const { hours, minutes } = parseClock(clock);
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${year}-${month}-${date}T${hh}:${mm}:00`;
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

      events.push({
        allDay: false,
        endsAt: toLocalDateTimeString(cursor, template.endTime),
        htmlLink: null,
        id: `${dateKey}-${slugify(template.title)}-${template.startTime}`,
        location: template.location,
        startsAt: toLocalDateTimeString(cursor, template.startTime),
        title: template.title,
        tone: template.tone,
      });
    }

    cursor = addDays(cursor, 1);
  }

  return events.sort((left, right) =>
    left.startsAt < right.startsAt ? -1 : left.startsAt > right.startsAt ? 1 : 0,
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
