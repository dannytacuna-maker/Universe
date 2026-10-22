"use client";

import { useEffect, useMemo, useRef } from "react";

import { ObservatoryExperience } from "@/components/intelligence/observatory-experience";
import { useMissionCloudSync } from "@/components/mission-control/use-mission-cloud-sync";
import { FrenchStationDashboard } from "@/components/universe/galaxies/personal-growth/french/french-station-dashboard";
import { useFrenchLearning } from "@/components/universe/galaxies/personal-growth/french/use-french-learning";
import { JiuJitsuReviewDashboard } from "@/components/universe/galaxies/personal-growth/jiu-jitsu/jiu-jitsu-review-dashboard";
import { JiuJitsuTrainingLog } from "@/components/universe/galaxies/personal-growth/jiu-jitsu/jiu-jitsu-training-log";
import { useJiuJitsuSessions } from "@/components/universe/galaxies/personal-growth/jiu-jitsu/use-jiu-jitsu-sessions";
import { CelestialLibraryDashboard } from "@/components/universe/galaxies/personal-growth/reading/celestial-library-dashboard";
import { useReadingLibrary } from "@/components/universe/galaxies/personal-growth/reading/use-reading-library";
import { GymPlaylistPlayer } from "@/components/universe/galaxies/personal-growth/strength-physique/gym-playlist-player";
import { TrainingProgramArchive } from "@/components/universe/galaxies/personal-growth/strength-physique/training-program-archive";
import { useStrengthPhysique } from "@/components/universe/galaxies/personal-growth/strength-physique/use-strength-physique";
import { WhisTrainingAssistant } from "@/components/universe/galaxies/personal-growth/strength-physique/whis-training-assistant";
import { useWebsitesProductionCenter } from "@/components/universe/galaxies/forge/use-websites-production-center";
import { WebsitesProductionCenter } from "@/components/universe/galaxies/forge/websites-production-center";
import { UniversityOperationsDashboard } from "@/components/universe/galaxies/university/university-operations-dashboard";
import { isAssignmentResolved } from "@/components/universe/galaxies/university/university-operations-summary";
import { useUniversityRecords } from "@/components/universe/galaxies/university/use-university-records";
import { useObservatoryAttention } from "@/components/universe/use-observatory-attention";
import {
  createDashboardNavigationUrl,
  readDashboardNavigation,
  type DashboardNavigation,
} from "@/lib/dashboard-sections";
import { useDashboardNavigationStore } from "@/store/dashboard-navigation-store-provider";

import { DashboardChromeProvider } from "./dashboard-chrome";
import { DashboardShell } from "./dashboard-shell";
import shellStyles from "./dashboard-shell.module.css";
import { HomeStatusPage } from "./home-status-page";

type DashboardAppProps = Readonly<{ ownerEmail: string }>;

