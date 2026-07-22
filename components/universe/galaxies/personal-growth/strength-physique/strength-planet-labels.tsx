"use client";

import type { CSSProperties } from "react";

import { strengthPlanets } from "./strength-planets";

type StrengthPlanetLabelsProps = Readonly<{
  emphasizedPlanetId: string | null;
  isVisible: boolean;
  onActivate: (planetId: string) => void;
  onFocusChange: (planetId: string | null) => void;
  onHoverChange: (planetId: string | null) => void;
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

export function StrengthPlanetLabels({
  emphasizedPlanetId,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: StrengthPlanetLabelsProps) {
  return strengthPlanets.map((planet) => {
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
        className="strength-planet-label"
        data-emphasized={emphasizedPlanetId === planet.id}
        data-kind={planet.kind}
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
        <small aria-hidden="true">
          {planet.kind === "playlist"
            ? "Listen"
            : planet.kind === "program"
              ? "Open archive"
              : "Land"}
        </small>
        <span className="sr-only" id={descriptionId}>
          {planet.description} Activate to enter this planet.
        </span>
      </button>
    );
  });
}
