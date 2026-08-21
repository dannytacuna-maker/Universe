"use client";

import type { UniversityCourseId } from "./university-record";
import {
  describeDeadlineDistance,
  formatUniversityDeadline,
} from "./university-record-format";
import type { UniversityOperationsSummary } from "./university-operations-summary";
import styles from "./university-operations-dashboard.module.css";
import { universityCourseSystems } from "./university-course-systems";

type UniversityDeadlineOverviewProps = Readonly<{
  onSelectCourse: (courseId: UniversityCourseId) => void;
  summary: UniversityOperationsSummary;
}>;

export function UniversityDeadlineOverview({
  onSelectCourse,
  summary,
}: UniversityDeadlineOverviewProps) {
  const visibleDeadlines = summary.deadlines.slice(0, 6);

  if (visibleDeadlines.length === 0) {
    return (
      <div className={styles.emptyState}>
        <strong>No open deadlines</strong>
        <p>Assignments appear here when you add them.</p>
      </div>
    );
  }

  return (
    <ol className={styles.deadlineList}>
      {visibleDeadlines.map(({ assignment, daysFromNow, urgency }) => {
        const course = universityCourseSystems.find(
          (candidate) => candidate.id === assignment.courseId,
        );

        return (
          <li data-urgency={urgency} key={assignment.id}>
            <button
              onClick={() => onSelectCourse(assignment.courseId)}
              type="button"
            >
              <span className={styles.deadlineMarker} aria-hidden="true" />
              <span>
                <small>{course?.displayName ?? assignment.courseId}</small>
                <strong>{assignment.title}</strong>
              </span>
              <span className={styles.deadlineTime}>
                <strong>
                  {describeDeadlineDistance(
                    daysFromNow,
                    urgency === "overdue",
                  )}
                </strong>
                <time dateTime={assignment.dueAt}>
                  {formatUniversityDeadline(assignment.dueAt)}
                </time>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
