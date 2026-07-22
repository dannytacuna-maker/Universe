"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NavigationState } from "@/store/navigation-store";
import { useNavigationStore } from "@/store/navigation-store-provider";

import {
  formatCourseScheduleDetails,
  formatCourseScheduleSummary,
} from "./galaxies/university/course-schedule";
import { universityCourseSystems } from "./galaxies/university/university-course-systems";
import { JiuJitsuTrainingLog } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-training-log";
import { useJiuJitsuSessions } from "./galaxies/personal-growth/jiu-jitsu/use-jiu-jitsu-sessions";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { StrengthPhysiqueTracker } from "./galaxies/personal-growth/strength-physique/strength-physique-tracker";
import { useStrengthPhysique } from "./galaxies/personal-growth/strength-physique/use-strength-physique";
import { LazyUniverseCanvas } from "./lazy-universe-canvas";
import {
  findGalaxy,
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
const strengthPhysiqueSystemId = "strength-physique";

export function UniverseViewport() {
  const webglSupport = useWebGLSupport();
  const navigationLevel = useNavigationStore((state) => state.level);
  const selectedGalaxyId = useNavigationStore(
    (state) => state.selectedGalaxyId,
  );
  const selectedSystemId = useNavigationStore(
    (state) => state.selectedSystemId,
  );
  const enterGalaxy = useNavigationStore((state) => state.enterGalaxy);
  const enterSystem = useNavigationStore((state) => state.enterSystem);
  const returnToGalaxy = useNavigationStore((state) => state.returnToGalaxy);
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
  const [announcement, setAnnouncement] = useState("");
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [isCameraSettled, setIsCameraSettled] = useState(true);
  const hasSyncedLocation = useRef(false);
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
  const emphasizedGalaxyId = hoveredGalaxyId ?? focusedGalaxyId;
  const emphasizedSystemId = hoveredSystemId ?? focusedSystemId;
  const activeSystemId = navigationLevel === "system" ? selectedSystemId : null;
  const selectedGalaxy = useMemo(
    () => findGalaxy(selectedGalaxyId),
    [selectedGalaxyId],
  );
  const activeSystem = useMemo(
    () => findSystem(selectedGalaxyId, activeSystemId),
    [activeSystemId, selectedGalaxyId],
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
  }, []);

  const beginCameraTravel = useCallback(() => {
    setIsCameraSettled(false);
  }, []);

  const handleCameraArrive = useCallback(() => {
    setIsCameraSettled(true);
  }, []);

  const pushNavigationUrl = useCallback((state: NavigationState) => {
    const nextUrl = createUniverseNavigationUrl(window.location.href, state);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.pushState(null, "", nextUrl);
    }
  }, []);

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

  const handleBack = useCallback(() => {
    if (navigationLevel === "system" && selectedGalaxy !== null) {
      clearInteractionState();
      beginCameraTravel();
      setAnnouncement(`Returning to the ${selectedGalaxy.name} galaxy.`);
      const nextState: NavigationState = {
        level: "galaxy",
        selectedGalaxyId: selectedGalaxy.id,
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
    clearInteractionState,
    navigationLevel,
    pushNavigationUrl,
    returnToGalaxy,
    returnToUniverse,
    selectedGalaxy,
  ]);

  const handleReturnToOrigin = useCallback(() => {
    clearInteractionState();
    beginCameraTravel();
    setAnnouncement("Returning to the universe origin.");
    pushNavigationUrl(universeOriginState);
    returnToUniverse();
    setCameraResetToken((token) => token + 1);
  }, [
    beginCameraTravel,
    clearInteractionState,
    pushNavigationUrl,
    returnToUniverse,
  ]);

  useEffect(() => {
    const syncFromLocation = () => {
      const nextNavigation = readUniverseNavigation(window.location.search);

      clearInteractionState();

      if (
        hasSyncedLocation.current ||
        nextNavigation.level !== "universe" ||
        nextNavigation.selectedGalaxyId !== null ||
        nextNavigation.selectedSystemId !== null
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
      setIsCameraSettled(true);
    }, 4500);

    return () => window.clearTimeout(fallbackId);
  }, [isCameraSettled, webglSupport]);

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
  const isStrengthPhysiqueActive =
    navigationLevel === "system" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === strengthPhysiqueSystemId;

  return (
    <section
      aria-label="Mission Control universe"
      className="universe-viewport"
      data-galaxy={selectedGalaxyId ?? "none"}
      data-navigation-level={navigationLevel}
      data-webgl-state={webglSupport}
    >
      <div aria-hidden="true" className="universe-fallback" />

      {webglSupport === "available" ? (
        <WebGLBoundary>
          <LazyUniverseCanvas
            activeSystemId={activeSystemId}
            cameraResetToken={cameraResetToken}
            emphasizedGalaxyId={emphasizedGalaxyId}
            emphasizedSystemId={emphasizedSystemId}
            hoveredGalaxyId={hoveredGalaxyId}
            hoveredSystemId={hoveredSystemId}
            jiuJitsuProgress={jiuJitsuProgress}
            navigationLevel={navigationLevel}
            onCameraArrive={handleCameraArrive}
            onGalaxyActivate={handleGalaxyActivate}
            onGalaxyHoverChange={setHoveredGalaxyId}
            onSystemActivate={handleSystemActivate}
            onSystemHoverChange={setHoveredSystemId}
            selectedGalaxyId={selectedGalaxyId}
            strengthProgress={strengthProgress}
          />
        </WebGLBoundary>
      ) : null}

      <UniverseNavigationOverlay
        activeSystemName={activeSystem?.name ?? null}
        activeSystemSummary={
          activeCourse === null
            ? (activeGrowthSystem?.description ?? null)
            : formatCourseScheduleSummary(activeCourse.schedule)
        }
        emphasizedGalaxyId={emphasizedGalaxyId}
        emphasizedSystemId={emphasizedSystemId}
        isViewSettled={isViewSettled}
        level={navigationLevel}
        onBack={handleBack}
        onGalaxyActivate={handleGalaxyActivate}
        onGalaxyFocusChange={setFocusedGalaxyId}
        onGalaxyHoverChange={setHoveredGalaxyId}
        onReturnToOrigin={handleReturnToOrigin}
        onSystemActivate={handleSystemActivate}
        onSystemFocusChange={setFocusedSystemId}
        onSystemHoverChange={setHoveredSystemId}
        selectedGalaxyId={selectedGalaxyId}
        selectedGalaxyName={selectedGalaxy?.name ?? null}
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

      <StrengthPhysiqueTracker
        bodyWeightEntries={bodyWeightEntries}
        isLoading={isStrengthLoading}
        isVisible={isStrengthPhysiqueActive && isViewSettled}
        onAddBodyWeight={addBodyWeight}
        onRemoveBodyWeight={removeBodyWeight}
        onToggleWorkout={toggleWorkout}
        onUpdatePersonalRecord={updatePersonalRecord}
        personalRecords={personalRecords}
        progress={strengthProgress}
        storageError={strengthStorageError}
      />

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <span className="sr-only">
        {navigationLevel === "universe"
          ? "University and Personal Growth galaxies are available to explore."
          : navigationLevel === "galaxy"
            ? selectedGalaxyId === personalGrowthGalaxyId
              ? "Four Personal Growth systems are mapped. Jiu-Jitsu and Strength and Physique are available to explore."
              : "Five University systems are mapped: four scheduled courses and Final Project. Logistics and Distribution is available to explore."
            : selectedGalaxyId === personalGrowthGalaxyId
              ? activeSystemId === strengthPhysiqueSystemId
                ? "Strength and Physique system. A flexible six-day push, pull, legs plan, personal records, and body weight can be tracked privately on this device."
                : "Jiu-Jitsu system. Training sessions can be logged privately on this device."
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
