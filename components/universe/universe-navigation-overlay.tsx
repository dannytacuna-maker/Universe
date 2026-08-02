"use client";

import type { NavigationLevel } from "@/store/navigation-store";

import { PersonalGrowthGalaxyLabel } from "./galaxies/personal-growth/personal-growth-galaxy-label";
import { FrenchStationLabel } from "./galaxies/personal-growth/french/french-station-label";
import { PersonalGrowthPlanetLabels } from "./galaxies/personal-growth/personal-growth-planet-labels";
import { PersonalGrowthSystemLabels } from "./galaxies/personal-growth/personal-growth-system-labels";
import { ForgeGalaxyLabel } from "./galaxies/forge/forge-galaxy-label";
import { ForgeSystemLabels } from "./galaxies/forge/forge-system-labels";
import { UniversityCourseSystemLabels } from "./galaxies/university/university-course-system-labels";
import { UniversityWeeklySchedule } from "./galaxies/university/university-weekly-schedule";
import { UniversityGalaxyLabel } from "./galaxies/university-galaxy-label";
import { ObservatoryLabel } from "./observatory/observatory-label";
import { globalObservatoryDefinition } from "./observatory/observatory-definition";
import { LocationBreadcrumb } from "./location-breadcrumb";
import {
  forgeGalaxyId,
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
  onReturnToGalaxy: () => void;
  onReturnToOrigin: () => void;
  onReturnToSystem: () => void;
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
  onReturnToGalaxy,
  onReturnToOrigin,
  onReturnToSystem,
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
  const isPersonalGrowthOverviewVisible =
    selectedGalaxyId === personalGrowthGalaxyId &&
    level === "galaxy" &&
    isViewSettled;
  const isForgeOverviewVisible =
    selectedGalaxyId === forgeGalaxyId && level === "galaxy" && isViewSettled;

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

      <ForgeGalaxyLabel
        isEmphasized={emphasizedGalaxyId === forgeGalaxyId}
        isVisible={level === "universe" && isViewSettled}
        onActivate={() => onGalaxyActivate(forgeGalaxyId)}
        onFocusChange={(isFocused) =>
          onGalaxyFocusChange(isFocused ? forgeGalaxyId : null)
        }
        onHoverChange={(isHovered) =>
          onGalaxyHoverChange(isHovered ? forgeGalaxyId : null)
        }
      />

      <ObservatoryLabel
        isEmphasized={emphasizedPlanetId === globalObservatoryDefinition.id}
        isVisible={level === "universe" && isViewSettled}
        onActivate={() => onPlanetActivate(globalObservatoryDefinition.id)}
        onFocusChange={(isFocused) =>
          onPlanetFocusChange(isFocused ? globalObservatoryDefinition.id : null)
        }
        onHoverChange={(isHovered) =>
          onPlanetHoverChange(isHovered ? globalObservatoryDefinition.id : null)
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
        isVisible={isPersonalGrowthOverviewVisible}
        onActivate={onSystemActivate}
        onFocusChange={onSystemFocusChange}
        onHoverChange={onSystemHoverChange}
      />

      <ForgeSystemLabels
        emphasizedSystemId={emphasizedSystemId}
        isVisible={isForgeOverviewVisible}
        onActivate={onSystemActivate}
        onFocusChange={onSystemFocusChange}
        onHoverChange={onSystemHoverChange}
      />

      <FrenchStationLabel
        isEmphasized={emphasizedPlanetId === "french-station"}
        isVisible={isPersonalGrowthOverviewVisible}
        onActivate={() => onPlanetActivate("french-station")}
        onFocusChange={(isFocused) =>
          onPlanetFocusChange(isFocused ? "french-station" : null)
        }
        onHoverChange={(isHovered) =>
          onPlanetHoverChange(isHovered ? "french-station" : null)
        }
      />

      <PersonalGrowthPlanetLabels
        emphasizedPlanetId={emphasizedPlanetId}
        isVisible={
          selectedGalaxyId === personalGrowthGalaxyId &&
          level === "system" &&
          isViewSettled
        }
        onActivate={onPlanetActivate}
        onFocusChange={onPlanetFocusChange}
        onHoverChange={onPlanetHoverChange}
        selectedSystemId={selectedSystemId}
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
              ? activeSystemName === null
                ? (selectedGalaxyName ?? "Galaxy")
                : `${activeSystemName} system`
              : level === "system"
                ? selectedGalaxyName
                : "Universe"}
          </span>
        </button>
      ) : null}

      <LocationBreadcrumb
        isVisible={isViewSettled}
        level={level}
        onReturnToGalaxy={onReturnToGalaxy}
        onReturnToOrigin={onReturnToOrigin}
        onReturnToSystem={
          selectedGalaxyId !== null && selectedSystemId !== null
            ? onReturnToSystem
            : undefined
        }
        selectedGalaxyName={selectedGalaxyName}
        selectedPlanetName={activePlanetName}
        selectedSystemName={activeSystemName}
      />

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
          <span>{activeSystemName ?? "Personal Growth · Orbital station"}</span>
          <strong>{activePlanetName}</strong>
        </div>
      ) : null}

      {level !== "universe" ? (
        <button
          aria-label="Return to universe origin"
          className="universe-origin-control"
          data-active="true"
          onClick={onReturnToOrigin}
          type="button"
        >
          <span aria-hidden="true" className="universe-origin-mark" />
          <span>Origin</span>
        </button>
      ) : null}
    </div>
  );
}
