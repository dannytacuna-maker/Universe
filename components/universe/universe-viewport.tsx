"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NavigationState } from "@/store/navigation-store";
import { useNavigationStore } from "@/store/navigation-store-provider";

import {
  formatCourseScheduleDetails,
  formatCourseScheduleSummary,
} from "./galaxies/university/course-schedule";
import { universityCourseSystems } from "./galaxies/university/university-course-systems";
import { hyperbolicTimeChamberDefinition } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-planets";
import { JiuJitsuReviewDashboard } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-review-dashboard";
import { JiuJitsuTrainingLog } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-training-log";
import { useJiuJitsuSessions } from "./galaxies/personal-growth/jiu-jitsu/use-jiu-jitsu-sessions";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { CelestialLibraryDashboard } from "./galaxies/personal-growth/reading/celestial-library-dashboard";
import { celestialLibraryDefinition } from "./galaxies/personal-growth/reading/reading-planets";
import { useReadingLibrary } from "./galaxies/personal-growth/reading/use-reading-library";
import { beerusPlanetDefinition } from "./galaxies/personal-growth/strength-physique/beerus-planet-definition";
import { GymPlaylistPlayer } from "./galaxies/personal-growth/strength-physique/gym-playlist-player";
import {
  gymPlaylistPlanetDefinition,
  trainingArchivePlanetDefinition,
} from "./galaxies/personal-growth/strength-physique/strength-planets";
import { TrainingProgramArchive } from "./galaxies/personal-growth/strength-physique/training-program-archive";
import { useStrengthPhysique } from "./galaxies/personal-growth/strength-physique/use-strength-physique";
import { WhisTrainingAssistant } from "./galaxies/personal-growth/strength-physique/whis-training-assistant";
import { LazyUniverseCanvas } from "./lazy-universe-canvas";
import {
  PlanetArrivalTransition,
  type PlanetArrivalPhase,
} from "./planet-arrival-transition";
import {
  findGalaxy,
  findPlanet,
  findSystem,
  personalGrowthGalaxyId,
  universityGalaxyId,
  universeOriginState,
} from "./universe-destinations";
import { UniverseNavigationOverlay } from "./universe-navigation-overlay";
import {
  createUniverseNavigationUrl,
  readUniverseNavigation,
} from "./universe-navigation-url";
import { useWebGLSupport } from "./use-webgl-support";
import { WebGLBoundary } from "./webgl-boundary";

const jiuJitsuSystemId = "jiu-jitsu";
const planetCloudCoverDurationMs = 1180;
const planetCloudRevealDurationMs = 1500;
const readingSystemId = "reading";
const strengthPhysiqueSystemId = "strength-physique";

