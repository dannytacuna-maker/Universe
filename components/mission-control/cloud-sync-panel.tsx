"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";

import type { MissionSyncStatus } from "@/lib/mission-record-sync";

import styles from "./mission-operating-deck.module.css";

type CloudSyncPanelProps = Readonly<{
  isConfigured: boolean;
  onRefresh: () => Promise<void>;
  ownerEmail: string | null;
  status: MissionSyncStatus;
}>;

function formatSyncTime(value: string | null) {
  if (value === null) {
    return "Not synchronized yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function CloudSyncPanel({
  isConfigured,
  onRefresh,
  ownerEmail,
  status,
}: CloudSyncPanelProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleRefresh = async () => {
    setIsPending(true);
    setFeedback(null);

    try {
      await onRefresh();
      setFeedback("Your records are synchronized.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error ? error.message : "Synchronization failed.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className={styles.syncPanel}>
      <header className={styles.panelHeader}>
        <div>
          <span>Data reliability</span>
          <h2>Personal cloud</h2>
        </div>
        <span className={styles.syncState} data-state={status.state}>
          {status.state}
        </span>
      </header>

      <div className={styles.syncSummary}>
        <p>{status.detail}</p>
        <dl>
          <div>
            <dt>Google account</dt>
            <dd>{ownerEmail ?? "Not connected"}</dd>
          </div>
          <div>
            <dt>Last alignment</dt>
            <dd>{formatSyncTime(status.syncedAt)}</dd>
          </div>
          <div>
            <dt>Queued changes</dt>
            <dd>{status.pendingCount}</dd>
          </div>
        </dl>
      </div>

      {isConfigured && ownerEmail !== null ? (
        <div className={styles.syncActions}>
          <button
            disabled={isPending}
            onClick={() => void handleRefresh()}
            type="button"
          >
            {isPending ? "Synchronizing…" : "Synchronize now"}
          </button>
          <SignOutButton>
            <button type="button">Sign out</button>
          </SignOutButton>
        </div>
      ) : null}

      {feedback !== null ? (
        <p aria-live="polite" className={styles.formFeedback}>
          {feedback}
        </p>
      ) : null}

      <p className={styles.syncPrivacy}>
        IndexedDB remains the offline cache. The server owns the synchronized
        copy, and only Daniel&apos;s approved Google identity can access it.
      </p>
    </section>
  );
}
