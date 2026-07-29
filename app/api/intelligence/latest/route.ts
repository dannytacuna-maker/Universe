import {
  getLatestIntelligenceBriefing,
  isIntelligenceDatabaseConfigured,
} from "@/lib/server/intelligence-database";
import { getMissionAuthorization } from "@/lib/server/mission-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = {
  "Cache-Control": "private, no-store",
} as const;

export async function GET() {
  if (!isIntelligenceDatabaseConfigured()) {
    return Response.json(
      { error: "The Observatory is not configured yet." },
      { headers: privateHeaders, status: 503 },
    );
  }

  const authorization = await getMissionAuthorization();

  if (!authorization.authenticated) {
    return Response.json(
      { error: "Google sign-in is required." },
      { headers: privateHeaders, status: 401 },
    );
  }

  if (authorization.owner === null) {
    return Response.json(
      { error: "This Google account is not authorized for Mission Control." },
      { headers: privateHeaders, status: 403 },
    );
  }

  try {
    const briefing = await getLatestIntelligenceBriefing();

    if (briefing === null) {
      return Response.json(
        { briefing: null },
        { headers: privateHeaders, status: 404 },
      );
    }

    return Response.json({ briefing }, { headers: privateHeaders });
  } catch (error: unknown) {
    console.error("The latest intelligence briefing could not be read.", error);
    const detail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? ` ${error.message}`
        : "";

    return Response.json(
      { error: `The Observatory briefing is unavailable.${detail}` },
      { headers: privateHeaders, status: 500 },
    );
  }
}
