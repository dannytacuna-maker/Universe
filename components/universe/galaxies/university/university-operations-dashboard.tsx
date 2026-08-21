"use client";

import { useEffect, useMemo, useState } from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";

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

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId !== "university-operations") setIsExpanded(false);
      }),
    [],
  );

  if (!isVisible) {
    return null;
  }

  const selectCourse = (selectedCourseId: UniversityCourseId) => {
    setInternalCourseId(selectedCourseId);
    setIsExpanded(true);
    onCourseChange?.(selectedCourseId);
  };

  const statusLine = records.isLoading
    ? "Opening records"
    : summary.overdueCount > 0
      ? `${summary.overdueCount} overdue`
      : summary.upcomingCount > 0
        ? `${summary.upcomingCount} upcoming`
        : "Clear";

  return (
    <aside
      aria-label="University operations"
      aria-busy={records.isLoading}
      className={styles.dashboard}
      data-expanded={isExpanded}
    >
      <header className={styles.dashboardHeader}>
        <div className={styles.headingIdentity}>
          <div>
            <span>University</span>
            <strong>{statusLine}</strong>
          </div>
        </div>

        <button
          aria-controls="university-operations-content"
          aria-expanded={isExpanded}
          className={styles.toggleButton}
          onClick={() =>
            setIsExpanded((current) => {
              const next = !current;
              if (next) activateInterfaceSurface("university-operations");
              return next;
            })
          }
          type="button"
        >
          {isExpanded ? "Close" : "Open"}
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

          <p className={styles.pulse} aria-label="University summary">
            <strong>{summary.overdueCount}</strong> overdue
            <span aria-hidden="true">·</span>
            <strong>{summary.upcomingCount}</strong> upcoming
            <span aria-hidden="true">·</span>
            <strong>{records.grades.length}</strong> results
          </p>

          <details
            className={styles.attention}
            open={summary.deadlines.length > 0}
          >
            <summary>
              Attention
              <span>{summary.deadlines.length}</span>
            </summary>
            <UniversityDeadlineOverview
              onSelectCourse={selectCourse}
              summary={summary}
            />
          </details>

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
                {activeDeadline === undefined ? null : (
                  <p>
                    Next deadline{" "}
                    {formatUniversityDeadline(activeDeadline.assignment.dueAt)}
                  </p>
                )}
              </div>
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
              <details className={styles.secondaryPanel} open={courseGrades.length > 0}>
                <summary>
                  Grades
                  <span>{courseGrades.length}</span>
                </summary>
                <UniversityGradePanel
                  courseId={activeCourse.id}
                  grades={courseGrades}
                  key={`grades-${activeCourse.id}`}
                  onAdd={records.addGrade}
                  onRemove={records.removeGrade}
                />
              </details>
              <details className={styles.secondaryPanel} open={courseNotes.length > 0}>
                <summary>
                  Notes
                  <span>{courseNotes.length}</span>
                </summary>
                <UniversityNotePanel
                  courseId={activeCourse.id}
                  key={`notes-${activeCourse.id}`}
                  notes={courseNotes}
                  onAdd={records.addNote}
                  onRemove={records.removeNote}
                />
              </details>
            </div>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
