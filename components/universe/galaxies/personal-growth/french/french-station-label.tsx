"use client";

import type { CSSProperties } from "react";

import { frenchStationDefinition } from "./french-station-definition";

type StationLabelStyle = CSSProperties & {
  "--course-label-compact-x": string;
  "--course-label-compact-y": string;
  "--course-label-portrait-x": string;
  "--course-label-portrait-y": string;
  "--course-label-x": string;
  "--course-label-y": string;
};

type FrenchStationLabelProps = Readonly<{
  isEmphasized: boolean;
  isVisible: boolean;
  onActivate: () => void;
  onFocusChange: (isFocused: boolean) => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

const labelStyle: StationLabelStyle = {
  "--course-label-compact-x": `${frenchStationDefinition.labelPosition.compact[0]}%`,
  "--course-label-compact-y": `${frenchStationDefinition.labelPosition.compact[1]}%`,
  "--course-label-portrait-x": `${frenchStationDefinition.labelPosition.portrait[0]}%`,
  "--course-label-portrait-y": `${frenchStationDefinition.labelPosition.portrait[1]}%`,
  "--course-label-x": `${frenchStationDefinition.labelPosition.desktop[0]}%`,
  "--course-label-y": `${frenchStationDefinition.labelPosition.desktop[1]}%`,
};

export function FrenchStationLabel({
  isEmphasized,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: FrenchStationLabelProps) {
  const descriptionId = `${frenchStationDefinition.id}-description`;

  return (
    <button
      aria-describedby={descriptionId}
      aria-hidden={!isVisible}
      className="course-system-label growth-system-label french-station-label"
      data-emphasized={isEmphasized}
      data-spatial-anchor={`planet:${frenchStationDefinition.id}`}
      data-status="explorable"
      data-visible={isVisible}
      onBlur={() => onFocusChange(false)}
      onClick={onActivate}
      onFocus={() => onFocusChange(true)}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      style={labelStyle}
      tabIndex={isVisible ? 0 : -1}
      type="button"
    >
      <span className="course-system-label__name">
        {frenchStationDefinition.name}
      </span>
      <span
        aria-hidden="true"
        className="course-system-label__preview growth-system-label__purpose"
      >
        French · Dock
      </span>
      <span className="sr-only" id={descriptionId}>
        {frenchStationDefinition.description} Activate to open Duolingo.
      </span>
    </button>
  );
}