export function UniverseViewport() {
  const shouldReduceMotion = useReducedMotion();
  const webglSupport = useWebGLSupport();
  const navigationLevel = useNavigationStore((state) => state.level);
  const selectedGalaxyId = useNavigationStore(
    (state) => state.selectedGalaxyId,
  );
  const selectedSystemId = useNavigationStore(
    (state) => state.selectedSystemId,
  );
  const selectedPlanetId = useNavigationStore(
    (state) => state.selectedPlanetId,
  );
  const enterGalaxy = useNavigationStore((state) => state.enterGalaxy);
  const enterPlanet = useNavigationStore((state) => state.enterPlanet);
  const enterSystem = useNavigationStore((state) => state.enterSystem);
  const returnToGalaxy = useNavigationStore((state) => state.returnToGalaxy);
  const returnToSystem = useNavigationStore((state) => state.returnToSystem);
  const returnToUniverse = useNavigationStore(
    (state) => state.returnToUniverse,
  );
  const replaceNavigationState = useNavigationStore(
    (state) => state.replaceNavigationState,
  );
  const [hoveredGalaxyId, setHoveredGalaxyId] = useState<string | null>(null);
  const [focusedGalaxyId, setFocusedGalaxyId] = useState<string | null>(null);
  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null);
  const [focusedSystemId, setFocusedSystemId] = useState<string | null>(null);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [focusedPlanetId, setFocusedPlanetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [isCameraSettled, setIsCameraSettled] = useState(true);
  const [planetArrivalPhase, setPlanetArrivalPhase] =
    useState<PlanetArrivalPhase>("idle");
  const hasSyncedLocation = useRef(false);
  const planetNavigationTimer = useRef<number | null>(null);
  const planetRevealTimer = useRef<number | null>(null);
  const {
    addSession,
    isLoading: isTrainingLogLoading,
    progress: jiuJitsuProgress,
    removeSession,
    sessions: jiuJitsuSessions,
    storageError: trainingStorageError,
  } = useJiuJitsuSessions();
  const {
    addBodyWeight,
    bodyWeightEntries,
    isLoading: isStrengthLoading,
    personalRecords,
    progress: strengthProgress,
    removeBodyWeight,
    storageError: strengthStorageError,
    toggleWorkout,
    updatePersonalRecord,
  } = useStrengthPhysique();
  const {
    addBook,
    addSession: addReadingSession,
    books: readingBooks,
    editBook,
    isLoading: isReadingLoading,
    sessions: readingSessions,
    storageError: readingStorageError,
    summary: readingSummary,
  } = useReadingLibrary();
  const emphasizedGalaxyId = hoveredGalaxyId ?? focusedGalaxyId;
  const emphasizedSystemId = hoveredSystemId ?? focusedSystemId;
  const emphasizedPlanetId = hoveredPlanetId ?? focusedPlanetId;
  const activeSystemId =
    navigationLevel === "system" || navigationLevel === "planet"
      ? selectedSystemId
      : null;
  const selectedGalaxy = useMemo(
    () => findGalaxy(selectedGalaxyId),
    [selectedGalaxyId],
  );
  const activeSystem = useMemo(
    () => findSystem(selectedGalaxyId, activeSystemId),
    [activeSystemId, selectedGalaxyId],
  );
  const activePlanet = useMemo(
    () => findPlanet(selectedGalaxyId, selectedSystemId, selectedPlanetId),
    [selectedGalaxyId, selectedPlanetId, selectedSystemId],
  );
  const activeCourse = useMemo(
    () =>
      selectedGalaxyId === universityGalaxyId
        ? (universityCourseSystems.find(
            (definition) => definition.id === activeSystemId,
          ) ?? null)
        : null,
    [activeSystemId, selectedGalaxyId],
  );
  const activeGrowthSystem = useMemo(
    () =>
      selectedGalaxyId === personalGrowthGalaxyId
        ? (personalGrowthSystems.find(
            (definition) => definition.id === activeSystemId,
          ) ?? null)
        : null,
    [activeSystemId, selectedGalaxyId],
  );

  const clearInteractionState = useCallback(() => {
    setHoveredGalaxyId(null);
    setFocusedGalaxyId(null);
    setHoveredSystemId(null);
    setFocusedSystemId(null);
    setHoveredPlanetId(null);
    setFocusedPlanetId(null);
  }, []);

  const beginCameraTravel = useCallback(() => {
    setIsCameraSettled(false);
  }, []);

  const handleCameraArrive = useCallback(() => {
    setIsCameraSettled(true);

    if (planetArrivalPhase === "holding") {
      setPlanetArrivalPhase("revealing");
      planetRevealTimer.current = window.setTimeout(() => {
        setPlanetArrivalPhase("idle");
        planetRevealTimer.current = null;
      }, planetCloudRevealDurationMs);
    }
  }, [planetArrivalPhase]);

  const pushNavigationUrl = useCallback((state: NavigationState) => {
    const nextUrl = createUniverseNavigationUrl(window.location.href, state);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.pushState(null, "", nextUrl);
    }
  }, []);

  const travelThroughPlanetClouds = useCallback(
    (cloudAnnouncement: string, travel: () => void) => {
      clearInteractionState();

      if (shouldReduceMotion === true || webglSupport !== "available") {
        travel();
        return;
      }

      setAnnouncement(cloudAnnouncement);
      setPlanetArrivalPhase("covering");
      planetNavigationTimer.current = window.setTimeout(() => {
        setPlanetArrivalPhase("holding");
        travel();
        planetNavigationTimer.current = null;
      }, planetCloudCoverDurationMs);
    },
    [clearInteractionState, shouldReduceMotion, webglSupport],
  );

  const handleGalaxyActivate = useCallback(
    (galaxyId: string) => {
      const galaxy = findGalaxy(galaxyId);

      if (galaxy === null) {
        return;
      }

      clearInteractionState();
      beginCameraTravel();
      setAnnouncement(`Entering the ${galaxy.name} galaxy.`);
      const nextState: NavigationState = {
        level: "galaxy",
        selectedGalaxyId: galaxy.id,
        selectedPlanetId: null,
        selectedSystemId: null,
      };
      pushNavigationUrl(nextState);
      enterGalaxy(galaxy.id);
    },
    [beginCameraTravel, clearInteractionState, enterGalaxy, pushNavigationUrl],
  );

  const handleSystemActivate = useCallback(
    (systemId: string) => {
      const galaxy = findGalaxy(selectedGalaxyId);
      const system = findSystem(selectedGalaxyId, systemId);

      if (galaxy === null || system === null) {
        return;
      }

      if (system.status === "explorable") {
        clearInteractionState();
        beginCameraTravel();
        setAnnouncement(`Approaching the ${system.name} system.`);
        const nextState: NavigationState = {
          level: "system",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: null,
          selectedSystemId: system.id,
        };
        pushNavigationUrl(nextState);
        enterSystem(galaxy.id, system.id);
        return;
      }

      setAnnouncement(
        `${system.name} is mapped as a future destination. Exploration is not available yet.`,
      );
    },
    [
      beginCameraTravel,
      clearInteractionState,
      enterSystem,
      pushNavigationUrl,
      selectedGalaxyId,
    ],
  );

  const handlePlanetActivate = useCallback(
    (planetId: string) => {
      if (planetArrivalPhase !== "idle") {
        return;
      }

      const galaxy = findGalaxy(selectedGalaxyId);
      const system = findSystem(selectedGalaxyId, selectedSystemId);
      const planet = findPlanet(selectedGalaxyId, selectedSystemId, planetId);

      if (galaxy === null || system === null || planet === null) {
        return;
      }

      const enterDestination = () => {
        beginCameraTravel();
        setAnnouncement(`Descending to ${planet.name}.`);
        const nextState: NavigationState = {
          level: "planet",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: planet.id,
          selectedSystemId: system.id,
        };
        pushNavigationUrl(nextState);
        enterPlanet(galaxy.id, system.id, planet.id);
      };

      travelThroughPlanetClouds(
        `A wave of cloud is closing around ${planet.name}.`,
        enterDestination,
      );
    },
    [
      beginCameraTravel,
      enterPlanet,
      planetArrivalPhase,
      pushNavigationUrl,
      selectedGalaxyId,
      selectedSystemId,
      travelThroughPlanetClouds,
    ],
  );

  const handleBack = useCallback(() => {
    if (planetArrivalPhase !== "idle") {
      return;
    }

    if (
      navigationLevel === "planet" &&
      selectedGalaxy !== null &&
      activeSystem !== null
    ) {
      const returnFromPlanet = () => {
        beginCameraTravel();
        setAnnouncement(`Returning to the ${activeSystem.name} system.`);
        const nextState: NavigationState = {
          level: "system",
          selectedGalaxyId: selectedGalaxy.id,
          selectedPlanetId: null,
          selectedSystemId: activeSystem.id,
        };
        pushNavigationUrl(nextState);
        returnToSystem(selectedGalaxy.id, activeSystem.id);
      };

      travelThroughPlanetClouds(
        `A wave of cloud is rising for the return to ${activeSystem.name}.`,
        returnFromPlanet,
      );
      return;
    }

    if (navigationLevel === "system" && selectedGalaxy !== null) {
      clearInteractionState();
      beginCameraTravel();
      setAnnouncement(`Returning to the ${selectedGalaxy.name} galaxy.`);
      const nextState: NavigationState = {
        level: "galaxy",
        selectedGalaxyId: selectedGalaxy.id,
        selectedPlanetId: null,
        selectedSystemId: null,
      };
      pushNavigationUrl(nextState);
      returnToGalaxy(selectedGalaxy.id);
      return;
    }

    clearInteractionState();
    beginCameraTravel();
    setAnnouncement("Returning to the wider universe.");
    pushNavigationUrl(universeOriginState);
    returnToUniverse();
  }, [
    beginCameraTravel,
    activeSystem,
    clearInteractionState,
    navigationLevel,
    planetArrivalPhase,
    pushNavigationUrl,
    returnToGalaxy,
    returnToSystem,
    returnToUniverse,
    selectedGalaxy,
    travelThroughPlanetClouds,
  ]);

  const handleReturnToOrigin = useCallback(() => {
    if (planetArrivalPhase !== "idle") {
      return;
    }

    const returnToOrigin = () => {
      beginCameraTravel();
      setAnnouncement("Returning to the universe origin.");
      pushNavigationUrl(universeOriginState);
      returnToUniverse();
      setCameraResetToken((token) => token + 1);
    };

    if (navigationLevel === "planet") {
      travelThroughPlanetClouds(
        "A wave of cloud is rising for the return to origin.",
        returnToOrigin,
      );
      return;
    }

    clearInteractionState();
    returnToOrigin();
  }, [
    beginCameraTravel,
    clearInteractionState,
    navigationLevel,
    planetArrivalPhase,
    pushNavigationUrl,
    returnToUniverse,
    travelThroughPlanetClouds,
  ]);

  useEffect(() => {
    return () => {
      if (planetNavigationTimer.current !== null) {
        window.clearTimeout(planetNavigationTimer.current);
      }

      if (planetRevealTimer.current !== null) {
        window.clearTimeout(planetRevealTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      const nextNavigation = readUniverseNavigation(window.location.search);

      if (planetNavigationTimer.current !== null) {
        window.clearTimeout(planetNavigationTimer.current);
        planetNavigationTimer.current = null;
      }

      if (planetRevealTimer.current !== null) {
        window.clearTimeout(planetRevealTimer.current);
        planetRevealTimer.current = null;
      }

      clearInteractionState();
      setPlanetArrivalPhase("idle");

      if (
        hasSyncedLocation.current ||
        nextNavigation.level !== "universe" ||
        nextNavigation.selectedGalaxyId !== null ||
        nextNavigation.selectedSystemId !== null ||
        nextNavigation.selectedPlanetId !== null
      ) {
        beginCameraTravel();
      }

      hasSyncedLocation.current = true;
      replaceNavigationState(nextNavigation);
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);

    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [beginCameraTravel, clearInteractionState, replaceNavigationState]);

  useEffect(() => {
    if (isCameraSettled || webglSupport !== "available") {
      return;
    }

    const fallbackId = window.setTimeout(() => {
      handleCameraArrive();
    }, 4500);

    return () => window.clearTimeout(fallbackId);
  }, [handleCameraArrive, isCameraSettled, webglSupport]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && navigationLevel !== "universe") {
        event.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack, navigationLevel]);

  const isViewSettled = webglSupport !== "available" || isCameraSettled;
  const isJiuJitsuActive =
    navigationLevel === "system" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === jiuJitsuSystemId;
  const isBeerusPlanetActive =
    navigationLevel === "planet" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === strengthPhysiqueSystemId &&
    selectedPlanetId === beerusPlanetDefinition.id;
  const isTrainingArchiveActive =
    navigationLevel === "planet" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === strengthPhysiqueSystemId &&
    selectedPlanetId === trainingArchivePlanetDefinition.id;
  const isGymPlaylistActive =
    navigationLevel === "planet" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === strengthPhysiqueSystemId &&
    selectedPlanetId === gymPlaylistPlanetDefinition.id;
  const isHyperbolicTimeChamberActive =
    navigationLevel === "planet" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === jiuJitsuSystemId &&
    selectedPlanetId === hyperbolicTimeChamberDefinition.id;
  const isCelestialLibraryActive =
    navigationLevel === "planet" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === readingSystemId &&
    selectedPlanetId === celestialLibraryDefinition.id;

  return (
    <section
      aria-label="Mission Control universe"
      className="universe-viewport"
      data-camera-settled={isViewSettled}
      data-galaxy={selectedGalaxyId ?? "none"}
      data-navigation-level={navigationLevel}
      data-planet-transition={planetArrivalPhase}
      data-webgl-state={webglSupport}
    >
      <div aria-hidden="true" className="universe-fallback" />

      {webglSupport === "available" ? (
        <WebGLBoundary>
          <LazyUniverseCanvas
            activeSystemId={activeSystemId}
            cameraResetToken={cameraResetToken}
            emphasizedGalaxyId={emphasizedGalaxyId}
            emphasizedPlanetId={emphasizedPlanetId}
            emphasizedSystemId={emphasizedSystemId}
            hoveredGalaxyId={hoveredGalaxyId}
            hoveredPlanetId={hoveredPlanetId}
            hoveredSystemId={hoveredSystemId}
            jiuJitsuProgress={jiuJitsuProgress}
            navigationLevel={navigationLevel}
            onCameraArrive={handleCameraArrive}
            onGalaxyActivate={handleGalaxyActivate}
            onGalaxyHoverChange={setHoveredGalaxyId}
            onPlanetActivate={handlePlanetActivate}
            onPlanetHoverChange={setHoveredPlanetId}
            onSystemActivate={handleSystemActivate}
            onSystemHoverChange={setHoveredSystemId}
            selectedGalaxyId={selectedGalaxyId}
            selectedPlanetId={selectedPlanetId}
            strengthProgress={strengthProgress}
          />
        </WebGLBoundary>
      ) : null}

      <PlanetArrivalTransition phase={planetArrivalPhase} />

      <UniverseNavigationOverlay
        activeSystemName={activeSystem?.name ?? null}
        activePlanetName={activePlanet?.name ?? null}
        activeSystemSummary={
          activeCourse === null
            ? (activeGrowthSystem?.description ?? null)
            : formatCourseScheduleSummary(activeCourse.schedule)
        }
        emphasizedGalaxyId={emphasizedGalaxyId}
        emphasizedPlanetId={emphasizedPlanetId}
        emphasizedSystemId={emphasizedSystemId}
        isViewSettled={isViewSettled}
        level={navigationLevel}
        onBack={handleBack}
        onGalaxyActivate={handleGalaxyActivate}
        onGalaxyFocusChange={setFocusedGalaxyId}
        onGalaxyHoverChange={setHoveredGalaxyId}
        onPlanetActivate={handlePlanetActivate}
        onPlanetFocusChange={setFocusedPlanetId}
        onPlanetHoverChange={setHoveredPlanetId}
        onReturnToOrigin={handleReturnToOrigin}
        onSystemActivate={handleSystemActivate}
        onSystemFocusChange={setFocusedSystemId}
        onSystemHoverChange={setHoveredSystemId}
        selectedGalaxyId={selectedGalaxyId}
        selectedGalaxyName={selectedGalaxy?.name ?? null}
        selectedSystemId={activeSystemId}
      />

      <JiuJitsuTrainingLog
        isLoading={isTrainingLogLoading}
        isVisible={isJiuJitsuActive && isViewSettled}
        onAddSession={addSession}
        onRemoveSession={removeSession}
        progress={jiuJitsuProgress}
        sessions={jiuJitsuSessions}
        storageError={trainingStorageError}
      />

      <JiuJitsuReviewDashboard
        isLoading={isTrainingLogLoading}
        isVisible={isHyperbolicTimeChamberActive && isViewSettled}
        sessions={jiuJitsuSessions}
        storageError={trainingStorageError}
      />

      <WhisTrainingAssistant
        bodyWeightEntries={bodyWeightEntries}
        isLoading={isStrengthLoading}
        isVisible={isBeerusPlanetActive && isViewSettled}
        onAddBodyWeight={addBodyWeight}
        onRemoveBodyWeight={removeBodyWeight}
        onToggleWorkout={toggleWorkout}
        onUpdatePersonalRecord={updatePersonalRecord}
        personalRecords={personalRecords}
        progress={strengthProgress}
        storageError={strengthStorageError}
      />

      <TrainingProgramArchive
        isVisible={isTrainingArchiveActive && isViewSettled}
      />

      <GymPlaylistPlayer isVisible={isGymPlaylistActive && isViewSettled} />

      <CelestialLibraryDashboard
        books={readingBooks}
        isLoading={isReadingLoading}
        isVisible={isCelestialLibraryActive && isViewSettled}
        onAddBook={addBook}
        onAddSession={addReadingSession}
        onEditBook={editBook}
        sessions={readingSessions}
        storageError={readingStorageError}
        summary={readingSummary}
      />

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <span className="sr-only">
        {navigationLevel === "universe"
          ? "University and Personal Growth galaxies are available to explore."
          : navigationLevel === "galaxy"
            ? selectedGalaxyId === personalGrowthGalaxyId
              ? "Three Personal Growth systems are mapped: Jiu-Jitsu, Strength and Physique, and Reading."
              : "Five University systems are mapped: four scheduled courses and Final Project. Logistics and Distribution is available to explore."
            : navigationLevel === "planet"
              ? activePlanet === null
                ? "Personal Growth planet."
                : `${activePlanet.name}. ${activePlanet.description}`
              : selectedGalaxyId === personalGrowthGalaxyId
                ? activeSystemId === strengthPhysiqueSystemId
                  ? "Strength and Physique system. Beerus' Planet, the Training Archive, and the Gym Playlist are available to enter."
                  : activeSystemId === jiuJitsuSystemId
                    ? "Jiu-Jitsu system. Training sessions can be logged privately, and the Hyperbolic Time Chamber is available to enter."
                    : "Reading system. The Celestial Library is available to enter."
                : activeCourse === null
                  ? "University course system."
                  : `${activeCourse.name} course system. ${formatCourseScheduleDetails(activeCourse.schedule)}. Workspaces have not been introduced yet.`}
      </span>
      <span className="sr-only">
        Use the scroll wheel or plus and minus keys to adjust camera distance.
        Press zero to reset the view distance.
      </span>
    </section>
  );
}
