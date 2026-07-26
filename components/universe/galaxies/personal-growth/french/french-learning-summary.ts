import type {
  FrenchLearningProfile,
  FrenchPracticeSession,
  FrenchProgressSnapshot,
} from "./french-learning-record";

export type FrenchLearningSummary = Readonly<{
  activity: number;
  currentLevel: string;
  daysPracticedThisWeek: number;
  minutesThisWeek: number;
  profile: FrenchLearningProfile | null;
  recentSessions: readonly FrenchPracticeSession[];
  snapshots: readonly FrenchProgressSnapshot[];
}>;

function getWeekStartKey(date = new Date()) {
  const weekStart = new Date(date);
  const weekday = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (weekday === 0 ? 6 : weekday - 1));
  return weekStart.toISOString().slice(0, 10);
}

export function getFrenchScoreLevel(score: number | null) {
  if (score === null) return "Score not recorded";
  if (score < 10) return "Very early A1";
  if (score < 20) return "Early A1";
  if (score < 30) return "High A1";
  if (score < 60) return "A2";
  if (score < 80) return "Early B1";
  if (score < 100) return "High B1";
  if (score < 115) return "Early B2";
  if (score < 130) return "High B2";
  return "C1–C2";
}

export function deriveFrenchLearningSummary(
  profile: FrenchLearningProfile | null,
  sessions: readonly FrenchPracticeSession[],
  snapshots: readonly FrenchProgressSnapshot[],
): FrenchLearningSummary {
  const weekStart = getWeekStartKey();
  const weeklySessions = sessions.filter(
    (session) => session.occurredOn >= weekStart,
  );
  const minutesThisWeek = weeklySessions.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );
  const daysPracticedThisWeek = new Set(
    weeklySessions.map((session) => session.occurredOn),
  ).size;
  const minuteTarget = profile?.weeklyTargetMinutes ?? 75;
  const dayTarget = profile?.weeklyTargetDays ?? 5;
  const minuteRatio = Math.min(minutesThisWeek / Math.max(minuteTarget, 1), 1);
  const dayRatio = Math.min(daysPracticedThisWeek / Math.max(dayTarget, 1), 1);

  return {
    activity: minuteRatio * 0.55 + dayRatio * 0.45,
    currentLevel: getFrenchScoreLevel(profile?.duolingoScore ?? null),
    daysPracticedThisWeek,
    minutesThisWeek,
    profile,
    recentSessions: sessions.slice(0, 6),
    snapshots: snapshots.slice(0, 8),
  };
}
