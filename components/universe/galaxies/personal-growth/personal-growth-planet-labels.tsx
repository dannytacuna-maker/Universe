"use client";

import type { CSSProperties } from "react";

import { personalGrowthPlanets } from "./personal-growth-planets";

type PersonalGrowthPlanetLabelsProps = Readonly<{
  emphasizedPlanetId: string | null;
  isVisible: boolean;
  onActivate: (planetId: string) => void;
  onFocusChange: (planetId: string | null) => void;
  onHoverChange: (planetId: string | null) => void;
  selectedSystemId: string | null;
}>;

type PlanetLabelStyle = CSSProperties &
  Readonly<{
    "--planet-label-compact-x": string;
    "--planet-label-compact-y": string;
    "--planet-label-desktop-x": string;
    "--planet-label-desktop-y": string;
    "--planet-label-portrait-x": string;
    "--planet-label-portrait-y": string;
  }>;

const planetActionLabels = {
  library: "Enter library",
  playlist: "Listen",
  program: "Open archive",
  sanctuary: "Land",
  station: "Enter station",
  "time-chamber": "Review training",
} as const;

export function PersonalGrowthPlanetLabels({
  emphasizedPlanetId,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
  selectedSystemId,
}: PersonalGrowthPlanetLabelsProps) {
  return personalGrowthPlanets
    .filter((planet) => planet.systemId === selectedSystemId)
    .map((planet) => {
      const descriptionId = `${planet.id}-description`;
      const style: PlanetLabelStyle = {
        "--planet-label-compact-x": `${planet.labelPosition.compact[0]}%`,
        "--planet-label-compact-y": `${planet.labelPosition.compact[1]}%`,
        "--planet-label-desktop-x": `${planet.labelPosition.desktop[0]}%`,
        "--planet-label-desktop-y": `${planet.labelPosition.desktop[1]}%`,
        "--planet-label-portrait-x": `${planet.labelPosition.portrait[0]}%`,
        "--planet-label-portrait-y": `${planet.labelPosition.portrait[1]}%`,
      };

      return (
        <button
          aria-describedby={descriptionId}
          aria-hidden={!isVisible}
          className="strength-planet-label personal-growth-planet-label"
          data-emphasized={emphasizedPlanetId === planet.id}
          data-kind={planet.kind}
          data-spatial-anchor={`planet:${planet.id}`}
          data-visible={isVisible}
          key={planet.id}
          onBlur={() => onFocusChange(null)}
          onClick={() => onActivate(planet.id)}
          onFocus={() => onFocusChange(planet.id)}
          onMouseEnter={() => onHoverChange(planet.id)}
          onMouseLeave={() => onHoverChange(null)}
          style={style}
          tabIndex={isVisible ? 0 : -1}
          type="button"
        >
          <span>{planet.name}</span>
          <small aria-hidden="true">{planetActionLabels[planet.kind]}</small>
          <span className="sr-only" id={descriptionId}>
            {planet.description} Activate to enter this destination.
          </span>
        </button>
      );
    });
}
