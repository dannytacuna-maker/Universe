"use client";

import { useState, type FormEvent } from "react";

import type {
  GrowthCycle,
  GrowthCycleStatus,
  MissionAreaId,
  MissionDestinationId,
  NewGrowthCycle,
} from "./mission-operating-record";
import {
  findMissionArea,
  findMissionDestination,
  missionAreas,
  missionDestinations,
} from "./mission-operating-record";
import type { CurrentVectorItem } from "./use-mission-operating-system";
import styles from "./mission-operating-deck.module.css";

type CurrentVectorPanelProps = Readonly<{
  currentVector: readonly CurrentVectorItem[];
  cycles: readonly GrowthCycle[];
  onAddCycle: (input: NewGrowthCycle) => Promise<void>;
  onNavigate: (destinationId: MissionDestinationId) => void;
  onSetCycleStatus: (
    cycleId: string,
    status: GrowthCycleStatus,
  ) => Promise<void>;
  onToggleEvidence: (cycleId: string) => Promise<void>;
  recoveryMode: boolean;
}>;

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The change could not be saved.";
}

export function CurrentVectorPanel({
  currentVector,
  cycles,
  onAddCycle,
  onNavigate,
  onSetCycleStatus,
  onToggleEvidence,
  recoveryMode,
}: CurrentVectorPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [pendingCycleId, setPendingCycleId] = useState<string | null>(null);
  const activeCycleCount = currentVector.length;
  const pausedCycles = cycles.filter((cycle) => cycle.status === "paused");

  const handleCycleStatus = async (
    cycleId: string,
    status: GrowthCycleStatus,
  ) => {
    setPendingCycleId(cycleId);
    setFeedback("");

    try {
      await onSetCycleStatus(cycleId, status);
      setFeedback(
        status === "active"
          ? "Cycle returned to Current Vector."
          : status === "completed"
            ? "Cycle completed and preserved as evidence."
            : "Cycle paused. Space is available for a new focus.",
      );
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      setPendingCycleId(null);
    }
  };

  const handleEvidence = async (item: CurrentVectorItem) => {
    setPendingCycleId(item.cycle.id);
    setFeedback("");

    try {
      await onToggleEvidence(item.cycle.id);
      setFeedback(
        item.isCompleteToday
          ? "Today's evidence was removed."
          : "Today's evidence is recorded.",
      );
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      setPendingCycleId(null);
    }
  };

  const handleAddCycle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const destinationValue = String(formData.get("destinationId") ?? "");
    const input: NewGrowthCycle = {
      areaId: String(formData.get("areaId")) as MissionAreaId,
      destinationId:
        destinationValue.length === 0
          ? null
          : (destinationValue as MissionDestinationId),
      identityStatement: String(formData.get("identityStatement") ?? ""),
      minimumAction: String(formData.get("minimumAction") ?? ""),
      title: String(formData.get("title") ?? ""),
      weeklyTarget: Number(formData.get("weeklyTarget")),
    };

    setFeedback("");

    try {
      await onAddCycle(input);
      form.reset();
      setFeedback("Cycle added to Current Vector.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    }
  };

  return (
    <div className={styles.sectionStack}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Current Vector</span>
          <h2>Three commitments. No noise.</h2>
        </div>
        <span className={styles.capacity}>{activeCycleCount} / 3 active</span>
      </header>

      <nav aria-label="Quick actions" className={styles.commandActions}>
        <span>Act now</span>
        <button
          onClick={() => onNavigate("hyperbolic-time-chamber")}
          type="button"
        >
          Log Jiu-Jitsu
        </button>
        <button onClick={() => onNavigate("french-station")} type="button">
          Practice French
        </button>
        <button onClick={() => onNavigate("beerus-planet")} type="button">
          Log training
        </button>
        <button onClick={() => onNavigate("celestial-library")} type="button">
          Continue reading
        </button>
        <button onClick={() => onNavigate("university")} type="button">
          University pressure
        </button>
      </nav>

      {recoveryMode ? (
        <div className={styles.recoveryNotice}>
          <span aria-hidden="true" className={styles.recoveryMark} />
          <div>
            <strong>Minimum viable day</strong>
            <p>
              Protect continuity. The minimum action is enough evidence today.
            </p>
          </div>
        </div>
      ) : null}

      <div className={styles.vectorGrid}>
        {currentVector.map((item) => {
          const area = findMissionArea(item.cycle.areaId);
          const destination = findMissionDestination(item.cycle.destinationId);
          const progress = Math.min(
            item.evidenceThisWeek / item.cycle.weeklyTarget,
            1,
          );
          const isPending = pendingCycleId === item.cycle.id;

          return (
            <article className={styles.vectorCard} key={item.cycle.id}>
              <div className={styles.vectorCardTopline}>
                <span>{area.label}</span>
                <span>
                  {item.evidenceThisWeek} / {item.cycle.weeklyTarget} this week
                </span>
              </div>
              <h3>{item.cycle.title}</h3>
              <p className={styles.identityLine}>
                {item.cycle.identityStatement}
              </p>
              <div
                aria-label={`${Math.round(progress * 100)} percent of weekly target`}
                className={styles.progressTrack}
                role="progressbar"
                aria-valuemax={item.cycle.weeklyTarget}
                aria-valuemin={0}
                aria-valuenow={item.evidenceThisWeek}
              >
                <span style={{ width: `${progress * 100}%` }} />
              </div>
              <div className={styles.minimumAction}>
                <span>
                  {recoveryMode ? "Enough for today" : "Minimum action"}
                </span>
                <p>{item.cycle.minimumAction}</p>
              </div>
              <div className={styles.cardActions}>
                <button
                  aria-pressed={item.isCompleteToday}
                  className={styles.primaryAction}
                  disabled={isPending}
                  onClick={() => {
                    if (item.isSystemLinked && destination !== null) {
                      onNavigate(destination.id);
                    } else {
                      void handleEvidence(item);
                    }
                  }}
                  type="button"
                >
                  <span aria-hidden="true">
                    {item.isCompleteToday
                      ? "✓"
                      : item.isSystemLinked
                        ? "→"
                        : "+"}
                  </span>
                  {item.isCompleteToday
                    ? item.isSystemLinked
                      ? "Recorded in system"
                      : "Evidence logged"
                    : item.isSystemLinked
                      ? "Record in system"
                      : "Log today"}
                </button>
                {destination !== null ? (
                  <button
                    className={styles.textAction}
                    onClick={() => onNavigate(destination.id)}
                    type="button"
                  >
                    Enter
                  </button>
                ) : null}
              </div>
              <div className={styles.secondaryActions}>
                <button
                  disabled={isPending}
                  onClick={() =>
                    void handleCycleStatus(item.cycle.id, "paused")
                  }
                  type="button"
                >
                  Pause
                </button>
                <button
                  disabled={isPending}
                  onClick={() =>
                    void handleCycleStatus(item.cycle.id, "completed")
                  }
                  type="button"
                >
                  Complete cycle
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {activeCycleCount < 3 ? (
        <details className={styles.composer} open={activeCycleCount === 0}>
          <summary>Add a growth cycle</summary>
          <form className={styles.formGrid} onSubmit={handleAddCycle}>
            <label>
              <span>Cycle name</span>
              <input
                name="title"
                placeholder="Build the next capability"
                required
              />
            </label>
            <label>
              <span>Area</span>
              <select defaultValue="general" name="areaId">
                {missionAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.wideField}>
              <span>Identity this reinforces</span>
              <input
                name="identityStatement"
                placeholder="I am someone who..."
                required
              />
            </label>
            <label className={styles.wideField}>
              <span>Minimum action</span>
              <input
                name="minimumAction"
                placeholder="The smallest action that still counts"
                required
              />
            </label>
            <label>
              <span>Weekly target</span>
              <input
                defaultValue="3"
                max="7"
                min="1"
                name="weeklyTarget"
                required
                type="number"
              />
            </label>
            <label>
              <span>Spatial destination</span>
              <select defaultValue="" name="destinationId">
                <option value="">No destination yet</option>
                {missionDestinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.label}
                  </option>
                ))}
              </select>
            </label>
            <button className={styles.primaryAction} type="submit">
              Add to Current Vector
            </button>
          </form>
        </details>
      ) : null}

      {pausedCycles.length > 0 ? (
        <details className={styles.composer}>
          <summary>Paused cycles · {pausedCycles.length}</summary>
          <div className={styles.compactList}>
            {pausedCycles.map((cycle) => (
              <div key={cycle.id}>
                <span>
                  <strong>{cycle.title}</strong>
                  <small>{findMissionArea(cycle.areaId).label}</small>
                </span>
                <button
                  disabled={pendingCycleId === cycle.id}
                  onClick={() => void handleCycleStatus(cycle.id, "active")}
                  type="button"
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <p aria-live="polite" className={styles.feedback}>
        {feedback}
      </p>
    </div>
  );
}
