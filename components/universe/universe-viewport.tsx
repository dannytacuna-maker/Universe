"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AuthenticatedAccountControl } from "@/components/auth/authenticated-account-control";
import { ObservatoryExperience } from "@/components/intelligence/observatory-experience";
import { createMissionDestinationState } from "@/components/mission-control/mission-destination-navigation";
import { buildMissionIntelligence } from "@/components/mission-control/mission-intelligence";
import type { MissionDestinationId } from "@/components/mission-control/mission-operating-record";
import { getLocalDateKey } from "@/components/mission-control/mission-operating-record";
import { MissionOperatingDeck } from "@/components/mission-control/mission-operating-deck";
import { useMissionCloudSync } from "@/components/mission-control/use-mission-cloud-sync";
import { CommandDock } from "@/components/ui/command-dock";
import { rememberMissionDestination } from "@/lib/living-universe";
import type { NavigationState } from "@/store/navigation-store";
import { useNavigationStore } from "@/store/navigation-store-provider";

import {
  frenchStationDefinition,
  lumiereStationUrl,
} from "./galaxies/personal-growth/french/french-station-definition";
import { FrenchStationDashboard } from "./galaxies/personal-growth/french/french-station-dashboard";
import { useFrenchLearning } from "./galaxies/personal-growth/french/use-french-learning";
import {
  formatCourseScheduleDetails,
  formatCourseScheduleSummary,
} from "./galaxies/university/course-schedule";
import { universityCourseSystems } from "./galaxies/university/university-course-systems";
import { UniversityOperationsDashboard } from "./galaxies/university/university-operations-dashboard";
import { useUniversityRecords } from "./galaxies/university/use-university-records";
import { hyperbolicTimeChamberDefinition } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-planets";
import { JiuJitsuReviewDashboard } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-review-dashboard";
import { JiuJitsuTrainingLog } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-training-log";
import { useJiuJitsuSessions } from "./galaxies/personal-growth/jiu-jitsu/use-jiu-jitsu-sessions";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { CelestialLibraryDashboard } from "./galaxies/personal-growth/reading/celestial-library-dashboard";
import { getForgePlanet } from "./galaxies/forge/firmus-planets";
import { celestialLibraryDefinition } from "./galaxies/personal-growth/reading/reading-planets";
import { useReadingLibrary } from "./galaxies/personal-growth/reading/use-reading-library";
import { beerusPlanetDefinition } from "./galaxies/personal-growth/strength-physique/beerus-planet-definition";
import { GymPlaylistPlayer } from "./galaxies/personal-growth/strength-physique/gym-playlist-player";
import {
  gymPlaylistPlanetDefinition,
  trainingArchivePlanetDefinition,
} from "./galaxies/personal-growth/strength-physique/strength-planets";
import { strengthWorkoutSplit } from "./galaxies/personal-growth/strength-physique/strength-physique-plan";
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
  findGalaxyStation,
  findPlanet,
  findSystem,
  forgeGalaxyId,
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
import { deriveUniverseActivitySignals } from "./universe-activity";
import { useObservatoryAttention } from "./use-observatory-attention";
import { WebGLBoundary } from "./webgl-boundary";
import { globalObservatoryDefinition } from "./observatory/observatory-definition";

const jiuJitsuSystemId = "jiu-jitsu";
const planetCloudCoverDurationMs = 1180;
const planetCloudRevealDurationMs = 1500;
const readingSystemId = "reading";
const strengthPhysiqueSystemId = "strength-physique";

const JarvisDock = dynamic(
  () =>
    import("@/components/jarvis/jarvis-dock").then(
      (module) => module.JarvisDock,
    ),
  { ssr: false },
);

type UniverseViewportProps = Readonly<{ ownerEmail: string }>;

