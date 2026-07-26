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

  return (
    <section
      aria-labelledby="university-deadline-overview-title"
      className={styles.deadlineOverview}
    >
      <header className={styles.sectionHeading}>
        <div>
          <span>Pressure map</span>
          <h3 id="university-deadline-overview-title">What needs attention</h3>
        </div>
        <p>
          {summary.overdueCount > 0
            ? `${summary.overdueCount} overdue`
            : `${summary.upcomingCount} upcoming`}
        </p>
      </header>

      {visibleDeadlines.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>No open deadlines</strong>
          <p>Assignments will appear here as soon as you add them.</p>
        </div>
      ) : (
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
      )}
    </section>
  );
}