export function DashboardApp({ ownerEmail }: DashboardAppProps) {
  const section = useDashboardNavigationStore((state) => state.section);
  const jiuJitsuSubview = useDashboardNavigationStore(
    (state) => state.jiuJitsuSubview,
  );
  const strengthSubview = useDashboardNavigationStore(
    (state) => state.strengthSubview,
  );
  const replaceNavigation = useDashboardNavigationStore(
    (state) => state.replaceNavigation,
  );
  const setJiuJitsuSubview = useDashboardNavigationStore(
    (state) => state.setJiuJitsuSubview,
  );
  const setStrengthSubview = useDashboardNavigationStore(
    (state) => state.setStrengthSubview,
  );
  const hasSyncedLocation = useRef(false);

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
  const websitesProduction = useWebsitesProductionCenter();
  const cloudSync = useMissionCloudSync();
  const { attention: observatoryAttention, markBriefingSeen } =
    useObservatoryAttention(section === "home" || section === "observatory");

  const navigationSnapshot = useMemo(
    (): DashboardNavigation => ({
      jiuJitsuSubview,
      section,
      strengthSubview,
    }),
    [jiuJitsuSubview, section, strengthSubview],
  );

  useEffect(() => {
    if (hasSyncedLocation.current) return;
    hasSyncedLocation.current = true;
    replaceNavigation(readDashboardNavigation(window.location.search));
  }, [replaceNavigation]);

  useEffect(() => {
    if (!hasSyncedLocation.current) return;

    const nextUrl = createDashboardNavigationUrl(
      window.location.href,
      navigationSnapshot,
    );
    if (
      `${window.location.pathname}${window.location.search}${window.location.hash}` !==
      nextUrl
    ) {
      window.history.pushState(null, "", nextUrl);
    }
  }, [navigationSnapshot]);

  useEffect(() => {
    const handlePopState = () => {
      replaceNavigation(readDashboardNavigation(window.location.search));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [replaceNavigation]);

  const openUniversityAssignments = useMemo(
    () =>
      universityRecords.assignments.filter(
        (assignment) => !isAssignmentResolved(assignment),
      ).length,
    [universityRecords.assignments],
  );

  const activeReadingBook = useMemo(() => {
    const active = readingBooks.find((book) => book.status === "reading");
    return active?.title ?? null;
  }, [readingBooks]);

  const subnav =
    section === "jiu-jitsu" ? (
      <>
        <button
          className={shellStyles.subnavButton}
          data-active={jiuJitsuSubview === "log"}
          onClick={() => setJiuJitsuSubview("log")}
          type="button"
        >
          Training log
        </button>
        <button
          className={shellStyles.subnavButton}
          data-active={jiuJitsuSubview === "review"}
          onClick={() => setJiuJitsuSubview("review")}
          type="button"
        >
          Review
        </button>
      </>
    ) : section === "strength-physique" ? (
      <>
        <button
          className={shellStyles.subnavButton}
          data-active={strengthSubview === "training"}
          onClick={() => setStrengthSubview("training")}
          type="button"
        >
          Training
        </button>
        <button
          className={shellStyles.subnavButton}
          data-active={strengthSubview === "archive"}
          onClick={() => setStrengthSubview("archive")}
          type="button"
        >
          Archive
        </button>
        <button
          className={shellStyles.subnavButton}
          data-active={strengthSubview === "playlist"}
          onClick={() => setStrengthSubview("playlist")}
          type="button"
        >
          Playlist
        </button>
      </>
    ) : null;

  return (
    <DashboardChromeProvider layout="page">
      <DashboardShell
        observatoryAttention={observatoryAttention}
        ownerEmail={ownerEmail}
        subnav={subnav}
        syncStatus={cloudSync.status}
      >
        {section === "home" ? (
          <HomeStatusPage
            snapshot={{
              activeReadingBook,
              jiuJitsuSessionCount: jiuJitsuSessions.length,
              observatoryAttention,
              openUniversityAssignments,
              strengthSessionCount: strengthTrainingSessions.length,
              websitesActiveProjects: websitesProduction.pulse.activeProjects,
              websitesOpenOpportunities:
                websitesProduction.pulse.openOpportunities,
            }}
          />
        ) : null}

        {section === "university" ? (
          <UniversityOperationsDashboard
            defaultExpanded
            isVisible
            records={universityRecords}
          />
        ) : null}

        {section === "french" ? (
          <FrenchStationDashboard
            isLoading={frenchLearning.isLoading}
            isVisible
            onAddSession={frenchLearning.addSession}
            onEditSession={frenchLearning.editSession}
            onRemoveSession={frenchLearning.removeSession}
            onUpdateProfile={frenchLearning.updateProfile}
            profile={frenchLearning.profile}
            sessions={frenchLearning.sessions}
            storageError={frenchLearning.storageError}
            summary={frenchLearning.summary}
          />
        ) : null}

        {section === "jiu-jitsu" && jiuJitsuSubview === "log" ? (
          <JiuJitsuTrainingLog
            isLoading={isTrainingLogLoading}
            isVisible
            onAddSession={addSession}
            onEditSession={editSession}
            onRemoveSession={removeSession}
            progress={jiuJitsuProgress}
            sessions={jiuJitsuSessions}
            storageError={trainingStorageError}
          />
        ) : null}

        {section === "jiu-jitsu" && jiuJitsuSubview === "review" ? (
          <JiuJitsuReviewDashboard
            isLoading={isTrainingLogLoading}
            isVisible
            sessions={jiuJitsuSessions}
            storageError={trainingStorageError}
          />
        ) : null}

        {section === "strength-physique" &&
        strengthSubview === "training" ? (
          <WhisTrainingAssistant
            bodyWeightEntries={bodyWeightEntries}
            isLoading={isStrengthLoading}
            isVisible
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
        ) : null}

        {section === "strength-physique" && strengthSubview === "archive" ? (
          <TrainingProgramArchive isVisible />
        ) : null}

        {section === "strength-physique" && strengthSubview === "playlist" ? (
          <GymPlaylistPlayer isVisible />
        ) : null}

        {section === "reading" ? (
          <CelestialLibraryDashboard
            books={readingBooks}
            isLoading={isReadingLoading}
            isVisible
            onAddBook={addBook}
            onAddSession={addReadingSession}
            onEditBook={editBook}
            onRemoveBook={removeReadingBook}
            onRemoveSession={removeReadingSession}
            sessions={readingSessions}
            storageError={readingStorageError}
            summary={readingSummary}
          />
        ) : null}

        {section === "websites" ? (
          <WebsitesProductionCenter isVisible records={websitesProduction} />
        ) : null}

        {section === "observatory" ? (
          <ObservatoryExperience
            isVisible
            onBriefingSeen={markBriefingSeen}
          />
        ) : null}
      </DashboardShell>
    </DashboardChromeProvider>
  );
}
