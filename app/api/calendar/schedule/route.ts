import { fetchPrimaryCalendarSchedule } from "@/lib/server/google-calendar";
import {
  getMissionAuthorization,
  isMissionAuthConfigured,
} from "@/lib/server/mission-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!isMissionAuthConfigured()) {
    return Response.json(
      {
        days: [],
        detail: "Mission Control auth is not configured.",
        status: "unavailable",
      },
      { status: 503 },
    );
  }

  const authorization = await getMissionAuthorization();
  if (authorization.owner === null) {
    return Response.json(
      {
        days: [],
        detail: authorization.authenticated
          ? "This Google identity is not authorized for Mission Control."
          : "Sign in to load your schedule.",
        status: "unavailable",
      },
      { status: authorization.authenticated ? 403 : 401 },
    );
  }

  const schedule = await fetchPrimaryCalendarSchedule(
    authorization.owner.userId,
  );

  return Response.json(schedule, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
