"use client";

import type { NavigationLevel } from "@/store/navigation-store";

import styles from "./location-breadcrumb.module.css";

type BreadcrumbSegment = Readonly<{
  id: string;
  label: string;
  onActivate?: () => void;
}>;

type LocationBreadcrumbProps = Readonly<{
  isVisible: boolean;
  level: NavigationLevel;
  onReturnToGalaxy?: () => void;
  onReturnToOrigin: () => void;
  onReturnToSystem?: () => void;
  selectedGalaxyName: string | null;
  selectedPlanetName: string | null;
  selectedSystemName: string | null;
}>;

export function LocationBreadcrumb({
  isVisible,
  level,
  onReturnToGalaxy,
  onReturnToOrigin,
  onReturnToSystem,
  selectedGalaxyName,
  selectedPlanetName,
  selectedSystemName,
}: LocationBreadcrumbProps) {
  if (!isVisible || level === "universe") {
    return null;
  }

  const segments: BreadcrumbSegment[] = [
    {
      id: "universe",
      label: "Universe",
      onActivate: onReturnToOrigin,
    },
  ];

  if (selectedGalaxyName !== null) {
    segments.push({
      id: "galaxy",
      label: selectedGalaxyName,
      onActivate:
        level === "galaxy"
          ? undefined
          : onReturnToGalaxy,
    });
  }

  if (selectedSystemName !== null && (level === "system" || level === "planet")) {
    segments.push({
      id: "system",
      label: selectedSystemName,
      onActivate: level === "system" ? undefined : onReturnToSystem,
    });
  }

  if (selectedPlanetName !== null && level === "planet") {
    segments.push({
      id: "planet",
      label: selectedPlanetName,
    });
  }

  return (
    <nav aria-label="Current location" className={styles.breadcrumb}>
      <ol>
        {segments.map((segment, index) => (
          <li key={segment.id}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {segment.onActivate ? (
              <button onClick={segment.onActivate} type="button">
                {segment.label}
              </button>
            ) : (
              <strong>{segment.label}</strong>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
