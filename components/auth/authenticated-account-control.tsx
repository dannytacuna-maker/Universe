"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useEffect, useId, useRef, useState } from "react";

import type {
  MissionCloudState,
  MissionSyncStatus,
} from "@/lib/mission-record-sync";

import styles from "./authenticated-account-control.module.css";

type AuthenticatedAccountControlProps = Readonly<{
  ownerEmail: string;
  status: MissionSyncStatus;
}>;

const syncStateLabels = {
  checking: "Checking",
  error: "Sync issue",
  local: "Local only",
  locked: "Locked",
  offline: "Offline",
  synced: "Synchronized",
  syncing: "Synchronizing",
} satisfies Record<MissionCloudState, string>;

export function AuthenticatedAccountControl({
  ownerEmail,
  status,
}: AuthenticatedAccountControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const signOutRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const accountInitial = ownerEmail.trim().charAt(0).toUpperCase() || "D";
  const statusLabel = syncStateLabels[status.state];

  useEffect(() => {
    if (!isOpen) return;

    const focusFrame = window.requestAnimationFrame(() => {
      signOutRef.current?.focus();
    });

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.accountControl} ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Account for ${ownerEmail}. ${statusLabel}.`}
        className={styles.trigger}
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className={styles.avatar}>
          {accountInitial}
        </span>
        <span className={styles.triggerText}>
          <strong>Account</strong>
          <small>{statusLabel}</small>
        </span>
        <span
          aria-hidden="true"
          className={styles.statusDot}
          data-state={status.state}
        />
      </button>

      {isOpen ? (
        <div
          aria-label="Mission Control account"
          className={styles.panel}
          id={panelId}
          role="dialog"
        >
          <div className={styles.identity}>
            <span className={styles.panelLabel}>Authenticated identity</span>
            <strong>{ownerEmail}</strong>
          </div>

          <div aria-live="polite" className={styles.syncSummary}>
            <div>
              <span
                aria-hidden="true"
                className={styles.statusDot}
                data-state={status.state}
              />
              <strong>{statusLabel}</strong>
            </div>
            <p>{status.detail}</p>
            {status.pendingCount > 0 ? (
              <small>
                {status.pendingCount}{" "}
                {status.pendingCount === 1 ? "change" : "changes"} waiting
              </small>
            ) : null}
          </div>

          <SignOutButton>
            <button
              className={styles.signOutButton}
              ref={signOutRef}
              type="button"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      ) : null}
    </div>
  );
}
