"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";

import type { MissionIntelligence } from "@/components/mission-control/mission-intelligence";
import { requestOpenMissionDeckPanel } from "@/components/mission-control/mission-operating-deck";
import {
  findMissionDestination,
  getWeekStartKey,
  type MissionDestinationId,
} from "@/components/mission-control/mission-operating-record";
import { useMissionOperatingSystem } from "@/components/mission-control/use-mission-operating-system";
import {
  getLastMissionDestination,
  getSeenWeeklyCeremonyWeek,
  requestEvidenceComet,
  subscribeToLastMissionDestination,
  subscribeToWeeklyCeremonySeen,
} from "@/lib/living-universe";

import styles from "./today-strip.module.css";

type TodayStripProps = Readonly<{
  intelligence: MissionIntelligence;
  isVisible: boolean;
  nextDeadlineLabel: string | null;
  onOpenMission: () => void;
  onResumeDestination?: (destinationId: MissionDestinationId) => boolean;
  onVectorStateChange?: (incompleteEvidenceRatio: number) => void;
}>;

function isWeekendPromptDay(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 5 || day === 6;
}

export function TodayStrip({
  intelligence,
  isVisible,
  nextDeadlineLabel,
  onOpenMission,
  onResumeDestination,
  onVectorStateChange,
}: TodayStripProps) {
  const operatingSystem = useMissionOperatingSystem(intelligence.activityDates);
  const [captureText, setCaptureText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingCycleId, setPendingCycleId] = useState<string | null>(null);
  const evidencedCount = operatingSystem.currentVector.filter(
    (item) => item.isCompleteToday,
  ).length;
  const totalCycles = operatingSystem.currentVector.length;
  const incompleteEvidenceRatio =
    totalCycles === 0 ? 0 : (totalCycles - evidencedCount) / totalCycles;
  const weekStart = getWeekStartKey();
  const hasCurrentReview = operatingSystem.reviews.some(
    (review) => review.weekStart === weekStart,
  );
  const lastStoredDestination = useSyncExternalStore(
    subscribeToLastMissionDestination,
    getLastMissionDestination,
    () => null,
  );
  const ceremonySeen = useSyncExternalStore(
    subscribeToWeeklyCeremonySeen,
    () => getSeenWeeklyCeremonyWeek(weekStart),
    () => false,
  );
  const resumeId =
    findMissionDestination(lastStoredDestination as MissionDestinationId | null)
      ?.id ?? null;
  const resumeLabel = findMissionDestination(resumeId)?.label ?? null;
  const showCeremonyNudge =
    isWeekendPromptDay() && !hasCurrentReview && !ceremonySeen;

  useEffect(() => {
    onVectorStateChange?.(incompleteEvidenceRatio);
  }, [incompleteEvidenceRatio, onVectorStateChange]);

  if (!isVisible) {
    return null;
  }

  const handleEvidence = async (cycleId: string) => {
    const cycle = operatingSystem.currentVector.find(
      (item) => item.cycle.id === cycleId,
    );
    const markingComplete = cycle !== undefined && !cycle.isCompleteToday;
    setPendingCycleId(cycleId);
    setFeedback("");

    try {
      await operatingSystem.toggleEvidence(cycleId);
      if (markingComplete) {
        const nextEvidenced = evidencedCount + 1;
        requestEvidenceComet({
          incompleteEvidenceRatio:
            totalCycles === 0
              ? 0
              : Math.max(0, (totalCycles - nextEvidenced) / totalCycles),
          target: "personal-growth",
        });
      }
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Evidence could not be updated.",
      );
    } finally {
      setPendingCycleId(null);
    }
  };

  const handleCapture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = captureText.trim();
    if (content.length === 0) {
      return;
    }

    setFeedback("");

    try {
      await operatingSystem.addCapture({
        areaId: "general",
        content,
        kind: "note",
      });
      setCaptureText("");
      setFeedback("Captured.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The capture could not be saved.",
      );
    }
  };

  return (
    <section
      aria-label="Today orbit"
      className={styles.strip}
      data-loading={operatingSystem.isLoading}
    >
      <header className={styles.header}>
        <div>
          <span>Today orbit</span>
          <strong>
            {operatingSystem.isLoading
              ? "Aligning"
              : `${evidencedCount}/${totalCycles} evidenced`}
          </strong>
        </div>
        {nextDeadlineLabel !== null ? (
          <p className={styles.deadline}>{nextDeadlineLabel}</p>
        ) : (
          <p className={styles.deadline}>No university deadlines this week</p>
        )}
      </header>

      {resumeLabel !== null &&
      resumeId !== null &&
      onResumeDestination !== undefined ? (
        <button
          className={styles.resume}
          onClick={() => onResumeDestination(resumeId)}
          type="button"
        >
          <span>Resume</span>
          <strong>{resumeLabel}</strong>
        </button>
      ) : null}

      {showCeremonyNudge ? (
        <button
          className={styles.ceremony}
          onClick={() => requestOpenMissionDeckPanel("review")}
          type="button"
        >
          End-of-week ceremony available
        </button>
      ) : null}

      <div className={styles.cycles}>
        {operatingSystem.currentVector.length === 0 ? (
          <p className={styles.empty}>
            Open Mission to set up to three active cycles.
          </p>
        ) : (
          operatingSystem.currentVector.map((item) => (
            <button
              aria-pressed={item.isCompleteToday}
              disabled={pendingCycleId === item.cycle.id}
              key={item.cycle.id}
              onClick={() => void handleEvidence(item.cycle.id)}
              type="button"
            >
              <i data-complete={item.isCompleteToday} />
              <span>{item.cycle.title}</span>
            </button>
          ))
        )}
      </div>

      <form
        className={styles.capture}
        onSubmit={(event) => void handleCapture(event)}
      >
        <label className={styles.srOnly} htmlFor="today-orbit-capture">
          Quick capture
        </label>
        <input
          id="today-orbit-capture"
          onChange={(event) => setCaptureText(event.target.value)}
          placeholder="Capture a thought…"
          value={captureText}
        />
        <button disabled={captureText.trim().length === 0} type="submit">
          Save
        </button>
      </form>

      <div className={styles.footer}>
        <p aria-live="polite">{feedback}</p>
        <button onClick={onOpenMission} type="button">
          Open Mission
        </button>
      </div>
    </section>
  );
}
