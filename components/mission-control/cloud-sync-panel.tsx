"use client";

import { useState, type FormEvent } from "react";

import type { MissionSyncStatus } from "@/lib/mission-record-sync";

import styles from "./mission-operating-deck.module.css";

type CloudSyncPanelProps = Readonly<{
  isConfigured: boolean;
  onLock: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUnlock: (accessKey: string) => Promise<void>;
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
  onLock,
  onRefresh,
  onUnlock,
  status,
}: CloudSyncPanelProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const accessKey = formData.get("accessKey");

    if (typeof accessKey !== "string" || accessKey.length === 0) {
      setFeedback("Enter the private access key.");
      return;
    }

    setIsPending(true);
    setFeedback(null);

    try {
      await onUnlock(accessKey);
      form.reset();
      setFeedback("Private cloud synchronization is active.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error ? error.message : "Cloud access failed.",
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
          <h2>Private cloud</h2>
        </div>
        <span className={styles.syncState} data-state={status.state}>
          {status.state}
        </span>
      </header>

      <div className={styles.syncSummary}>
        <p>{status.detail}</p>
        <dl>
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

      {status.state === "locked" && isConfigured ? (
        <form className={styles.syncUnlock} onSubmit={handleUnlock}>
          <label>
            <span>Private access key</span>
            <input
              autoComplete="current-password"
              name="accessKey"
              placeholder="Unlock this device"
              type="password"
            />
          </label>
          <button disabled={isPending} type="submit">
            {isPending ? "Unlocking…" : "Unlock cloud sync"}
          </button>
        </form>
      ) : status.state === "synced" ? (
        <div className={styles.syncActions}>
          <button
            disabled={isPending}
            onClick={() => void onRefresh()}
            type="button"
          >
            Synchronize now
          </button>
          <button onClick={() => void onLock()} type="button">
            Lock this device
          </button>
        </div>
      ) : null}

      {feedback !== null ? (
        <p aria-live="polite" className={styles.formFeedback}>
          {feedback}
        </p>
      ) : null}

      <p className={styles.syncPrivacy}>
        IndexedDB remains the offline cache. The server owns the synchronized
        copy; your access key never enters the client bundle.
      </p>
    </section>
  );
}
