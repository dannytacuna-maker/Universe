import type {
  UniversityAssignment,
  UniversityGrade,
} from "./university-record";

const millisecondsPerDay = 86_400_000;
const madridCalendarFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  timeZone: "Europe/Madrid",
  year: "numeric",
});

export type UniversityDeadlineSignal = Readonly<{
  assignment: UniversityAssignment;
  daysFromNow: number;
  urgency: "overdue" | "upcoming";
}>;

export type UniversityGradeTrajectory = Readonly<{
  averagePercent: number | null;
  deltaFromPrevious: number | null;
  latestPercent: number | null;
  method: "recorded" | "weighted";
  recordedWeightPercent: number | null;
}>;

export type UniversityOperationsSummary = Readonly<{
  deadlines: readonly UniversityDeadlineSignal[];
  overdueCount: number;
  upcomingCount: number;
}>;

export function isAssignmentResolved(assignment: UniversityAssignment) {
  return assignment.status === "complete" || assignment.status === "submitted";
}

function getMadridCalendarDay(date: Date) {
  const parts = madridCalendarFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return (
    Date.UTC(value("year"), value("month") - 1, value("day")) /
    millisecondsPerDay
  );
}

export function deriveUniversityOperationsSummary(
  assignments: readonly UniversityAssignment[],
  now = new Date(),
): UniversityOperationsSummary {
  const nowTime = now.getTime();
  const deadlines = assignments
    .filter((assignment) => !isAssignmentResolved(assignment))
    .map((assignment): UniversityDeadlineSignal => {
      const deadline = new Date(assignment.dueAt);
      const difference = deadline.getTime() - nowTime;

      return {
        assignment,
        daysFromNow: getMadridCalendarDay(deadline) - getMadridCalendarDay(now),
        urgency: difference < 0 ? "overdue" : "upcoming",
      };
    })
    .toSorted((first, second) =>
      first.assignment.dueAt.localeCompare(second.assignment.dueAt),
    );

  return {
    deadlines,
    overdueCount: deadlines.filter((item) => item.urgency === "overdue").length,
    upcomingCount: deadlines.filter((item) => item.urgency === "upcoming")
      .length,
  };
}

function asPercent(grade: UniversityGrade) {
  return (grade.score / grade.maximumScore) * 100;
}

export function deriveUniversityGradeTrajectory(
  grades: readonly UniversityGrade[],
): UniversityGradeTrajectory {
  if (grades.length === 0) {
    return {
      averagePercent: null,
      deltaFromPrevious: null,
      latestPercent: null,
      method: "recorded",
      recordedWeightPercent: null,
    };
  }

  const chronological = grades.toSorted((first, second) =>
    first.occurredOn.localeCompare(second.occurredOn),
  );
  const percentages = chronological.map(asPercent);
  const allGradesAreWeighted = grades.every(
    (grade) => grade.weightPercent !== null,
  );
  const recordedWeightPercent = allGradesAreWeighted
    ? grades.reduce((total, grade) => total + (grade.weightPercent ?? 0), 0)
    : null;
  const canUseWeightedAverage =
    recordedWeightPercent !== null && recordedWeightPercent > 0;
  const averagePercent = canUseWeightedAverage
    ? grades.reduce(
        (total, grade) => total + asPercent(grade) * (grade.weightPercent ?? 0),
        0,
      ) / recordedWeightPercent
    : percentages.reduce((total, percentage) => total + percentage, 0) /
      percentages.length;
  const latestPercent = percentages.at(-1) ?? null;
  const previousPercent = percentages.at(-2) ?? null;

  return {
    averagePercent,
    deltaFromPrevious:
      latestPercent === null || previousPercent === null
        ? null
        : latestPercent - previousPercent,
    latestPercent,
    method: canUseWeightedAverage ? "weighted" : "recorded",
    recordedWeightPercent,
  };
}
