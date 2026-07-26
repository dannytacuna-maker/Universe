import type { JiuJitsuProgress } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-progress";
import type { ReadingSession } from "./galaxies/personal-growth/reading/reading-record";
import type { ReadingSummary } from "./galaxies/personal-growth/reading/reading-summary";
import type { StrengthProgress } from "./galaxies/personal-growth/strength-physique/strength-physique-progress";
import type {
  UniversityAssignment,
  UniversityCourseId,
  UniversityGrade,
  UniversityNote,
} from "./galaxies/university/university-record";
import { universityCourseSystems } from "./galaxies/university/university-course-systems";

export type UniverseActivitySignal = Readonly<{
  activity: number;
  attention: number;
  state: "error" | "loading" | "ready";
}>;

export type UniverseActivitySignals = Readonly<{
  galaxy: Readonly<{
    personalGrowth: number;
    university: number;
  }>;
  personalGrowth: Readonly<{
    "jiu-jitsu": UniverseActivitySignal;
    reading: UniverseActivitySignal;
    "strength-physique": UniverseActivitySignal;
  }>;
  university: Readonly<Record<UniversityCourseId, UniverseActivitySignal>>;
}>;

type ActivityLoadState = Readonly<{
  error: string | null;
  loading: boolean;
}>;

type UniverseActivityInput = Readonly<{
  jiuJitsu: ActivityLoadState & Readonly<{ progress: JiuJitsuProgress }>;
  reading: ActivityLoadState &
    Readonly<{
      sessions: readonly ReadingSession[];
      summary: ReadingSummary;
    }>;
  strength: ActivityLoadState & Readonly<{ progress: StrengthProgress }>;
  university: ActivityLoadState &
    Readonly<{
      assignments: readonly UniversityAssignment[];
      grades: readonly UniversityGrade[];
      notes: readonly UniversityNote[];
    }>;
}>;

const neutralActivity = 0.34;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function signal(
  loadState: ActivityLoadState,
  activity: number,
  attention = 0,
): UniverseActivitySignal {
  if (loadState.loading) {
    return { activity: neutralActivity, attention: 0, state: "loading" };
  }

  if (loadState.error !== null) {
    return { activity: neutralActivity, attention: 0, state: "error" };
  }

  return {
    activity: clamp(activity),
    attention: clamp(attention),
    state: "ready",
  };
}

function average(values: readonly number[]) {
  return values.length === 0
    ? neutralActivity
    : values.reduce((total, value) => total + value, 0) / values.length;
}

export function deriveUniverseActivitySignals(
  input: UniverseActivityInput,
): UniverseActivitySignals {
  const jiuJitsu = signal(
    input.jiuJitsu,
    input.jiuJitsu.progress.recentAttention,
  );
  const strength = signal(
    input.strength,
    input.strength.progress.weeklyCompletionRatio,
  );
  const latestReadingDate = input.reading.sessions[0]?.occurredOn;
  const recentReading =
    latestReadingDate === undefined
      ? 0
      : Math.max(
          0,
          1 -
            (Date.now() - new Date(`${latestReadingDate}T12:00:00`).getTime()) /
              (14 * 24 * 60 * 60 * 1000),
        );
  const reading = signal(
    input.reading,
    Math.min(input.reading.summary.timeThisWeekMinutes / 150, 1) * 0.72 +
      recentReading * 0.28,
  );
  const universityEntries = universityCourseSystems.map((course) => {
    const assignments = input.university.assignments.filter(
      (assignment) => assignment.courseId === course.id,
    );
    const now = Date.now();
    const recentCutoff = now - 14 * 24 * 60 * 60 * 1000;
    const recentRecordCount = [
      ...assignments,
      ...input.university.grades.filter(
        (grade) => grade.courseId === course.id,
      ),
      ...input.university.notes.filter((note) => note.courseId === course.id),
    ].filter((entry) => Date.parse(entry.updatedAt) >= recentCutoff).length;
    const openAssignments = assignments.filter(
      (assignment) =>
        assignment.status !== "complete" && assignment.status !== "submitted",
    );
    const overdueCount = openAssignments.filter(
      (assignment) => Date.parse(assignment.dueAt) < now,
    ).length;
    const dueSoonCount = openAssignments.filter((assignment) => {
      const dueAt = Date.parse(assignment.dueAt);
      return dueAt >= now && dueAt <= now + 7 * 24 * 60 * 60 * 1000;
    }).length;

    return [
      course.id,
      signal(
        input.university,
        Math.min(recentRecordCount / 4, 1),
        Math.min(overdueCount * 0.5 + dueSoonCount * 0.22, 1),
      ),
    ] as const;
  });
  const university = Object.fromEntries(universityEntries) as Record<
    UniversityCourseId,
    UniverseActivitySignal
  >;

  return {
    galaxy: {
      personalGrowth: average([
        jiuJitsu.activity,
        reading.activity,
        strength.activity,
      ]),
      university: average(
        universityCourseSystems.map((course) => university[course.id].activity),
      ),
    },
    personalGrowth: {
      "jiu-jitsu": jiuJitsu,
      reading,
      "strength-physique": strength,
    },
    university,
  };
}
