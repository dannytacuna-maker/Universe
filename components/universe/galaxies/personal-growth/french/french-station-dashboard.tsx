"use client";

import type {
  FrenchLearningProfile,
  FrenchLearningProfileUpdate,
  FrenchPracticeSession,
  FrenchPracticeSessionUpdate,
  NewFrenchPracticeSession,
} from "./french-learning-record";
import type { FrenchLearningSummary } from "./french-learning-summary";
import styles from "./french-station-dashboard.module.css";

type FrenchStationDashboardProps = Readonly<{
  isLoading: boolean;
  isVisible: boolean;
  onAddSession: (input: NewFrenchPracticeSession) => Promise<void>;
  onEditSession: (input: FrenchPracticeSessionUpdate) => Promise<void>;
  onRemoveSession: (sessionId: string) => Promise<void>;
  onUpdateProfile: (input: FrenchLearningProfileUpdate) => Promise<void>;
  profile: FrenchLearningProfile | null;
  sessions: readonly FrenchPracticeSession[];
  storageError: string | null;
  summary: FrenchLearningSummary;
}>;

const duolingoLearnUrl = "https://www.duolingo.com/learn";

export function FrenchStationDashboard({
  isVisible,
}: FrenchStationDashboardProps) {
  if (!isVisible) return null;

  return (
    <section aria-labelledby="french-station-title" className={styles.station}>
      <div aria-hidden="true" className={styles.beacon}>
        <span className={styles.beaconCore} />
        <span className={styles.beaconOrbit} />
      </div>

      <div className={styles.content}>
        <span className={styles.eyebrow}>Personal Growth · French</span>
        <h1 id="french-station-title">Lumière Station</h1>
        <p className={styles.introduction}>
          A direct departure point for deliberate French practice. Continue to
          Duolingo, complete the lesson that matters, then return to your
          universe.
        </p>

        <a
          aria-describedby="duolingo-launch-note"
          className={styles.launchButton}
          href={duolingoLearnUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>
            <small>External learning route</small>
            Open Duolingo
          </span>
          <span aria-hidden="true" className={styles.launchArrow}>
            ↗
          </span>
        </a>

        <p className={styles.launchNote} id="duolingo-launch-note">
          Opens Duolingo in a new tab. Mission Control remains docked here, and
          your sign-in stays entirely with Duolingo.
        </p>
      </div>

      <dl className={styles.routeDetails}>
        <div>
          <dt>Destination</dt>
          <dd>Duolingo · French</dd>
        </div>
        <div>
          <dt>Mission Control</dt>
          <dd>Remains at station</dd>
        </div>
        <div>
          <dt>Account access</dt>
          <dd>Handled by Duolingo</dd>
        </div>
      </dl>
    </section>
  );
}
