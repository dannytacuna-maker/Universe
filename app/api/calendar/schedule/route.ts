import {
  getStoredCalendarIcsUrl,
  isCalendarFeedStoreConfigured,
  saveCalendarIcsUrl,
} from "@/lib/server/calendar-feed-store";
import { fetchIcsCalendarSchedule } from "@/lib/server/calendar-ics";
import {
  getMissionAuthorization,
  isMissionAuthConfigured,
  isSameOriginRequest,
} from "@/lib/server/mission-auth";

export const runtime = "nodejs";

function jsonSchedule(
  body: Readonly<{
    detail: string | null;
    events?: readonly unknown[];
    status: "ok" | "needs_calendar_access" | "unavailable";
  }>,
  status = 200,
) {
  return Response.json(
    {
      detail: body.detail,
      events: body.events ?? [],
      status: body.status,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
      status,
    },
  );
}

export async function GET() {
  try {
    if (!isMissionAuthConfigured()) {
      return jsonSchedule(
        {
          detail: "Mission Control auth is not configured.",
          status: "unavailable",
        },
        503,
      );
    }

    const authorization = await getMissionAuthorization();
    if (authorization.owner === null) {
      return jsonSchedule(
        {
          detail: authorization.authenticated
            ? "This Google identity is not authorized for Mission Control."
            : "Sign in to load your schedule.",
          status: "unavailable",
        },
        authorization.authenticated ? 403 : 401,
      );
    }

    const icsUrl = await getStoredCalendarIcsUrl(authorization.owner.id);
    if (!icsUrl) {
      return jsonSchedule({
        detail:
          "Paste your Google Calendar secret iCal URL once. Calendar → Settings → Daniel Acuna → Integrate calendar → Secret address in iCal format.",
        status: "needs_calendar_access",
      });
    }

    return jsonSchedule(await fetchIcsCalendarSchedule(icsUrl));
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Could not load schedule.";
    return jsonSchedule(
      {
        detail,
        status: "unavailable",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isMissionAuthConfigured()) {
      return jsonSchedule(
        {
          detail: "Mission Control auth is not configured.",
          status: "unavailable",
        },
        503,
      );
    }

    if (!isSameOriginRequest(request)) {
      return jsonSchedule(
        {
          detail: "Cross-origin calendar updates are blocked.",
          status: "unavailable",
        },
        403,
      );
    }

    const authorization = await getMissionAuthorization();
    if (authorization.owner === null) {
      return jsonSchedule(
        {
          detail: "Sign in to connect your calendar feed.",
          status: "unavailable",
        },
        401,
      );
    }

    if (!isCalendarFeedStoreConfigured()) {
      return jsonSchedule(
        {
          detail:
            "Cloud storage is not configured. Set MISSION_CONTROL_CALENDAR_ICS_URL instead.",
          status: "unavailable",
        },
        503,
      );
    }

    const body = (await request.json()) as { icsUrl?: unknown };
    const icsUrl = typeof body.icsUrl === "string" ? body.icsUrl : "";
    const saved = await saveCalendarIcsUrl(authorization.owner.id, icsUrl);
    const schedule = await fetchIcsCalendarSchedule(saved);
    return jsonSchedule(schedule);
  } catch (error) {
    return jsonSchedule(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Could not save calendar feed.",
        status: "unavailable",
      },
      400,
    );
  }
}
