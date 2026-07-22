"use client";

import type { NavigationLevel } from "@/store/navigation-store";

import { PersonalGrowthGalaxyLabel } from "./galaxies/personal-growth/personal-growth-galaxy-label";
import { PersonalGrowthSystemLabels } from "./galaxies/personal-growth/personal-growth-system-labels";
import { BeerusPlanetLabel } from "./galaxies/personal-growth/strength-physique/beerus-planet-label";
import { UniversityCourseSystemLabels } from "./galaxies/university/university-course-system-labels";
import { UniversityWeeklySchedule } from "./galaxies/university/university-weekly-schedule";
import { UniversityGalaxyLabel } from "./galaxies/university-galaxy-label";
import {
  personalGrowthGalaxyId,
  universityGalaxyId,
} from "./universe-destinations";

type UniverseNavigationOverlayProps = Readonly<{
  activePlanetName: string | null;
  activeSystemName: string | null;
  activeSystemSummary: string | null;
  emphasizedGalaxyId: string | null;
  emphasizedPlanetId: string | null;
  emphasizedSystemId: string | null;
  isViewSettled: boolean;
  level: NavigationLevel;
  onBack: () => void;
  onGalaxyActivate: (galaxyId: string) => void;
  onGalaxyFocusChange: (galaxyId: string | null) => void;
  onGalaxyHoverChange: (galaxyId: string | null) => void;
  onPlanetActivate: (planetId: string) => void;
  onPlanetFocusChange: (planetId: string | null) => void;
  onPlanetHoverChange: (planetId: string | null) => void;
  onReturnToOrigin: () => void;
  onSystemActivate: (systemId: string) => void;
  onSystemFocusChange: (systemId: string | null) => void;
  onSystemHoverChange: (systemId: string | null) => void;
  selectedGalaxyId: string | null;
  selectedGalaxyName: string | null;
  selectedSystemId: string | null;
}>;

export function UniverseNavigationOverlay({
  activePlanetName,
  activeSystemName,
  activeSystemSummary,
  emphasizedGalaxyId,
  emphasizedPlanetId,
  emphasizedSystemId,
  isViewSettled,
  level,
  onBack,
  onGalaxyActivate,
  onGalaxyFocusChange,
  onGalaxyHoverChange,
  onPlanetActivate,
  onPlanetFocusChange,
  onPlanetHoverChange,
  onReturnToOrigin,
  onSystemActivate,
  onSystemFocusChange,
  onSystemHoverChange,
  selectedGalaxyId,
  selectedGalaxyName,
  selectedSystemId,
}: UniverseNavigationOverlayProps) {
  const isUniversityOverviewVisible =
    selectedGalaxyId === universityGalaxyId &&
    level === "galaxy" &&
    isViewSettled;

  return (
    <div className="universe-navigation-overlay">
      <UniversityGalaxyLabel
        isEmphasized={emphasizedGalaxyId === universityGalaxyId}
        isVisible={level === "universe" && isViewSettled}
        onActivate={() => onGalaxyActivate(universityGalaxyId)}
        onFocusChange={(isFocused) =>
          onGalaxyFocusChange(isFocused ? universityGalaxyId : null)
        }
        onHoverChange={(isHovered) =>
          onGalaxyHoverChange(isHovered ? universityGalaxyId : null)
        }
      />

      <PersonalGrowthGalaxyLabel
        isEmphasized={emphasizedGalaxyId === personalGrowthGalaxyId}
        isVisible={level === "universe" && isViewSettled}
        onActivate={() => onGalaxyActivate(personalGrowthGalaxyId)}
        onFocusChange={(isFocused) =>
          onGalaxyFocusChange(isFocused ? personalGrowthGalaxyId : null)
        }
        onHoverChange={(isHovered) =>
          onGalaxyHoverChange(isHovered ? personalGrowthGalaxyId : null)
        }
      />

      <UniversityCourseSystemLabels
        emphasizedCourseId={emphasizedSystemId}
        isVisible={isUniversityOverviewVisible}
        onActivate={onSystemActivate}
        onFocusChange={onSystemFocusChange}
        onHoverChange={onSystemHoverChange}
      />

      {isUniversityOverviewVisible ? (
        <UniversityWeeklySchedule
          emphasizedCourseId={emphasizedSystemId}
          onActivate={onSystemActivate}
          onFocusChange={onSystemFocusChange}
          onHoverChange={onSystemHoverChange}
        />
      ) : null}

      <PersonalGrowthSystemLabels
        emphasizedSystemId={emphasizedSystemId}
        isVisible={
          selectedGalaxyId === personalGrowthGalaxyId &&
          level === "galaxy" &&
          isViewSettled
        }
        onActivate={onSystemActivate}
        onFocusChange={onSystemFocusChange}
        onHoverChange={onSystemHoverChange}
      />

      <BeerusPlanetLabel
        isEmphasized={emphasizedPlanetId === "beerus-planet"}
        isVisible={
          selectedGalaxyId === personalGrowthGalaxyId &&
          selectedSystemId === "strength-physique" &&
          level === "system" &&
          isViewSettled
        }
        onActivate={() => onPlanetActivate("beerus-planet")}
        onFocusChange={(isFocused) =>
          onPlanetFocusChange(isFocused ? "beerus-planet" : null)
        }
        onHoverChange={(isHovered) =>
          onPlanetHoverChange(isHovered ? "beerus-planet" : null)
        }
      />

      {level !== "universe" ? (
        <button
          className="universe-back-control"
          onClick={onBack}
          type="button"
        >
          <span aria-hidden="true">←</span>
          <span>
            {level === "planet"
              ? "Strength system"
              : level === "system"
                ? selectedGalaxyName
                : "Universe"}
          </span>
        </button>
      ) : null}

      {level === "galaxy" && isViewSettled ? (
        <div className="university-context-label">
          <strong>{selectedGalaxyName}</strong>
        </div>
      ) : null}

      {level === "system" && isViewSettled && activeSystemName !== null ? (
        <div className="active-course-label">
          <strong>{activeSystemName}</strong>
          {activeSystemSummary !== null ? (
            <span>{activeSystemSummary}</span>
          ) : null}
        </div>
      ) : null}

      {level === "planet" && isViewSettled && activePlanetName !== null ? (
        <div className="planet-context-label">
          <span>Strength &amp; Physique</span>
          <strong>{activePlanetName}</strong>
        </div>
      ) : null}

      <button
        aria-label="Return to universe origin"
        className="universe-origin-control"
        data-active={level !== "universe"}
        onClick={onReturnToOrigin}
        type="button"
      >
        <span aria-hidden="true" className="universe-origin-mark" />
        <span>Origin</span>
      </button>
    </div>
  );
}
