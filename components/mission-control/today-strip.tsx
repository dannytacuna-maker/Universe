"use client";

import { useState, type FormEvent } from "react";

import type { MissionIntelligence } from "@/components/mission-control/mission-intelligence";
import { useMissionOperatingSystem } from "@/components/mission-control/use-mission-operating-system";

import styles from "./today-strip.module.css";

type TodayStripProps = Readonly<{
  intelligence: MissionIntelligence;
  isVisible: boolean;
  nextDeadlineLabel: string | null;
  onOpenMission: () => void;
}>;

export function TodayStrip({
  intelligence,
  isVisible,
  nextDeadlineLabel,
  onOpenMission,
}: TodayStripProps) {
  const operatingSystem = useMissionOperatingSystem(intelligence.activityDates);
  const [captureText, setCaptureText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingCycleId, setPendingCycleId] = useState<string | null>(null);
  const evidencedCount = operatingSystem.currentVector.filter(
    (item) => item.isCompleteToday,
  ).length;
  const totalCycles = operatingSystem.currentVector.length;

  if (!isVisible) {
    return null;
  }

  const handleEvidence = async (cycleId: string) => {
    setPendingCycleId(cycleId);
    setFeedback("");

    try {
      await operatingSystem.toggleEvidence(cycleId);
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

      <form className={styles.capture} onSubmit={(event) => void handleCapture(event)}>
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
