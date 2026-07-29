"use client";

import { useEffect, useRef, useState } from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";
import { useModifierKeyLabel } from "@/lib/modifier-key-label";

import type { MissionDestinationId } from "./mission-operating-record";
import type { MissionIntelligence } from "./mission-intelligence";
import { CapturePanel } from "./capture-panel";
import { CloudSyncPanel } from "./cloud-sync-panel";
import { CurrentVectorPanel } from "./current-vector-panel";
import { ExperimentsPanel } from "./experiments-panel";
import { IdentityPanel } from "./identity-panel";
import styles from "./mission-operating-deck.module.css";
import { useMissionOperatingSystem } from "./use-mission-operating-system";
import type { MissionCloudSyncController } from "./use-mission-cloud-sync";
import { WeeklyReviewPanel } from "./weekly-review-panel";

export const openMissionDeckEvent = "mission-control:open-mission";

export function requestOpenMissionDeck() {
  window.dispatchEvent(new CustomEvent(openMissionDeckEvent));
}

type MissionOperatingDeckProps = Readonly<{
  cloudSync: MissionCloudSyncController;
  intelligence: MissionIntelligence;
  onNavigate: (destinationId: MissionDestinationId) => void;
}>;

type DeckPanelId =
  "capture" | "experiments" | "identity" | "review" | "sync" | "vector";

const deckPanels = [
  { id: "vector", label: "Current Vector", marker: "01" },
  { id: "capture", label: "Capture", marker: "02" },
  { id: "review", label: "Review", marker: "03" },
  { id: "experiments", label: "Experiments", marker: "04" },
  { id: "identity", label: "Identity", marker: "05" },
] as const satisfies readonly {
  id: DeckPanelId;
  label: string;
  marker: string;
}[];

