import {
  addDays,
  startOfLocalDay,
  toDateKey,
  type CalendarEventTone,
  type CalendarScheduleEvent,
} from "@/lib/calendar-schedule";

export type MissionCalendarRecurrence = "once" | "weekly";

export type MissionCalendarRecord = Readonly<{
  endTime: string;
  id: string;
  location: string | null;
  recurrence: MissionCalendarRecurrence;
  /** YYYY-MM-DD when recurrence is once */
  dateKey: string | null;
  source: "custom" | "seed";
  startTime: string;
  title: string;
  tone: CalendarEventTone;
  updatedAt: string;
  /** JS getDay(): 0 Sun … 6 Sat when recurrence is weekly */
  weekday: number | null;
}>;

export type MissionCalendarDraft = Readonly<{
  dateKey: string;
  endTime: string;
  id?: string;
  location: string;
  recurrence: MissionCalendarRecurrence;
  startTime: string;
  title: string;
  tone: CalendarEventTone;
  weekday: number;
}>;

type MissionCalendarStore = Readonly<{
  records: readonly MissionCalendarRecord[];
  removedSeedIds: readonly string[];
  version: 2;
}>;

const storageKey = "mission-control.calendar.v2";

/**
 * Seeded weekly timetable from the owner's Google Calendar week view.
 * Used until the user edits/adds/removes events in the Home calendar.
 */
const seedTemplates = [
  {
    id: "seed-language-a-mon",
    weekday: 1,
    title: "LANGUAGE A III",
    startTime: "10:30",
    endTime: "12:30",
    location: "A372 · M33",
    tone: "university",
  },
  {
    id: "seed-logistics-mon",
    weekday: 1,
    title: "LOGISTICS & DISTRIBUTION",
    startTime: "16:30",
    endTime: "18:30",
    location: "E133 · M41",
    tone: "university",
  },
  {
    id: "seed-ethics-mon",
    weekday: 1,
    title: "BUSINESS ETHICS",
    startTime: "18:30",
    endTime: "20:30",
    location: "E123 · M41",
    tone: "university",
  },
  {
    id: "seed-cima-mon",
    weekday: 1,
    title: "CIMA Jiu-Jitsu Training",
    startTime: "20:00",
    endTime: "21:30",
    location: null,
    tone: "jiujitsu",
  },
  {
    id: "seed-language-a-tue",
    weekday: 2,
    title: "LANGUAGE A III",
    startTime: "14:30",
    endTime: "16:30",
    location: "A351 · M33",
    tone: "university",
  },
  {
    id: "seed-mergers-tue",
    weekday: 2,
    title: "MERGERS & ACQUISITIONS",
    startTime: "16:30",
    endTime: "18:30",
    location: "E135 · M41",
    tone: "university",
  },
  {
    id: "seed-ethics-tue",
    weekday: 2,
    title: "BUSINESS ETHICS",
    startTime: "18:30",
    endTime: "20:30",
    location: "E125 · M41",
    tone: "university",
  },
  {
    id: "seed-uem-tue",
    weekday: 2,
    title: "Jiu-Jitsu Training UEM",
    startTime: "20:30",
    endTime: "21:30",
    location: null,
    tone: "jiujitsu",
  },
  {
    id: "seed-emerging-wed",
    weekday: 3,
    title: "EMERGING POWERS & MARKETS",
    startTime: "14:30",
    endTime: "16:30",
    location: "E132 · M41",
    tone: "university",
  },
  {
    id: "seed-hr-thu",
    weekday: 4,
    title: "HUMAN RESOURCES",
    startTime: "14:30",
    endTime: "16:30",
    location: "E128 · M32",
    tone: "university",
  },
  {
    id: "seed-logistics-thu",
    weekday: 4,
    title: "LOGISTICS & DISTRIBUTION",
    startTime: "16:30",
    endTime: "18:30",
    location: "E133 · M41",
    tone: "university",
  },
  {
    id: "seed-mergers-thu",
    weekday: 4,
    title: "MERGERS & ACQUISITIONS",
    startTime: "18:30",
    endTime: "20:30",
    location: "E114 · M41",
    tone: "university",
  },
  {
    id: "seed-open-mat-fri",
    weekday: 5,
    title: "CIMA Jiu-Jitsu Open Mat",
    startTime: "11:00",
    endTime: "12:30",
    location: null,
    tone: "jiujitsu",
  },
  {
    id: "seed-hr-fri",
    weekday: 5,
    title: "HUMAN RESOURCES",
    startTime: "12:30",
    endTime: "14:30",
    location: "C223 · M32",
    tone: "university",
  },
  {
    id: "seed-emerging-fri",
    weekday: 5,
    title: "EMERGING POWERS & MARKETS",
    startTime: "16:30",
    endTime: "18:30",
    location: "E121 · M41",
    tone: "university",
  },
] as const;

