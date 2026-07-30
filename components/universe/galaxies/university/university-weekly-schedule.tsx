"use client";

import { useEffect, useState } from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";

import type {
  CourseMeeting,
  CourseSystemDefinition,
  CourseWeekday,
} from "./course-system-definition";
import { universityCourseSystems } from "./university-course-systems";

type ScheduledCourseMeeting = Readonly<{
  courseId: string;
  courseName: string;
  courseStatus: CourseSystemDefinition["status"];
  meeting: CourseMeeting;
}>;

type UniversityWeeklyScheduleProps = Readonly<{
  emphasizedCourseId: string | null;
  onActivate: (courseId: string) => void;
  onFocusChange: (courseId: string | null) => void;
  onHoverChange: (courseId: string | null) => void;
}>;

const weekdays = [
  { fullName: "Monday", shortName: "Mon", value: "monday" },
  { fullName: "Tuesday", shortName: "Tue", value: "tuesday" },
  { fullName: "Wednesday", shortName: "Wed", value: "wednesday" },
  { fullName: "Thursday", shortName: "Thu", value: "thursday" },
  { fullName: "Friday", shortName: "Fri", value: "friday" },
] as const satisfies readonly Readonly<{
  fullName: string;
  shortName: string;
  value: CourseWeekday;
}>[];

const scheduledMeetings = universityCourseSystems
  .flatMap((course) =>
    course.schedule.map((meeting): ScheduledCourseMeeting => ({
      courseId: course.id,
      courseName: course.displayName,
      courseStatus: course.status,
      meeting,
    })),
  )
  .sort((first, second) =>
    first.meeting.startTime.localeCompare(second.meeting.startTime),
  );

export function UniversityWeeklySchedule({
  emphasizedCourseId,
  onActivate,
  onFocusChange,
  onHoverChange,
}: UniversityWeeklyScheduleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId === "university-schedule") return;
        setIsExpanded(false);
      }),
    [],
  );

  const toggleExpanded = () => {
    setIsExpanded((current) => {
      const next = !current;
      if (next) activateInterfaceSurface("university-schedule");
      return next;
    });
  };

  return (
    <section
      aria-labelledby="university-weekly-schedule-title"
      className="university-weekly-schedule"
      data-expanded={isExpanded}
    >
      <header>
        <div>
          <span>University orbit</span>
          <h2 id="university-weekly-schedule-title">Weekly schedule</h2>
        </div>
        <div className="university-weekly-schedule__actions">
          {isExpanded ? <p>Rooms and groups</p> : null}
          <button
            aria-controls="university-weekly-schedule-content"
            aria-expanded={isExpanded}
            className="university-weekly-schedule__toggle"
            onClick={toggleExpanded}
            type="button"
          >
            {isExpanded ? "Minimize" : "Open schedule"}
          </button>
        </div>
      </header>

      {isExpanded ? (
        <div
          className="university-weekly-schedule__scroll"
          id="university-weekly-schedule-content"
          tabIndex={0}
        >
          <table>
            <caption className="sr-only">
              Weekly University class schedule with times, rooms, and groups.
            </caption>
            <thead>
              <tr>
                {weekdays.map((weekday) => (
                  <th key={weekday.value} scope="col">
                    <span aria-hidden="true">{weekday.shortName}</span>
                    <span className="sr-only">{weekday.fullName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {weekdays.map((weekday) => {
                  const meetings = scheduledMeetings.filter(
                    ({ meeting }) => meeting.day === weekday.value,
                  );

                  return (
                    <td data-day={weekday.fullName} key={weekday.value}>
                      {meetings.length > 0 ? (
                        <ul>
                          {meetings.map(
                            ({
                              courseId,
                              courseName,
                              courseStatus,
                              meeting,
                            }) => (
                              <li
                                key={`${weekday.value}-${meeting.startTime}-${courseName}-${meeting.room}`}
                              >
                                <button
                                  aria-label={`${courseName}, ${weekday.fullName} ${meeting.startTime} to ${meeting.endTime}, room ${meeting.room}, group ${meeting.group}`}
                                  className="university-weekly-schedule__meeting"
                                  data-emphasized={
                                    emphasizedCourseId === courseId
                                  }
                                  data-status={courseStatus}
                                  onBlur={() => onFocusChange(null)}
                                  onClick={() => onActivate(courseId)}
                                  onFocus={() => onFocusChange(courseId)}
                                  onMouseEnter={() => onHoverChange(courseId)}
                                  onMouseLeave={() => onHoverChange(null)}
                                  type="button"
                                >
                                  <time>
                                    {meeting.startTime}–{meeting.endTime}
                                  </time>
                                  <strong>{courseName}</strong>
                                  <span>
                                    {meeting.room} · {meeting.group}
                                  </span>
                                </button>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <span className="university-weekly-schedule__empty">
                          No class
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
