"use client";

import type { CSSProperties } from "react";

import { forgeSystems } from "./forge-systems";

type ForgeLabelStyle = CSSProperties & {
  "--course-label-compact-x": string;
  "--course-label-compact-y": string;
  "--course-label-portrait-x": string;
  "--course-label-portrait-y": string;
  "--course-label-x": string;
  "--course-label-y": string;
};

type ForgeSystemLabelsProps = Readonly<{
  emphasizedSystemId: string | null;
  isVisible: boolean;
  onActivate: (systemId: string) => void;
  onFocusChange: (systemId: string | null) => void;
  onHoverChange: (systemId: string | null) => void;
}>;

function createLabelStyle(
  desktop: readonly [number, number],
  portrait: readonly [number, number],
  compact: readonly [number, number],
): ForgeLabelStyle {
  return {
    "--course-label-compact-x": `${compact[0]}%`,
    "--course-label-compact-y": `${compact[1]}%`,
    "--course-label-portrait-x": `${portrait[0]}%`,
    "--course-label-portrait-y": `${portrait[1]}%`,
    "--course-label-x": `${desktop[0]}%`,
    "--course-label-y": `${desktop[1]}%`,
  };
}

export function ForgeSystemLabels({
  emphasizedSystemId,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: ForgeSystemLabelsProps) {
  return (
    <div
      aria-hidden={!isVisible}
      className="course-system-labels forge-system-labels"
    >
      {forgeSystems.map((definition) => {
        const descriptionId = `${definition.id}-forge-description`;

        return (
          <button
            aria-describedby={descriptionId}
            aria-hidden={!isVisible}
            className="course-system-label forge-system-label"
            data-emphasized={emphasizedSystemId === definition.id}
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
            <span
              aria-hidden="true"
              className="course-system-label__preview forge-system-label__purpose"
            >
              {definition.status === "explorable" ? "Enter system" : "Mapped"}
            </span>
            <span className="sr-only" id={descriptionId}>
              {definition.description}{" "}
              {definition.status === "explorable"
                ? "Activate to explore this system."
                : "This future destination is not available yet."}
            </span>
          </button>
        );
      })}
    </div>
  );
}