function emptyStore(): MissionCalendarStore {
  return { records: [], removedSeedIds: [], version: 2 };
}

function seedRecords(): readonly MissionCalendarRecord[] {
  const updatedAt = "1970-01-01T00:00:00.000Z";
  return seedTemplates.map((template) => ({
    dateKey: null,
    endTime: template.endTime,
    id: template.id,
    location: template.location,
    recurrence: "weekly" as const,
    source: "seed" as const,
    startTime: template.startTime,
    title: template.title,
    tone: template.tone,
    updatedAt,
    weekday: template.weekday,
  }));
}

function readStore(): MissionCalendarStore {
  if (typeof window === "undefined") return emptyStore();

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<MissionCalendarStore>;
    if (parsed.version !== 2 || !Array.isArray(parsed.records)) {
      return emptyStore();
    }
    return {
      records: parsed.records as MissionCalendarRecord[],
      removedSeedIds: Array.isArray(parsed.removedSeedIds)
        ? (parsed.removedSeedIds as string[])
        : [],
      version: 2,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: MissionCalendarStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(store));
}

export function listMissionCalendarRecords(): readonly MissionCalendarRecord[] {
  const store = readStore();
  const removed = new Set(store.removedSeedIds);
  const overrides = new Map(
    store.records.map((record) => [record.id, record] as const),
  );
  const seedIds = new Set<string>(
    seedTemplates.map((template) => template.id),
  );

  const fromSeeds = seedRecords()
    .filter((record) => !removed.has(record.id))
    .map((record) => overrides.get(record.id) ?? record);

  const customs = store.records.filter((record) => !seedIds.has(record.id));

  return [...fromSeeds, ...customs].sort((left, right) => {
    const leftKey = `${left.weekday ?? 9}-${left.startTime}-${left.title}`;
    const rightKey = `${right.weekday ?? 9}-${right.startTime}-${right.title}`;
    return leftKey.localeCompare(rightKey);
  });
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cal-${crypto.randomUUID()}`;
  }
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeClock(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function validateDraft(draft: MissionCalendarDraft) {
  const title = draft.title.trim();
  const startTime = normalizeClock(draft.startTime);
  const endTime = normalizeClock(draft.endTime);
  if (!title) throw new Error("Add a title for the event.");
  if (!startTime || !endTime) {
    throw new Error("Use 24-hour times like 14:30.");
  }
  if (endTime <= startTime) {
    throw new Error("End time must be after the start time.");
  }
  if (draft.recurrence === "once" && !/^\d{4}-\d{2}-\d{2}$/.test(draft.dateKey)) {
    throw new Error("Pick a valid date.");
  }
  if (
    draft.recurrence === "weekly" &&
    (!Number.isInteger(draft.weekday) || draft.weekday < 0 || draft.weekday > 6)
  ) {
    throw new Error("Pick a weekday for the recurring event.");
  }

  return {
    endTime,
    location: draft.location.trim() || null,
    startTime,
    title,
  };
}

export function saveMissionCalendarRecord(
  draft: MissionCalendarDraft,
): MissionCalendarRecord {
  const normalized = validateDraft(draft);
  const store = readStore();
  const now = new Date().toISOString();
  const seedIds = new Set<string>(
    seedTemplates.map((template) => template.id),
  );
  const id = draft.id?.trim() || createId();
  const existing = store.records.find((record) => record.id === id);
  const source: MissionCalendarRecord["source"] =
    existing?.source ?? (seedIds.has(id) ? "seed" : "custom");

  const nextRecord: MissionCalendarRecord = {
    dateKey: draft.recurrence === "once" ? draft.dateKey : null,
    endTime: normalized.endTime,
    id,
    location: normalized.location,
    recurrence: draft.recurrence,
    source,
    startTime: normalized.startTime,
    title: normalized.title,
    tone: draft.tone,
    updatedAt: now,
    weekday: draft.recurrence === "weekly" ? draft.weekday : null,
  };

  const without = store.records.filter((record) => record.id !== id);
  writeStore({
    ...store,
    records: [...without, nextRecord],
    removedSeedIds: store.removedSeedIds.filter((seedId) => seedId !== id),
  });

  return nextRecord;
}

export function deleteMissionCalendarRecord(id: string) {
  const store = readStore();
  const seedIds = new Set<string>(
    seedTemplates.map((template) => template.id),
  );

  if (seedIds.has(id)) {
    writeStore({
      records: store.records.filter((record) => record.id !== id),
      removedSeedIds: store.removedSeedIds.includes(id)
        ? store.removedSeedIds
        : [...store.removedSeedIds, id],
      version: 2,
    });
    return;
  }

  writeStore({
    ...store,
    records: store.records.filter((record) => record.id !== id),
  });
}

function toLocalDateTimeString(day: Date, clock: string) {
  const [hoursText = "0", minutesText = "0"] = clock.split(":");
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  const hh = String(Number(hoursText)).padStart(2, "0");
  const mm = String(Number(minutesText)).padStart(2, "0");
  return `${year}-${month}-${date}T${hh}:${mm}:00`;
}

function recordMatchesDay(record: MissionCalendarRecord, day: Date) {
  if (record.recurrence === "once") {
    return record.dateKey === toDateKey(day);
  }
  return record.weekday === day.getDay();
}

export function buildMissionCalendarEvents(
  rangeStart: Date,
  rangeEnd: Date,
  records: readonly MissionCalendarRecord[] = listMissionCalendarRecords(),
): readonly CalendarScheduleEvent[] {
  const start = startOfLocalDay(rangeStart);
  const end = startOfLocalDay(rangeEnd);
  if (end < start) return [];

  const events: CalendarScheduleEvent[] = [];
  let cursor = start;

  while (cursor <= end) {
    const dateKey = toDateKey(cursor);

    for (const record of records) {
      if (!recordMatchesDay(record, cursor)) continue;

      events.push({
        allDay: false,
        endsAt: toLocalDateTimeString(cursor, record.endTime),
        htmlLink: null,
        id:
          record.recurrence === "weekly"
            ? `${record.id}:${dateKey}`
            : record.id,
        location: record.location,
        startsAt: toLocalDateTimeString(cursor, record.startTime),
        title: record.title,
        tone: record.tone,
      });
    }

    cursor = addDays(cursor, 1);
  }

  return events.sort((left, right) =>
    left.startsAt < right.startsAt ? -1 : left.startsAt > right.startsAt ? 1 : 0,
  );
}

export function missionCalendarEventsAround(
  anchor: Date,
  weekRadius = 8,
  records?: readonly MissionCalendarRecord[],
): readonly CalendarScheduleEvent[] {
  const center = startOfLocalDay(anchor);
  return buildMissionCalendarEvents(
    addDays(center, -weekRadius * 7),
    addDays(center, weekRadius * 7 + 6),
    records,
  );
}

export function resolveRecordIdFromOccurrenceId(occurrenceId: string) {
  const separator = occurrenceId.lastIndexOf(":");
  if (separator === -1) return occurrenceId;
  const maybeDate = occurrenceId.slice(separator + 1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) {
    return occurrenceId.slice(0, separator);
  }
  return occurrenceId;
}

export function getMissionCalendarRecord(
  id: string,
): MissionCalendarRecord | null {
  return listMissionCalendarRecords().find((record) => record.id === id) ?? null;
}
