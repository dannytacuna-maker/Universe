import type { FrenchPracticeSession } from "@/components/universe/galaxies/personal-growth/french/french-learning-record";
import type { JiuJitsuSession } from "@/components/universe/galaxies/personal-growth/jiu-jitsu/jiu-jitsu-session";
import type {
  ReadingBook,
  ReadingSession,
} from "@/components/universe/galaxies/personal-growth/reading/reading-record";
import type { StrengthTrainingSession } from "@/components/universe/galaxies/personal-growth/strength-physique/strength-physique-record";
import type { UniversityNote } from "@/components/universe/galaxies/university/university-record";
import { universityCourseSystems } from "@/components/universe/galaxies/university/university-course-systems";

export type MissionReflectionSystem =
  "french" | "jiu-jitsu" | "reading" | "strength-physique" | "university";

export type MissionReflectionEntry = Readonly<{
  date: string;
  id: string;
  label: string;
  system: MissionReflectionSystem;
  text: string;
  topic: string;
}>;

export type MissionPattern = Readonly<{
  detail: string;
  id: string;
  statement: string;
}>;

export type MissionIdentityEvidence = Readonly<{
  activeSystemCount: number;
  statements: readonly string[];
}>;

export type MissionIntelligence = Readonly<{
  activityDates: Readonly<
    Partial<
      Record<
        "french" | "jiu-jitsu" | "reading" | "strength-physique" | "university",
        readonly string[]
      >
    >
  >;
  identityEvidence: MissionIdentityEvidence;
  patterns: readonly MissionPattern[];
  reflections: readonly MissionReflectionEntry[];
}>;

type MissionIntelligenceInput = Readonly<{
  frenchSessions: readonly FrenchPracticeSession[];
  jiuJitsuSessions: readonly JiuJitsuSession[];
  readingBooks: readonly ReadingBook[];
  readingSessions: readonly ReadingSession[];
  strengthSessions: readonly StrengthTrainingSession[];
  universityNotes: readonly UniversityNote[];
}>;

type WeeklyActivity = {
  frenchMinutes: number;
  jiuJitsu: number;
  readingMinutes: number;
  strength: number;
};

function getMondayKey(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  const weekday = date.getDay();
  date.setDate(date.getDate() - (weekday === 0 ? 6 : weekday - 1));
  return date.toISOString().slice(0, 10);
}

