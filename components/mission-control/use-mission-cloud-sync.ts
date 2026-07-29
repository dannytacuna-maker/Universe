"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getMissionSyncStatus,
  subscribeToMissionSyncStatus,
  synchronizeMissionRecords,
  type MissionSyncStatus,
} from "@/lib/mission-record-sync";

type SessionStatus = Readonly<{
  authenticated: boolean;
  authorized: boolean;
  configured: boolean;
  ownerEmail: string | null;
}>;

export function useMissionCloudSync() {
  const [status, setStatus] = useState<MissionSyncStatus>(() =>
    getMissionSyncStatus(),
  );
  const [isConfigured, setIsConfigured] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/mission/session", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const session = (await response.json()) as SessionStatus;
    setIsConfigured(session.configured);
    setOwnerEmail(session.ownerEmail);

    if (session.authenticated && session.authorized) {
      await synchronizeMissionRecords();
    } else {
      setStatus({
        detail: session.configured
          ? "Google sign-in is required. Local records remain available."
          : "Cloud synchronization is not configured.",
        pendingCount: 0,
        state: session.configured ? "locked" : "local",
        syncedAt: null,
      });
    }
  }, []);

  useEffect(() => subscribeToMissionSyncStatus(setStatus), []);

  useEffect(() => {
    void navigator.storage?.persist?.();
    const initializationTimer = window.setTimeout(() => {
      void refresh().catch((error: unknown) => {
        setStatus({
          detail:
            error instanceof Error
              ? error.message
              : "Cloud status could not be checked.",
          pendingCount: 0,
          state: "error",
          syncedAt: null,
        });
      });
    }, 0);

    const synchronizeWhenAvailable = () => {
      if (document.visibilityState === "visible") {
        void synchronizeMissionRecords();
      }
    };

    window.addEventListener("online", synchronizeWhenAvailable);
    document.addEventListener("visibilitychange", synchronizeWhenAvailable);
    return () => {
      window.clearTimeout(initializationTimer);
      window.removeEventListener("online", synchronizeWhenAvailable);
      document.removeEventListener(
        "visibilitychange",
        synchronizeWhenAvailable,
      );
    };
  }, [refresh]);

  return { isConfigured, ownerEmail, refresh, status };
}

export type MissionCloudSyncController = ReturnType<typeof useMissionCloudSync>;
