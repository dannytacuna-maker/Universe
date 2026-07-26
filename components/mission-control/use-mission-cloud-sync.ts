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
  configured: boolean;
}>;

export function useMissionCloudSync() {
  const [status, setStatus] = useState<MissionSyncStatus>(() =>
    getMissionSyncStatus(),
  );
  const [isConfigured, setIsConfigured] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/mission/session", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const session = (await response.json()) as SessionStatus;
    setIsConfigured(session.configured);

    if (session.authenticated) {
      await synchronizeMissionRecords();
    } else {
      setStatus({
        detail: session.configured
          ? "Cloud sync is locked. Local records remain available."
          : "Using private storage on this device.",
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

  const unlock = useCallback(async (accessKey: string) => {
    const response = await fetch("/api/mission/session", {
      body: JSON.stringify({ accessKey }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(body?.error ?? "Cloud access could not be unlocked.");
    }

    setIsConfigured(true);
    await synchronizeMissionRecords();
  }, []);

  const lock = useCallback(async () => {
    await fetch("/api/mission/session", {
      credentials: "same-origin",
      method: "DELETE",
    });
    setStatus({
      detail: "Cloud sync is locked. Local records remain available.",
      pendingCount: 0,
      state: "locked",
      syncedAt: null,
    });
  }, []);

  return { isConfigured, lock, refresh, status, unlock };
}
