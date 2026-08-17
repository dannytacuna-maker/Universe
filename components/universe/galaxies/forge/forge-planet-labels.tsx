"use client";

import type { CSSProperties } from "react";

import { forgePlanets } from "./firmus-planets";

type ForgePlanetLabelsProps = Readonly<{
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

export function ForgePlanetLabels({
  emphasizedPlanetId,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
  selectedSystemId,
}: ForgePlanetLabelsProps) {
  return forgePlanets
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
        <div
          aria-hidden={!isVisible}
          className="strength-planet-label forge-planet-label"
          data-emphasized={emphasizedPlanetId === planet.id}
          data-kind={planet.kind}
          data-spatial-anchor={`planet:${planet.id}`}
          data-visible={isVisible}
          key={planet.id}
          style={style}
        >
          <button
            aria-describedby={descriptionId}
            onBlur={() => onFocusChange(null)}
            onClick={() => onActivate(planet.id)}
            onFocus={() => onFocusChange(planet.id)}
            onMouseEnter={() => onHoverChange(planet.id)}
            onMouseLeave={() => onHoverChange(null)}
            tabIndex={isVisible ? 0 : -1}
            type="button"
          >
            <span>{planet.name}</span>
            <small>Open site</small>
          </button>
          <a
            href={planet.vercelUrl}
            rel="noreferrer"
            tabIndex={isVisible ? 0 : -1}
            target="_blank"
          >
            Vercel ↗
          </a>
          <span className="sr-only" id={descriptionId}>
            {planet.description} Use the Vercel link to manage deployments.
          </span>
        </div>
      );
    });
}