export function UniverseViewport({ ownerEmail }: UniverseViewportProps) {
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
  const frenchLearning = useFrenchLearning();
  const {
    addSession,
    editSession,
    isLoading: isTrainingLogLoading,
    progress: jiuJitsuProgress,
    removeSession,
    sessions: jiuJitsuSessions,
    storageError: trainingStorageError,
  } = useJiuJitsuSessions();
  const {
    addBodyWeight,
    addTrainingSession,
    bodyWeightEntries,
    isLoading: isStrengthLoading,
    liftHistory,
    personalRecords,
    progress: strengthProgress,
    removeBodyWeight,
    removeTrainingSession,
    editTrainingSession,
    sessions: strengthTrainingSessions,
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
    removeBook: removeReadingBook,
    removeSession: removeReadingSession,
    sessions: readingSessions,
    storageError: readingStorageError,
    summary: readingSummary,
  } = useReadingLibrary();
  const universityRecords = useUniversityRecords();
  const cloudSync = useMissionCloudSync();
  const { attention: observatoryAttention, markBriefingSeen } =
    useObservatoryAttention(navigationLevel === "universe");
  const missionIntelligence = useMemo(
    () =>
      buildMissionIntelligence({
        frenchSessions: frenchLearning.sessions,
        jiuJitsuSessions,
        readingBooks,
        readingSessions,
        strengthSessions: strengthTrainingSessions,
        universityNotes: universityRecords.notes,
      }),
    [
      frenchLearning.sessions,
      jiuJitsuSessions,
      readingBooks,
      readingSessions,
      strengthTrainingSessions,
      universityRecords.notes,
    ],
  );
  const activitySignals = useMemo(
    () =>
      deriveUniverseActivitySignals({
        french: {
          error: frenchLearning.storageError,
          loading: frenchLearning.isLoading,
          summary: frenchLearning.summary,
        },
        jiuJitsu: {
          error: trainingStorageError,
          loading: isTrainingLogLoading,
          progress: jiuJitsuProgress,
        },
        observatoryAttention,
        reading: {
          error: readingStorageError,
          loading: isReadingLoading,
          sessions: readingSessions,
          summary: readingSummary,
        },
        strength: {
          error: strengthStorageError,
          loading: isStrengthLoading,
          progress: strengthProgress,
        },
        university: {
          assignments: universityRecords.assignments,
          error: universityRecords.storageError,
          grades: universityRecords.grades,
          loading: universityRecords.isLoading,
          notes: universityRecords.notes,
        },
      }),
    [
      frenchLearning.isLoading,
      frenchLearning.storageError,
      frenchLearning.summary,
      isReadingLoading,
      isStrengthLoading,
      isTrainingLogLoading,
      jiuJitsuProgress,
      observatoryAttention,
      readingSessions,
      readingStorageError,
      readingSummary,
      strengthProgress,
      strengthStorageError,
      trainingStorageError,
      universityRecords.assignments,
      universityRecords.grades,
      universityRecords.isLoading,
      universityRecords.notes,
      universityRecords.storageError,
    ],
  );
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
  const activeStation = useMemo(
    () => findGalaxyStation(selectedGalaxyId, selectedPlanetId),
    [selectedGalaxyId, selectedPlanetId],
  );
  const activeDestination = activePlanet ?? activeStation;
  const jarvisContext = useMemo(
    () => ({
      galaxyId: selectedGalaxyId,
      level: navigationLevel,
      planetId: selectedPlanetId,
      systemId: selectedSystemId,
    }),
    [navigationLevel, selectedGalaxyId, selectedPlanetId, selectedSystemId],
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

      if (planetId === globalObservatoryDefinition.id) {
        rememberMissionDestination("observatory");
        clearInteractionState();
        beginCameraTravel();
        setAnnouncement("Entering The Observatory.");
        const nextState: NavigationState = {
          level: "planet",
          selectedGalaxyId: null,
          selectedPlanetId: globalObservatoryDefinition.id,
          selectedSystemId: null,
        };
        pushNavigationUrl(nextState);
        replaceNavigationState(nextState);
        return;
      }

      const galaxy = findGalaxy(selectedGalaxyId);
      const station = findGalaxyStation(selectedGalaxyId, planetId);

      if (galaxy !== null && station !== null && selectedSystemId === null) {
        if (station.id === frenchStationDefinition.id) {
          window.open(lumiereStationUrl, "_blank", "noopener,noreferrer");
          setAnnouncement(`Opening ${station.name}.`);
          return;
        }

        clearInteractionState();
        beginCameraTravel();
        setAnnouncement(`Docking with ${station.name}.`);
        const nextState: NavigationState = {
          level: "planet",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: station.id,
          selectedSystemId: null,
        };
        pushNavigationUrl(nextState);
        enterPlanet(galaxy.id, null, station.id);
        return;
      }

      const system = findSystem(selectedGalaxyId, selectedSystemId);
      const planet = findPlanet(selectedGalaxyId, selectedSystemId, planetId);

      if (galaxy === null || system === null || planet === null) {
        return;
      }

      const externalUrl = getForgePlanet(planet.id)?.externalUrl ?? null;

      if (externalUrl !== null) {
        window.open(externalUrl, "_blank", "noopener,noreferrer");
        setAnnouncement(`Opening ${planet.name}.`);
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
      clearInteractionState,
      enterPlanet,
      planetArrivalPhase,
      pushNavigationUrl,
      replaceNavigationState,
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
      activeStation?.id === globalObservatoryDefinition.id
    ) {
      clearInteractionState();
      beginCameraTravel();
      setAnnouncement("Returning to the wider universe.");
      pushNavigationUrl(universeOriginState);
      returnToUniverse();
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

    if (
      navigationLevel === "planet" &&
      selectedGalaxy !== null &&
      activeStation !== null
    ) {
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
    activeStation,
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

    if (navigationLevel === "planet" && activeStation === null) {
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
    activeStation,
    clearInteractionState,
    navigationLevel,
    planetArrivalPhase,
    pushNavigationUrl,
    returnToUniverse,
    travelThroughPlanetClouds,
  ]);

  const handleReturnToGalaxy = useCallback(() => {
    if (selectedGalaxy === null || planetArrivalPhase !== "idle") {
      return;
    }

    clearInteractionState();
    beginCameraTravel();
    setAnnouncement(`Returning to ${selectedGalaxy.name}.`);
    const nextState: NavigationState = {
      level: "galaxy",
      selectedGalaxyId: selectedGalaxy.id,
      selectedPlanetId: null,
      selectedSystemId: null,
    };
    pushNavigationUrl(nextState);
    returnToGalaxy(selectedGalaxy.id);
  }, [
    beginCameraTravel,
    clearInteractionState,
    planetArrivalPhase,
    pushNavigationUrl,
    returnToGalaxy,
    selectedGalaxy,
  ]);

  const handleReturnToSystem = useCallback(() => {
    if (
      selectedGalaxy === null ||
      activeSystem === null ||
      planetArrivalPhase !== "idle"
    ) {
      return;
    }

    const goToSystem = () => {
      clearInteractionState();
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

    if (navigationLevel === "planet" && activeStation === null) {
      travelThroughPlanetClouds(
        "A wave of cloud is rising for the return to system.",
        goToSystem,
      );
      return;
    }

    goToSystem();
  }, [
    activeStation,
    activeSystem,
    beginCameraTravel,
    clearInteractionState,
    navigationLevel,
    planetArrivalPhase,
    pushNavigationUrl,
    returnToSystem,
    selectedGalaxy,
    travelThroughPlanetClouds,
  ]);

  const handleMissionDestinationNavigate = useCallback(
    (destinationId: MissionDestinationId) => {
      if (planetArrivalPhase !== "idle") {
        setAnnouncement(
          "Hold for a moment — the previous journey is still settling.",
        );
        return false;
      }

      rememberMissionDestination(destinationId);

      const forgePlanet = getForgePlanet(destinationId);
      if (forgePlanet !== null) {
        window.open(forgePlanet.externalUrl, "_blank", "noopener,noreferrer");
      }

      if (destinationId === "french-station") {
        window.open(lumiereStationUrl, "_blank", "noopener,noreferrer");
      }

      if (destinationId === "observatory") {
        clearInteractionState();
        beginCameraTravel();
        setAnnouncement("Entering The Observatory.");
        const nextState: NavigationState = {
          level: "planet",
          selectedGalaxyId: null,
          selectedPlanetId: globalObservatoryDefinition.id,
          selectedSystemId: null,
        };
        pushNavigationUrl(nextState);
        replaceNavigationState(nextState);
        return true;
      }

      const nextState = createMissionDestinationState(destinationId);
      const destination =
        nextState.level === "galaxy"
          ? findGalaxy(nextState.selectedGalaxyId)
          : nextState.level === "planet"
            ? (findGalaxyStation(
                nextState.selectedGalaxyId,
                nextState.selectedPlanetId,
              ) ??
              findPlanet(
                nextState.selectedGalaxyId,
                nextState.selectedSystemId,
                nextState.selectedPlanetId,
              ))
            : findSystem(
                nextState.selectedGalaxyId,
                nextState.selectedSystemId,
              );

      if (destination === null) {
        return false;
      }

      const travel = () => {
        clearInteractionState();
        beginCameraTravel();
        pushNavigationUrl(nextState);
        setAnnouncement(`Aligning with ${destination.name}.`);

        if (
          nextState.level === "galaxy" &&
          nextState.selectedGalaxyId !== null
        ) {
          enterGalaxy(nextState.selectedGalaxyId);
        } else if (
          nextState.level === "planet" &&
          nextState.selectedGalaxyId !== null &&
          nextState.selectedPlanetId !== null
        ) {
          enterPlanet(
            nextState.selectedGalaxyId,
            nextState.selectedSystemId,
            nextState.selectedPlanetId,
          );
        } else if (
          nextState.selectedGalaxyId !== null &&
          nextState.selectedSystemId !== null
        ) {
          enterSystem(nextState.selectedGalaxyId, nextState.selectedSystemId);
        }
      };

      if (navigationLevel === "planet" && activeStation === null) {
        travelThroughPlanetClouds(
          `A wave of cloud is rising for the journey to ${destination.name}.`,
          travel,
        );
      } else {
        travel();
      }

      return true;
    },
    [
      beginCameraTravel,
      activeStation,
      clearInteractionState,
      enterGalaxy,
      enterPlanet,
      enterSystem,
      navigationLevel,
      planetArrivalPhase,
      pushNavigationUrl,
      replaceNavigationState,
      travelThroughPlanetClouds,
    ],
  );

  const handleQuickLogJiuJitsu = useCallback(async () => {
    await addSession({
      classType: "gi",
      durationMinutes: 60,
      mobilityWork: false,
      notes: "",
      occurredOn: getLocalDateKey(),
      reflection: "",
      sparringRounds: 0,
      techniques: [],
    });
    return "Jiu-Jitsu class logged for today (60 min · Gi).";
  }, [addSession]);

  const handleQuickLogStrength = useCallback(async () => {
    const nextDay = strengthWorkoutSplit.find(
      (day) => !strengthProgress.completedDayIds.includes(day.id),
    );

    if (nextDay === undefined) {
      return "All Whis split days are already marked this week.";
    }

    await toggleWorkout(nextDay.id, true);
    return `Marked ${nextDay.name} complete for this week.`;
  }, [strengthProgress.completedDayIds, toggleWorkout]);

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
      const eventTarget =
        event.target instanceof Element ? event.target : document.activeElement;
      const isEditingOrInsideWorkspace =
        eventTarget instanceof Element &&
        eventTarget.closest(
          "aside, form, details, input, select, textarea, [contenteditable='true']",
        ) !== null;

      if (
        event.key === "Escape" &&
        document.querySelector("dialog[open]") === null &&
        !isEditingOrInsideWorkspace &&
        navigationLevel !== "universe"
      ) {
        event.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack, navigationLevel]);

  const isViewSettled = webglSupport !== "available" || isCameraSettled;
  const isUniversityOperationsVisible =
    selectedGalaxyId === universityGalaxyId &&
    (navigationLevel === "galaxy" || navigationLevel === "system");
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
  const isFrenchStationActive =
    navigationLevel === "planet" &&
    selectedGalaxyId === personalGrowthGalaxyId &&
    activeSystemId === null &&
    selectedPlanetId === frenchStationDefinition.id;
  const isObservatoryActive =
    navigationLevel === "planet" &&
    selectedSystemId === null &&
    selectedPlanetId === globalObservatoryDefinition.id;

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
            activitySignals={activitySignals}
            cameraResetToken={cameraResetToken}
            constellationIntensity={Math.min(
              1,
              missionIntelligence.patterns.length * 0.55,
            )}
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
        activePlanetName={activeDestination?.name ?? null}
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
        onReturnToGalaxy={handleReturnToGalaxy}
        onReturnToOrigin={handleReturnToOrigin}
        onReturnToSystem={handleReturnToSystem}
        onSystemActivate={handleSystemActivate}
        onSystemFocusChange={setFocusedSystemId}
        onSystemHoverChange={setHoveredSystemId}
        selectedGalaxyId={selectedGalaxyId}
        selectedGalaxyName={
          isObservatoryActive ? "Universe" : (selectedGalaxy?.name ?? null)
        }
        selectedSystemId={activeSystemId}
      />

      <CommandDock>
        <MissionOperatingDeck
          cloudSync={cloudSync}
          intelligence={missionIntelligence}
          onNavigate={handleMissionDestinationNavigate}
          onQuickLogJiuJitsu={handleQuickLogJiuJitsu}
          onQuickLogStrength={handleQuickLogStrength}
        />

        <JarvisDock context={jarvisContext} />

        <AuthenticatedAccountControl
          ownerEmail={ownerEmail}
          status={cloudSync.status}
        />
      </CommandDock>

      <UniversityOperationsDashboard
        courseId={activeCourse?.id ?? null}
        defaultExpanded={navigationLevel === "system"}
        isVisible={isUniversityOperationsVisible && isViewSettled}
        key={activeCourse?.id ?? "university-overview"}
        records={universityRecords}
      />

      <JiuJitsuTrainingLog
        isLoading={isTrainingLogLoading}
        isVisible={isJiuJitsuActive && isViewSettled}
        onAddSession={addSession}
        onEditSession={editSession}
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
        liftHistory={liftHistory}
        onAddBodyWeight={addBodyWeight}
        onAddTrainingSession={addTrainingSession}
        onEditTrainingSession={editTrainingSession}
        onRemoveBodyWeight={removeBodyWeight}
        onRemoveTrainingSession={removeTrainingSession}
        onToggleWorkout={toggleWorkout}
        onUpdatePersonalRecord={updatePersonalRecord}
        personalRecords={personalRecords}
        progress={strengthProgress}
        storageError={strengthStorageError}
        trainingSessions={strengthTrainingSessions}
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
        onRemoveBook={removeReadingBook}
        onRemoveSession={removeReadingSession}
        sessions={readingSessions}
        storageError={readingStorageError}
        summary={readingSummary}
      />

      <FrenchStationDashboard
        isLoading={frenchLearning.isLoading}
        isVisible={isFrenchStationActive && isViewSettled}
        onAddSession={frenchLearning.addSession}
        onEditSession={frenchLearning.editSession}
        onRemoveSession={frenchLearning.removeSession}
        onUpdateProfile={frenchLearning.updateProfile}
        profile={frenchLearning.profile}
        sessions={frenchLearning.sessions}
        storageError={frenchLearning.storageError}
        summary={frenchLearning.summary}
      />

      <ObservatoryExperience
        isVisible={isObservatoryActive && isViewSettled}
        onBriefingSeen={markBriefingSeen}
      />

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <span className="sr-only">
        {navigationLevel === "universe"
          ? "University, Personal Growth, and The Forge galaxies are available to explore."
          : navigationLevel === "galaxy"
            ? selectedGalaxyId === personalGrowthGalaxyId
              ? "Three Personal Growth systems and one independent French station are mapped: Jiu-Jitsu, Strength and Physique, Reading, and Lumière Station."
              : selectedGalaxyId === forgeGalaxyId
                ? "The Forge maps the Websites system, containing every live Vercel project."
                : "Five University systems are mapped: four scheduled courses and Final Project. Logistics and Distribution is available to explore."
            : navigationLevel === "planet"
              ? activeDestination === null
                ? "Destination surface."
                : `${activeDestination.name}. ${activeDestination.description}`
              : selectedGalaxyId === personalGrowthGalaxyId
                ? activeSystemId === strengthPhysiqueSystemId
                  ? "Strength and Physique system. Beerus' Planet, the Training Archive, and the Gym Playlist are available to enter."
                  : activeSystemId === jiuJitsuSystemId
                    ? "Jiu-Jitsu system. Training sessions can be logged privately, and the Hyperbolic Time Chamber is available to enter."
                    : "Reading system. The Celestial Library is available to enter."
                : selectedGalaxyId === forgeGalaxyId
                  ? "Websites system. Each planet opens its live site; each Vercel link opens that project's deployments."
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
