import { clerkClient } from "@clerk/nextjs/server";

import {
  googleCalendarEventsReadonlyScope,
  googleCalendarReadonlyScope,
  type CalendarScheduleEvent,
  type CalendarSchedulePayload,
} from "@/lib/calendar-schedule";

type GoogleEventDate = Readonly<{
  date?: string;
  dateTime?: string;
}>;

type GoogleCalendarEvent = Readonly<{
  end?: GoogleEventDate;
  htmlLink?: string;
  id?: string;
  location?: string;
  start?: GoogleEventDate;
  summary?: string;
}>;

type GoogleEventsResponse = Readonly<{
  error?: Readonly<{ code?: number; message?: string; status?: string }>;
  items?: readonly GoogleCalendarEvent[];
}>;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseEventInstant(value: GoogleEventDate | undefined, isEnd: boolean) {
  if (value?.dateTime) {
    return { allDay: false as const, instant: new Date(value.dateTime) };
  }

  if (!value?.date) return null;

  const parts = value.date.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return null;
  }

  const instant = new Date(Date.UTC(year, month - 1, day));
  if (isEnd) {
    instant.setUTCDate(instant.getUTCDate() - 1);
    instant.setUTCHours(23, 59, 59, 999);
  }

  return { allDay: true as const, instant };
}

function needsCalendarAccessPayload(
  detail = "Connect Google Calendar to show your upcoming schedule.",
): CalendarSchedulePayload {
  return {
    detail,
    events: [],
    status: "needs_calendar_access",
  };
}

function unavailablePayload(detail: string): CalendarSchedulePayload {
  return {
    detail,
    events: [],
    status: "unavailable",
  };
}

function hasCalendarScope(scopes: readonly string[] | undefined) {
  if (!scopes || scopes.length === 0) return true;

  return scopes.some(
    (scope) =>
      scope === googleCalendarReadonlyScope ||
      scope === googleCalendarEventsReadonlyScope ||
      scope === "https://www.googleapis.com/auth/calendar",
  );
}

async function readJsonBody<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function getGoogleAccessToken(userId: string) {
  const client = await clerkClient();

  try {
    const response = await client.users.getUserOauthAccessToken(
      userId,
      "google",
    );
    const token = response.data[0];
    if (!token?.token) return { kind: "missing" as const };
    if (!hasCalendarScope(token.scopes)) {
      return { kind: "missing_scope" as const };
    }

    return { kind: "ok" as const, token: token.token };
  } catch (error) {
    const code =
      error && typeof error === "object" && "errors" in error
        ? (
            error as {
              errors?: readonly Readonly<{ code?: string }>[];
            }
          ).errors?.[0]?.code
        : undefined;

    if (
      code === "oauth_token_retrieval_error" ||
      code === "resource_not_found" ||
      code === "not_found"
    ) {
      return { kind: "missing" as const };
    }

    throw error;
  }
}

function mapGoogleEvent(
  event: GoogleCalendarEvent,
): CalendarScheduleEvent | null {
  if (!event.id || !event.start) return null;

  const start = parseEventInstant(event.start, false);
  if (start === null) return null;

  const end = parseEventInstant(event.end, true);

  return {
    allDay: start.allDay,
    endsAt: end?.instant.toISOString() ?? null,
    htmlLink: event.htmlLink ?? null,
    id: event.id,
    location: event.location?.trim() || null,
    startsAt: start.instant.toISOString(),
    title: event.summary?.trim() || "Untitled event",
  };
}

function isAuthFailure(
  response: Response,
  payload: GoogleEventsResponse | null,
) {
  const code = payload?.error?.code;
  const status = payload?.error?.status;
  return (
    response.status === 401 ||
    response.status === 403 ||
    code === 401 ||
    code === 403 ||
    status === "PERMISSION_DENIED" ||
    status === "UNAUTHENTICATED"
  );
}

export async function fetchPrimaryCalendarSchedule(
  userId: string,
  options: Readonly<{ dayCount?: number; now?: Date }> = {},
): Promise<CalendarSchedulePayload> {
  const dayCount = options.dayCount ?? 7;
  const now = options.now ?? new Date();
  const rangeEnd = addDays(now, dayCount);

  const access = await getGoogleAccessToken(userId);
  if (access.kind !== "ok") {
    return needsCalendarAccessPayload(
      access.kind === "missing_scope"
        ? "Google Calendar permission is missing. Reconnect once to show your week."
        : "Connect Google Calendar once to show your week automatically.",
    );
  }

  const params = new URLSearchParams({
    maxResults: "50",
    orderBy: "startTime",
    singleEvents: "true",
    timeMax: rangeEnd.toISOString(),
    timeMin: now.toISOString(),
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${access.token}` },
    },
  );

  const payload = await readJsonBody<GoogleEventsResponse>(response);

  if (!response.ok) {
    if (isAuthFailure(response, payload)) {
      return needsCalendarAccessPayload(
        "Calendar access expired. Reconnect once to restore your schedule.",
      );
    }

    return unavailablePayload(
      payload?.error?.message ?? "Google Calendar is unavailable.",
    );
  }

  return {
    detail: null,
    events: (payload?.items ?? [])
      .map(mapGoogleEvent)
      .filter((event): event is CalendarScheduleEvent => event !== null),
    status: "ok",
  };
}
