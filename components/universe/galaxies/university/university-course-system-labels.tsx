"use client";

import type { CSSProperties } from "react";

import {
  formatCourseScheduleDetails,
  formatCourseScheduleSummary,
} from "./course-schedule";
import { universityCourseSystems } from "./university-course-systems";

type CourseLabelStyle = CSSProperties & {
  "--course-label-compact-x": string;
  "--course-label-compact-y": string;
  "--course-label-portrait-x": string;
  "--course-label-portrait-y": string;
  "--course-label-x": string;
  "--course-label-y": string;
};

type UniversityCourseSystemLabelsProps = Readonly<{
  emphasizedCourseId: string | null;
  isVisible: boolean;
  onActivate: (courseId: string) => void;
  onFocusChange: (courseId: string | null) => void;
  onHoverChange: (courseId: string | null) => void;
}>;

function createLabelStyle(
  desktop: readonly [number, number],
  portrait: readonly [number, number],
  compact: readonly [number, number],
): CourseLabelStyle {
  return {
    "--course-label-compact-x": `${compact[0]}%`,
    "--course-label-compact-y": `${compact[1]}%`,
    "--course-label-portrait-x": `${portrait[0]}%`,
    "--course-label-portrait-y": `${portrait[1]}%`,
    "--course-label-x": `${desktop[0]}%`,
    "--course-label-y": `${desktop[1]}%`,
  };
}

export function UniversityCourseSystemLabels({
  emphasizedCourseId,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: UniversityCourseSystemLabelsProps) {
  return (
    <div aria-hidden={!isVisible} className="course-system-labels">
      {universityCourseSystems.map((definition) => {
        const descriptionId = `${definition.id}-course-description`;

        return (
          <button
            aria-describedby={descriptionId}
            aria-hidden={!isVisible}
            aria-label={definition.name}
            className="course-system-label"
            data-emphasized={emphasizedCourseId === definition.id}
            data-spatial-anchor={`system:${definition.id}`}
            data-status={definition.status}
            data-visible={isVisible}
            key={definition.id}
            onBlur={() => onFocusChange(null)}
            onClick={() => onActivate(definition.id)}
            onFocus={() => onFocusChange(definition.id)}
            onMouseEnter={() => onHoverChange(definition.id)}
            onMouseLeave={() => onHoverChange(null)}
            style={createLabelStyle(
              definition.labelPosition.desktop,
              definition.labelPosition.portrait,
              definition.labelPosition.compact,
            )}
            tabIndex={isVisible ? 0 : -1}
            type="button"
          >
            <span className="course-system-label__name">
              {definition.displayName}
            </span>
            <span aria-hidden="true" className="course-system-label__preview">
              {formatCourseScheduleSummary(definition.schedule)}
            </span>
            <span className="sr-only" id={descriptionId}>
              {definition.status === "explorable"
                ? "Explorable University course system. "
                : "Future University course destination. Exploration is not available yet. "}
              {formatCourseScheduleDetails(definition.schedule)}.
            </span>
          </button>
        );
      })}
    </div>
  );
}
