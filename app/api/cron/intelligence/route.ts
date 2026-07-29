import {
  isIntelligenceDatabaseConfigured,
  saveIntelligenceBriefing,
} from "@/lib/server/intelligence-database";
import { ingestOfficialIntelligenceFeeds } from "@/lib/server/intelligence-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const runtime = "nodejs";

function hasValidCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET;

  return (
    secret !== undefined &&
    secret.length > 0 &&
    request.headers.get("authorization") === `Bearer ${secret}`
  );
}

export async function GET(request: Request) {
  if (!hasValidCronAuthorization(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isIntelligenceDatabaseConfigured()) {
    return Response.json(
      { error: "The Observatory database is not configured." },
      { status: 503 },
    );
  }

  try {
    const result = await ingestOfficialIntelligenceFeeds();

    if (result.briefing === null) {
      console.error(
        "Intelligence ingestion failed for every configured source.",
        result.sources,
      );
      return Response.json(
        {
          error: "No official intelligence source was available.",
          sources: result.sources,
        },
        { status: 502 },
      );
    }

    await saveIntelligenceBriefing(result.briefing);

    return Response.json({
      briefingDate: result.briefing.briefingDate,
      generatedAt: result.briefing.generatedAt,
      itemCount: result.briefing.items.length,
      ok: true,
      partial: result.briefing.partial,
      sources: result.briefing.sources,
    });
  } catch (error: unknown) {
    console.error("Daily intelligence ingestion failed.", error);
    const detail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? ` ${error.message}`
        : "";

    return Response.json(
      { error: `Daily intelligence ingestion failed.${detail}` },
      { status: 500 },
    );
  }
}
