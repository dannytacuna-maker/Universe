"use client";

import { useMemo, useState } from "react";

import { formatCourseScheduleSummary } from "./course-schedule";
import { UniversityAssignmentPanel } from "./university-assignment-panel";
import { UniversityDeadlineOverview } from "./university-deadline-overview";
import { UniversityGradePanel } from "./university-grade-panel";
import { UniversityNotePanel } from "./university-note-panel";
import type { UniversityCourseId } from "./university-record";
import { formatUniversityDeadline } from "./university-record-format";
import styles from "./university-operations-dashboard.module.css";
import { deriveUniversityOperationsSummary } from "./university-operations-summary";
import { universityCourseSystems } from "./university-course-systems";
import type { UniversityRecordsController } from "./use-university-records";

type UniversityOperationsDashboardProps = Readonly<{
  courseId?: UniversityCourseId | null;
  defaultExpanded?: boolean;
  isVisible: boolean;
  onCourseChange?: (courseId: UniversityCourseId) => void;
  records: UniversityRecordsController;
}>;

const initialCourseId = universityCourseSystems[0].id;

export function UniversityOperationsDashboard({
  courseId,
  defaultExpanded = false,
  isVisible,
  onCourseChange,
  records,
}: UniversityOperationsDashboardProps) {
  const [internalCourseId, setInternalCourseId] =
    useState<UniversityCourseId>(initialCourseId);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [summaryReferenceDate] = useState(() => new Date());
  const activeCourseId = courseId ?? internalCourseId;
  const activeCourse =
    universityCourseSystems.find((course) => course.id === activeCourseId) ??
    universityCourseSystems[0];
  const summary = useMemo(
    () =>
      deriveUniversityOperationsSummary(
        records.assignments,
        summaryReferenceDate,
      ),
    [records.assignments, summaryReferenceDate],
  );
  const courseAssignments = useMemo(
    () =>
      records.assignments.filter(
        (assignment) => assignment.courseId === activeCourse.id,
      ),
    [activeCourse.id, records.assignments],
  );
  const courseGrades = useMemo(
    () => records.grades.filter((grade) => grade.courseId === activeCourse.id),
    [activeCourse.id, records.grades],
  );
  const courseNotes = useMemo(
    () => records.notes.filter((note) => note.courseId === activeCourse.id),
    [activeCourse.id, records.notes],
  );
  const activeDeadline = summary.deadlines.find(
    ({ assignment }) => assignment.courseId === activeCourse.id,
  );

  if (!isVisible) {
    return null;
  }

  const selectCourse = (selectedCourseId: UniversityCourseId) => {
    setInternalCourseId(selectedCourseId);
    setIsExpanded(true);
    onCourseChange?.(selectedCourseId);
  };

  return (
    <aside
      aria-label="University operations"
      aria-busy={records.isLoading}
      className={styles.dashboard}
      data-expanded={isExpanded}
    >
      <header className={styles.dashboardHeader}>
        <div className={styles.headingIdentity}>
          <span aria-hidden="true" className={styles.orbitMark}>
            <i />
          </span>
          <div>
            <span>University operations</span>
            <strong>
              {records.isLoading
                ? "Opening academic records"
                : summary.overdueCount > 0
                  ? `${summary.overdueCount} deadline${summary.overdueCount === 1 ? "" : "s"} need attention`
                  : summary.deadlines[0] === undefined
                    ? "No open academic pressure"
                    : `${summary.upcomingCount} upcoming assignment${summary.upcomingCount === 1 ? "" : "s"}`}
            </strong>
          </div>
        </div>

        <div className={styles.headerMetrics} aria-label="University summary">
          <span data-alert={summary.overdueCount > 0}>
            <strong>{summary.overdueCount}</strong>
            Overdue
          </span>
          <span>
            <strong>{summary.upcomingCount}</strong>
            Upcoming
          </span>
          <span>
            <strong>{records.grades.length}</strong>
            Results
          </span>
        </div>

        <button
          aria-controls="university-operations-content"
          aria-expanded={isExpanded}
          className={styles.toggleButton}
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? "Minimize" : "Open records"}
        </button>
      </header>

      {isExpanded ? (
        <div
          className={styles.dashboardContent}
          id="university-operations-content"
        >
          {records.storageError !== null ? (
            <div className={styles.errorState} role="alert">
              <strong>University records are unavailable</strong>
              <p>{records.storageError}</p>
            </div>
          ) : null}

          <UniversityDeadlineOverview
            onSelectCourse={selectCourse}
            summary={summary}
          />

          <nav aria-label="University courses" className={styles.courseNav}>
            {universityCourseSystems.map((course) => {
              const openAssignments = records.assignments.filter(
                (assignment) =>
                  assignment.courseId === course.id &&
                  assignment.status !== "complete" &&
                  assignment.status !== "submitted",
              ).length;

              return (
                <button
                  aria-current={
                    course.id === activeCourse.id ? "page" : undefined
                  }
                  data-active={course.id === activeCourse.id}
                  key={course.id}
                  onClick={() => selectCourse(course.id)}
                  type="button"
                >
                  <span>{course.displayName}</span>
                  <small>
                    {openAssignments === 0
                      ? "Clear"
                      : `${openAssignments} open`}
                  </small>
                </button>
              );
            })}
          </nav>

          <section
            aria-labelledby="active-university-course-title"
            className={styles.courseWorkspace}
          >
            <header className={styles.courseHeader}>
              <div>
                <span>
                  {formatCourseScheduleSummary(activeCourse.schedule)}
                </span>
                <h2 id="active-university-course-title">
                  {activeCourse.displayName}
                </h2>
                <p>
                  {activeCourse.schedule.length === 0
                    ? "Independent work with no recurring class meeting."
                    : `Group ${activeCourse.schedule[0]?.group ?? "not recorded"} · ${activeCourse.name}`}
                </p>
              </div>
              {activeDeadline === undefined ? null : (
                <div className={styles.nextDeadline}>
                  <span>Next deadline</span>
                  <strong>
                    {formatUniversityDeadline(activeDeadline.assignment.dueAt)}
                  </strong>
                </div>
              )}
            </header>

            <div className={styles.courseGrid}>
              <UniversityAssignmentPanel
                assignments={courseAssignments}
                courseId={activeCourse.id}
                key={`assignments-${activeCourse.id}`}
                onAdd={records.addAssignment}
                onEdit={records.editAssignment}
                onRemove={records.removeAssignment}
              />
              <UniversityGradePanel
                courseId={activeCourse.id}
                grades={courseGrades}
                key={`grades-${activeCourse.id}`}
                onAdd={records.addGrade}
                onRemove={records.removeGrade}
              />
              <UniversityNotePanel
                courseId={activeCourse.id}
                key={`notes-${activeCourse.id}`}
                notes={courseNotes}
                onAdd={records.addNote}
                onRemove={records.removeNote}
              />
            </div>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
