import type { JiuJitsuSession } from "./jiu-jitsu-session";

export type JiuJitsuProgress = Readonly<{
  consistency: number;
  depth: number;
  markerCount: number;
  recentAttention: number;
  totalRounds: number;
  totalSessions: number;
  weeklySessions: number;
}>;

const millisecondsPerDay = 86_400_000;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(first: Date, second: Date) {
  return Math.floor(
    (startOfLocalDay(first).getTime() - startOfLocalDay(second).getTime()) /
      millisecondsPerDay,
  );
}

export function deriveJiuJitsuProgress(
  sessions: readonly JiuJitsuSession[],
  now = new Date(),
): JiuJitsuProgress {
  const activeWeeks = new Set<number>();
  let weeklySessions = 0;
  let totalRounds = 0;

  for (const session of sessions) {
    const occurredOn = new Date(`${session.occurredOn}T12:00:00`);
    const ageInDays = daysBetween(now, occurredOn);

    totalRounds += session.sparringRounds;

    if (ageInDays >= 0 && ageInDays < 7) {
      weeklySessions += 1;
    }

    if (ageInDays >= 0 && ageInDays < 56) {
      activeWeeks.add(Math.floor(ageInDays / 7));
    }
  }

  return {
    consistency: activeWeeks.size / 8,
    depth: 1 - Math.exp(-sessions.length / 24),
    markerCount: Math.min(sessions.length, 24),
    recentAttention: Math.min(weeklySessions / 3, 1),
    totalRounds,
    totalSessions: sessions.length,
    weeklySessions,
  };
}