export function MissionOperatingDeck({
  cloudSync,
  intelligence,
  onNavigate,
}: MissionOperatingDeckProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const [activePanel, setActivePanel] = useState<DeckPanelId>("vector");
  const [isOpen, setIsOpen] = useState(false);
  const modifierKey = useModifierKeyLabel();
  const operatingSystem = useMissionOperatingSystem(intelligence.activityDates);
  const activeEvidenceCount = operatingSystem.currentVector.filter(
    (item) => item.isCompleteToday,
  ).length;
  const captureInboxCount = operatingSystem.captures.filter(
    (capture) => capture.status === "inbox",
  ).length;

  const openDeck = () => {
    activateInterfaceSurface("mission");
    setIsOpen(true);
  };

  const closeDeck = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => {
          if (current) {
            window.requestAnimationFrame(() => launcherRef.current?.focus());
            return false;
          }

          activateInterfaceSurface("mission");
          return true;
        });
      }
    };

    const handleOpenRequest = () => {
      openDeck();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(openMissionDeckEvent, handleOpenRequest);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(openMissionDeckEvent, handleOpenRequest);
    };
  }, []);

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId === "mission") {
          return;
        }

        setIsOpen(false);
      }),
    [],
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog === null) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const navigate = (destinationId: MissionDestinationId) => {
    closeDeck();
    onNavigate(destinationId);
  };

  return (
    <>
      <button
        aria-label="Open Mission deck. Evidence, capture, and weekly review."
        aria-controls="mission-operating-deck"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`${styles.launcher} mission-dock-launcher`}
        onClick={openDeck}
        ref={launcherRef}
        title="Evidence, capture, and weekly review"
        type="button"
      >
        <span aria-hidden="true" className={styles.launcherMark}>
          <i />
        </span>
        <span>
          <strong>Mission</strong>
          <small>
            {operatingSystem.isLoading
              ? "Aligning"
              : cloudSync.status.state === "syncing"
                ? "Synchronizing"
                : `${activeEvidenceCount}/${operatingSystem.currentVector.length} aligned today`}
          </small>
        </span>
        <kbd>
          {modifierKey}
          {modifierKey === "⌘" ? "" : "+"}K
        </kbd>
      </button>

      <dialog
        aria-labelledby="mission-deck-title"
        className={styles.dialog}
        id="mission-operating-deck"
        onCancel={(event) => {
          event.preventDefault();
          closeDeck();
        }}
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className={styles.deck}>
          <header className={styles.deckHeader}>
            <div className={styles.deckIdentity}>
              <span aria-hidden="true" className={styles.deckMark}>
                <i />
              </span>
              <div>
                <span>Mission Control</span>
                <h1 id="mission-deck-title">
                  {operatingSystem.identity?.name ??
                    "Personal operating system"}
                </h1>
              </div>
            </div>
            <button
              aria-label="Close Mission deck"
              autoFocus
              className={styles.closeButton}
              onClick={closeDeck}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className={styles.deckBody}>
            <nav aria-label="Mission deck sections" className={styles.deckNav}>
              <div className={styles.deckCompass}>
                <span>North star</span>
                <p>
                  {operatingSystem.identity?.northStar ??
                    "Preparing your operating system."}
                </p>
              </div>
              <div className={styles.navItems}>
                {deckPanels.map((panel) => (
                  <button
                    aria-current={activePanel === panel.id ? "page" : undefined}
                    data-active={activePanel === panel.id}
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    type="button"
                  >
                    <span>{panel.marker}</span>
                    {panel.label}
                    {panel.id === "capture" && captureInboxCount > 0 ? (
                      <i>{captureInboxCount}</i>
                    ) : null}
                  </button>
                ))}
              </div>
              <button
                aria-label="Open personal cloud status"
                className={styles.deckStatus}
                onClick={() => setActivePanel("sync")}
                type="button"
              >
                <span
                  aria-hidden="true"
                  data-error={
                    operatingSystem.storageError !== null ||
                    cloudSync.status.state === "error"
                  }
                />
                <p>{operatingSystem.storageError ?? cloudSync.status.detail}</p>
              </button>
            </nav>

            <div className={styles.deckContent}>
              {operatingSystem.isLoading ||
              operatingSystem.identity === null ? (
                <div aria-live="polite" className={styles.loadingState}>
                  <span aria-hidden="true" />
                  <p>Aligning your universe…</p>
                </div>
              ) : activePanel === "vector" ? (
                <CurrentVectorPanel
                  currentVector={operatingSystem.currentVector}
                  cycles={operatingSystem.cycles}
                  onAddCycle={operatingSystem.addCycle}
                  onNavigate={navigate}
                  onSetCycleStatus={operatingSystem.setCycleStatus}
                  onToggleEvidence={operatingSystem.toggleEvidence}
                  recoveryMode={operatingSystem.identity.recoveryMode}
                />
              ) : activePanel === "capture" ? (
                <CapturePanel
                  captures={operatingSystem.captures}
                  onAdd={operatingSystem.addCapture}
                  onSetStatus={operatingSystem.setCaptureStatus}
                />
              ) : activePanel === "review" ? (
                <WeeklyReviewPanel
                  onSubmit={operatingSystem.submitWeeklyReview}
                  patterns={intelligence.patterns}
                  reflections={intelligence.reflections}
                  reviews={operatingSystem.reviews}
                />
              ) : activePanel === "experiments" ? (
                <ExperimentsPanel
                  experiments={operatingSystem.experiments}
                  onAdd={operatingSystem.addExperiment}
                  onConclude={operatingSystem.concludeExperiment}
                />
              ) : activePanel === "identity" ? (
                <IdentityPanel
                  evidence={intelligence.identityEvidence}
                  identity={operatingSystem.identity}
                  onUpdate={operatingSystem.updateIdentity}
                />
              ) : (
                <CloudSyncPanel
                  isConfigured={cloudSync.isConfigured}
                  onRefresh={cloudSync.refresh}
                  ownerEmail={cloudSync.ownerEmail}
                  status={cloudSync.status}
                />
              )}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