function addWeeks(value: string, weeks: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

function correlation(first: readonly number[], second: readonly number[]) {
  const count = first.length;
  const firstMean = first.reduce((sum, value) => sum + value, 0) / count;
  const secondMean = second.reduce((sum, value) => sum + value, 0) / count;
  let covariance = 0;
  let firstVariance = 0;
  let secondVariance = 0;

  for (let index = 0; index < count; index += 1) {
    const firstDelta = (first[index] ?? 0) - firstMean;
    const secondDelta = (second[index] ?? 0) - secondMean;
    covariance += firstDelta * secondDelta;
    firstVariance += firstDelta ** 2;
    secondVariance += secondDelta ** 2;
  }

  if (firstVariance === 0 || secondVariance === 0) {
    return null;
  }

  return covariance / Math.sqrt(firstVariance * secondVariance);
}

function buildPatterns(input: MissionIntelligenceInput) {
  const datedActivity = [
    ...input.frenchSessions.map((session) => session.occurredOn),
    ...input.jiuJitsuSessions.map((session) => session.occurredOn),
    ...input.readingSessions.map((session) => session.occurredOn),
    ...input.strengthSessions.map((session) => session.occurredOn),
  ].toSorted();

  if (datedActivity.length === 0) {
    return [];
  }

  const earliestWeek = getMondayKey(datedActivity[0] ?? "");
  const lastWeek = getMondayKey(datedActivity.at(-1) ?? "");
  const recentWindowStart = addWeeks(lastWeek, -25);
  const firstWeek =
    earliestWeek > recentWindowStart ? earliestWeek : recentWindowStart;
  const weeks: string[] = [];

  for (
    let week = firstWeek;
    week <= lastWeek && weeks.length < 26;
    week = addWeeks(week, 1)
  ) {
    weeks.push(week);
  }

  if (weeks.length < 6) {
    return [];
  }

  const activity = new Map<string, WeeklyActivity>(
    weeks.map((week) => [
      week,
      { frenchMinutes: 0, jiuJitsu: 0, readingMinutes: 0, strength: 0 },
    ]),
  );

  for (const session of input.frenchSessions) {
    const entry = activity.get(getMondayKey(session.occurredOn));
    if (entry !== undefined) entry.frenchMinutes += session.durationMinutes;
  }

  for (const session of input.jiuJitsuSessions) {
    const entry = activity.get(getMondayKey(session.occurredOn));
    if (entry !== undefined) entry.jiuJitsu += 1;
  }

  for (const session of input.readingSessions) {
    const entry = activity.get(getMondayKey(session.occurredOn));
    if (entry !== undefined) entry.readingMinutes += session.durationMinutes;
  }

  for (const session of input.strengthSessions) {
    const entry = activity.get(getMondayKey(session.occurredOn));
    if (entry !== undefined) entry.strength += 1;
  }

  const values = weeks.map(
    (week) =>
      activity.get(week) ?? {
        frenchMinutes: 0,
        jiuJitsu: 0,
        readingMinutes: 0,
        strength: 0,
      },
  );
  const candidates = [
    {
      first: values.map((entry) => entry.frenchMinutes),
      firstLabel: "French practice",
      id: "french-reading",
      second: values.map((entry) => entry.readingMinutes),
      secondLabel: "reading time",
    },
    {
      first: values.map((entry) => entry.readingMinutes),
      firstLabel: "reading time",
      id: "reading-jiu-jitsu",
      second: values.map((entry) => entry.jiuJitsu),
      secondLabel: "Jiu-Jitsu attendance",
    },
    {
      first: values.map((entry) => entry.strength),
      firstLabel: "strength sessions",
      id: "strength-jiu-jitsu",
      second: values.map((entry) => entry.jiuJitsu),
      secondLabel: "Jiu-Jitsu attendance",
    },
    {
      first: values.map((entry) => entry.readingMinutes),
      firstLabel: "reading time",
      id: "reading-strength",
      second: values.map((entry) => entry.strength),
      secondLabel: "strength sessions",
    },
  ];

  return candidates
    .flatMap((candidate): MissionPattern[] => {
      const coefficient = correlation(candidate.first, candidate.second);

      if (coefficient === null || Math.abs(coefficient) < 0.6) {
        return [];
      }

      return [
        {
          detail: `${weeks.length} complete logged weeks · association ${coefficient.toFixed(2)} · not a causal claim`,
          id: candidate.id,
          statement:
            coefficient > 0
              ? `${candidate.firstLabel} and ${candidate.secondLabel} have tended to rise and fall together.`
              : `${candidate.firstLabel} and ${candidate.secondLabel} have tended to move in opposite directions.`,
        },
      ];
    })
    .toSorted((first, second) => first.id.localeCompare(second.id))
    .slice(0, 2);
}

function buildReflections(input: MissionIntelligenceInput) {
  const bookNames = new Map(
    input.readingBooks.map((book) => [book.id, book.title]),
  );
  const courseNames = new Map(
    universityCourseSystems.map((course) => [course.id, course.displayName]),
  );
  const reflections: MissionReflectionEntry[] = [];

  for (const session of input.frenchSessions) {
    if (session.reflection.length > 0) {
      reflections.push({
        date: session.occurredOn,
        id: `french:${session.id}`,
        label: "French",
        system: "french",
        text: session.reflection,
        topic: `${session.focus} practice`,
      });
    }
  }

  for (const session of input.jiuJitsuSessions) {
    const text = [session.reflection, session.notes].filter(Boolean).join("\n");
    if (text.length > 0) {
      reflections.push({
        date: session.occurredOn,
        id: `jiu-jitsu:${session.id}`,
        label: "Jiu-Jitsu",
        system: "jiu-jitsu",
        text,
        topic: session.techniques.join(", ") || "Training session",
      });
    }
  }

  for (const session of input.readingSessions) {
    if (session.reflection.length > 0) {
      reflections.push({
        date: session.occurredOn,
        id: `reading:${session.id}`,
        label: "Reading",
        system: "reading",
        text: session.reflection,
        topic: bookNames.get(session.bookId) ?? "Reading session",
      });
    }
  }

  for (const session of input.strengthSessions) {
    const text = [session.reflection, session.physiqueNotes, session.notes]
      .filter(Boolean)
      .join("\n");
    if (text.length > 0) {
      reflections.push({
        date: session.occurredOn,
        id: `strength:${session.id}`,
        label: "Strength & Physique",
        system: "strength-physique",
        text,
        topic: `${session.focus} session`,
      });
    }
  }

  for (const note of input.universityNotes) {
    if (note.content.length > 0) {
      reflections.push({
        date: note.createdAt.slice(0, 10),
        id: `university:${note.id}`,
        label: "University",
        system: "university",
        text: note.content,
        topic: courseNames.get(note.courseId) ?? "Course note",
      });
    }
  }

  return reflections.toSorted(
    (first, second) =>
      second.date.localeCompare(first.date) ||
      second.id.localeCompare(first.id),
  );
}

function buildIdentityEvidence(input: MissionIntelligenceInput) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const frenchMinutes = input.frenchSessions
    .filter((session) => session.occurredOn >= cutoffKey)
    .reduce((total, session) => total + session.durationMinutes, 0);
  const jiuJitsuCount = input.jiuJitsuSessions.filter(
    (session) => session.occurredOn >= cutoffKey,
  ).length;
  const readingMinutes = input.readingSessions
    .filter((session) => session.occurredOn >= cutoffKey)
    .reduce((total, session) => total + session.durationMinutes, 0);
  const strengthCount = input.strengthSessions.filter(
    (session) => session.occurredOn >= cutoffKey,
  ).length;
  const universityReflectionCount = input.universityNotes.filter(
    (note) => note.createdAt.slice(0, 10) >= cutoffKey,
  ).length;
  const statements = [
    frenchMinutes > 0 ? `${frenchMinutes} minutes of French practiced` : null,
    jiuJitsuCount > 0
      ? `${jiuJitsuCount} Jiu-Jitsu ${jiuJitsuCount === 1 ? "session" : "sessions"} practiced`
      : null,
    strengthCount > 0
      ? `${strengthCount} strength ${strengthCount === 1 ? "session" : "sessions"} completed`
      : null,
    readingMinutes > 0 ? `${readingMinutes} minutes read with intention` : null,
    universityReflectionCount > 0
      ? `${universityReflectionCount} university notes or reflections captured`
      : null,
  ].filter((value): value is string => value !== null);

  return { activeSystemCount: statements.length, statements };
}

export function buildMissionIntelligence(
  input: MissionIntelligenceInput,
): MissionIntelligence {
  return {
    activityDates: {
      french: [
        ...new Set(input.frenchSessions.map((session) => session.occurredOn)),
      ],
      "jiu-jitsu": [
        ...new Set(input.jiuJitsuSessions.map((session) => session.occurredOn)),
      ],
      reading: [
        ...new Set(input.readingSessions.map((session) => session.occurredOn)),
      ],
      "strength-physique": [
        ...new Set(input.strengthSessions.map((session) => session.occurredOn)),
      ],
      university: [
        ...new Set(
          input.universityNotes.map((note) => note.createdAt.slice(0, 10)),
        ),
      ],
    },
    identityEvidence: buildIdentityEvidence(input),
    patterns: buildPatterns(input),
    reflections: buildReflections(input),
  };
}
