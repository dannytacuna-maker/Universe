import { fetchPrimaryCalendarSchedule } from "@/lib/server/google-calendar";
import {
  getMissionAuthorization,
  isMissionAuthConfigured,
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

    const schedule = await fetchPrimaryCalendarSchedule(
      authorization.owner.userId,
    );

    return jsonSchedule(schedule);
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
