import type { JiuJitsuSession } from "./jiu-jitsu-session";

export type JiuJitsuCalendarDay = Readonly<{
  day: number;
  sessionCount: number;
}>;

export type JiuJitsuReview = Readonly<{
  calendarDays: readonly JiuJitsuCalendarDay[];
  calendarLeadingDays: number;
  mobilityCompletionRatio: number;
  monthLabel: string;
  monthlySessions: number;
  recentReflections: readonly JiuJitsuSession[];
  recentSessions: readonly JiuJitsuSession[];
  techniques: readonly string[];
  totalHours: number;
  totalRounds: number;
  weeklySessions: number;
}>;

function startOfWeek(now: Date) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date.getTime();
}

export function deriveJiuJitsuReview(
  sessions: readonly JiuJitsuSession[],
  now = new Date(),
): JiuJitsuReview {
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const countsByDay = new Map<number, number>();
  const techniques = new Set<string>();
  let weeklySessions = 0;
  let monthlySessions = 0;
  let totalMinutes = 0;
  let totalRounds = 0;
  let mobilitySessions = 0;

  for (const session of sessions) {
    const occurredOn = new Date(`${session.occurredOn}T12:00:00`);
    const occurredAt = occurredOn.getTime();
    totalMinutes += session.durationMinutes;
    totalRounds += session.sparringRounds;

    if (session.mobilityWork) {
      mobilitySessions += 1;
    }

    if (occurredAt >= weekStart) {
      weeklySessions += 1;
    }

    if (
      occurredAt >= monthStart.getTime() &&
      occurredAt < nextMonth.getTime()
    ) {
      monthlySessions += 1;
      const day = occurredOn.getDate();
      countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
    }

    for (const technique of session.techniques) {
      techniques.add(technique);
    }
  }

  return {
    calendarDays: Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      sessionCount: countsByDay.get(index + 1) ?? 0,
    })),
    calendarLeadingDays: (monthStart.getDay() + 6) % 7,
    mobilityCompletionRatio:
      sessions.length === 0 ? 0 : mobilitySessions / sessions.length,
    monthLabel: new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(monthStart),
    monthlySessions,
    recentReflections: sessions
      .filter((session) => session.notes.length > 0)
      .slice(0, 5),
    recentSessions: sessions.slice(0, 5),
    techniques: [...techniques].slice(0, 16),
    totalHours: totalMinutes / 60,
    totalRounds,
    weeklySessions,
  };
}
