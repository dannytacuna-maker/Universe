"use client";

import { CourseStarSystem } from "./course-star-system";
import { universityCourseSystems } from "./university-course-systems";
import type { UniverseActivitySignals } from "../../universe-activity";

type UniversityCourseSystemGroupProps = Readonly<{
  activeCourseId: string | null;
  emphasizedCourseId: string | null;
  hoveredCourseId: string | null;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: (courseId: string) => void;
  onHoverChange: (courseId: string | null) => void;
  signals: UniverseActivitySignals["university"];
}>;

export function UniversityCourseSystemGroup({
  activeCourseId,
  emphasizedCourseId,
  hoveredCourseId,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
  signals,
}: UniversityCourseSystemGroupProps) {
  return universityCourseSystems.map((definition) => (
    <CourseStarSystem
      definition={definition}
      isActive={activeCourseId === definition.id}
      isEmphasized={emphasizedCourseId === definition.id}
      isHovered={hoveredCourseId === definition.id}
      isInteractive={isInteractive}
      isVisible={
        isVisible &&
        (activeCourseId === null || activeCourseId === definition.id)
      }
      key={definition.id}
      motionEnabled={motionEnabled}
      onActivate={onActivate}
      onHoverChange={onHoverChange}
      signal={signals[definition.id]}
    />
  ));
}
