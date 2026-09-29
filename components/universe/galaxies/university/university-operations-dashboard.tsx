"use client";

import { useMemo, useState, type CSSProperties } from "react";

import {
  MissionWorkspace,
  WorkspaceGrid,
  WorkspacePanel,
} from "@/components/ui/mission-workspace";

import { formatCourseScheduleSummary } from "./course-schedule";
import { UniversityAssignmentPanel } from "./university-assignment-panel";
import { UniversityDeadlineOverview } from "./university-deadline-overview";
import { UniversityGradePanel } from "./university-grade-panel";
import { UniversityNotePanel } from "./university-note-panel";
import type { UniversityCourseId } from "./university-record";
import { formatUniversityDeadline } from "./university-record-format";
import styles from "./university-operations-dashboard.module.css";
import {
  deriveUniversityGradeTrajectory,
  deriveUniversityOperationsSummary,
  isAssignmentResolved,
} from "./university-operations-summary";
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
  const overallTrajectory = useMemo(
    () => deriveUniversityGradeTrajectory(records.grades),
    [records.grades],
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
  const openAssignmentsByCourse = useMemo(() => {
    const counts = new Map<UniversityCourseId, number>();
    for (const assignment of records.assignments) {
      if (isAssignmentResolved(assignment)) continue;
      counts.set(
        assignment.courseId,
        (counts.get(assignment.courseId) ?? 0) + 1,
      );
    }
    return counts;
  }, [records.assignments]);
  const overdueCourseIds = useMemo(
    () =>
      new Set(
        summary.deadlines
          .filter((deadline) => deadline.urgency === "overdue")
          .map((deadline) => deadline.assignment.courseId),
      ),
    [summary.deadlines],
  );
  const activeDeadline = summary.deadlines.find(
    ({ assignment }) => assignment.courseId === activeCourse.id,
  );
  const dueThisWeek = summary.deadlines.filter(
    (deadline) => deadline.urgency === "upcoming" && deadline.daysFromNow <= 7,
  ).length;

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
      ? `${summary.overdueCount} overdue · ${summary.upcomingCount} upcoming`
      : summary.upcomingCount > 0
        ? `${summary.upcomingCount} upcoming deadlines`
        : "All coursework clear";

  return (
    <MissionWorkspace
      accent="120 199 225"
      description="Deadlines, coursework, results, and notes across every course system."
      eyebrow="University · Operations"
      isBusy={records.isLoading}
      isOpen={isExpanded}
      metrics={[
        {
          hint: summary.overdueCount > 0 ? "needs attention" : "none late",
          id: "overdue",
          label: "Overdue",
          tone: summary.overdueCount > 0 ? "alert" : "positive",
          value: summary.overdueCount,
        },
        {
          hint: `${summary.upcomingCount} open in total`,
          id: "week",
          label: "Due in 7 days",
          value: dueThisWeek,
        },
        {
          hint:
            overallTrajectory.method === "weighted" ? "weighted" : "recorded",
          id: "average",
          label: "Average result",
          value:
            overallTrajectory.averagePercent === null
              ? "—"
              : `${overallTrajectory.averagePercent.toFixed(1)}%`,
        },
        {
          hint: `${records.notes.length} notes`,
          id: "results",
          label: "Results logged",
          value: records.grades.length,
        },
      ]}
      onOpenChange={setIsExpanded}
      status={statusLine}
      surfaceId="university-operations"
      title="Academic command"
    >
      {records.storageError !== null ? (
        <div className={styles.errorState} role="alert">
          <strong>University records are unavailable</strong>
          <p>{records.storageError}</p>
        </div>
      ) : null}

      <WorkspaceGrid>
        <WorkspacePanel
          count={summary.deadlines.length}
          eyebrow="Across all courses"
          span={12}
          title="Deadline radar"
        >
          <UniversityDeadlineOverview
            onSelectCourse={selectCourse}
            summary={summary}
          />
        </WorkspacePanel>

        <WorkspacePanel eyebrow="Systems" span={3} title="Courses">
          <nav aria-label="University courses" className={styles.courseRail}>
            {universityCourseSystems.map((course) => {
              const openAssignments =
                openAssignmentsByCourse.get(course.id) ?? 0;
              const isActive = course.id === activeCourse.id;

              return (
                <button
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive}
                  data-overdue={overdueCourseIds.has(course.id)}
                  key={course.id}
                  onClick={() => selectCourse(course.id)}
                  style={
                    { "--course-color": course.palette.halo } as CSSProperties
                  }
                  type="button"
                >
                  <i aria-hidden="true" />
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
        </WorkspacePanel>

        <section
          aria-labelledby="active-university-course-title"
          className={styles.courseStage}
          style={
            { "--course-color": activeCourse.palette.halo } as CSSProperties
          }
        >
          <header className={styles.courseHeader}>
            <div>
              <span>{formatCourseScheduleSummary(activeCourse.schedule)}</span>
              <h2 id="active-university-course-title">
                {activeCourse.displayName}
              </h2>
            </div>
            <div className={styles.nextDeadline}>
              <span>Next deadline</span>
              <strong>
                {activeDeadline === undefined
                  ? "Nothing due"
                  : formatUniversityDeadline(activeDeadline.assignment.dueAt)}
              </strong>
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
      </WorkspaceGrid>
    </MissionWorkspace>
  );
}
