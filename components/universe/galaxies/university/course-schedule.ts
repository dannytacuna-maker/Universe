import type { CourseMeeting, CourseWeekday } from "./course-system-definition";

const shortDayLabels: Record<CourseWeekday, string> = {
  friday: "Fri",
  monday: "Mon",
  thursday: "Thu",
  tuesday: "Tue",
  wednesday: "Wed",
};

const fullDayLabels: Record<CourseWeekday, string> = {
  friday: "Friday",
  monday: "Monday",
  thursday: "Thursday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
};

export function formatCourseScheduleSummary(
  schedule: readonly CourseMeeting[],
) {
  if (schedule.length === 0) {
    return "Independent project";
  }

  const days = schedule
    .map((meeting) => shortDayLabels[meeting.day])
    .join(" + ");
  const times = new Set(
    schedule.map((meeting) => `${meeting.startTime}–${meeting.endTime}`),
  );
  const timeSummary =
    times.size === 1 ? (times.values().next().value ?? "") : "2 sessions";

  return `${days} · ${timeSummary}`;
}

export function formatCourseScheduleDetails(
  schedule: readonly CourseMeeting[],
) {
  if (schedule.length === 0) {
    return "No scheduled class meetings";
  }

  return schedule
    .map(
      (meeting) =>
        `${fullDayLabels[meeting.day]} ${meeting.startTime}–${meeting.endTime}, room ${meeting.room}, group ${meeting.group}`,
    )
    .join("; ");
}
