import { clerkClient } from "@clerk/nextjs/server";

import type {
  CalendarScheduleEvent,
  CalendarSchedulePayload,
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
    // Google all-day ends are exclusive next-day dates.
    instant.setUTCDate(instant.getUTCDate() - 1);
    instant.setUTCHours(23, 59, 59, 999);
  }

  return { allDay: true as const, instant };
}

async function getGoogleAccessToken(userId: string) {
  const client = await clerkClient();
  const response = await client.users.getUserOauthAccessToken(
    userId,
    "oauth_google",
  );
  return response.data[0]?.token ?? null;
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

function isAuthFailure(response: Response, payload: GoogleEventsResponse) {
  const code = payload.error?.code;
  const status = payload.error?.status;
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

  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) {
    return {
      detail: "Connect Google Calendar to show your upcoming schedule.",
      events: [],
      status: "needs_calendar_access",
    };
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
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const payload = (await response.json()) as GoogleEventsResponse;

  if (!response.ok) {
    if (isAuthFailure(response, payload)) {
      return {
        detail:
          "Calendar access is not granted yet. Connect Google Calendar to continue.",
        events: [],
        status: "needs_calendar_access",
      };
    }

    return {
      detail: payload.error?.message ?? "Google Calendar is unavailable.",
      events: [],
      status: "unavailable",
    };
  }

  return {
    detail: null,
    events: (payload.items ?? [])
      .map(mapGoogleEvent)
      .filter((event): event is CalendarScheduleEvent => event !== null),
    status: "ok",
  };
}
