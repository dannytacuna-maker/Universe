"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  deleteMissionCalendarRecord,
  listMissionCalendarRecords,
  saveMissionCalendarRecord,
  type MissionCalendarDraft,
  type MissionCalendarRecord,
} from "@/lib/mission-calendar";

const listeners = new Set<() => void>();
let snapshot: readonly MissionCalendarRecord[] = [];
let initialized = false;

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  snapshot = listMissionCalendarRecords();
}

function emitCalendarChange() {
  ensureInitialized();
  snapshot = listMissionCalendarRecords();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureInitialized();
  return snapshot;
}

const serverSnapshot: readonly MissionCalendarRecord[] = [];

function getServerSnapshot() {
  return serverSnapshot;
}

export function useMissionCalendar() {
  const records = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const save = useCallback((draft: MissionCalendarDraft) => {
    const record = saveMissionCalendarRecord(draft);
    emitCalendarChange();
    return record;
  }, []);

  const remove = useCallback((id: string) => {
    deleteMissionCalendarRecord(id);
    emitCalendarChange();
  }, []);

  return {
    records,
    remove,
    save,
  };
}
