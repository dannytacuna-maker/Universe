import {
  isIntelligenceDatabaseConfigured,
  saveIntelligenceBriefing,
  saveWeeklyIntelligenceBriefing,
} from "@/lib/server/intelligence-database";
import { analyzeWeeklyIntelligence } from "@/lib/server/intelligence-analysis";
import { ingestIntelligenceFeeds } from "@/lib/server/intelligence-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
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
    const result = await ingestIntelligenceFeeds();

    if (result.briefing === null) {
      console.error(
        "Intelligence ingestion failed for every configured source.",
        result.sources,
      );
      return Response.json(
        {
          error: "No monitored intelligence source was available.",
          sources: result.sources,
        },
        { status: 502 },
      );
    }

    await saveIntelligenceBriefing(result.briefing);

    let analysisPublished = false;

    try {
      const weeklyBriefing = await analyzeWeeklyIntelligence(result.briefing);
      await saveWeeklyIntelligenceBriefing(weeklyBriefing);
      analysisPublished = true;
    } catch (analysisError: unknown) {
      console.warn(
        "Weekly intelligence analysis was not published; the source briefing remains available.",
        analysisError,
      );
    }

    return Response.json({
      analysisPublished,
      briefingDate: result.briefing.briefingDate,
      generatedAt: result.briefing.generatedAt,
      itemCount: result.briefing.items.length,
      ok: true,
      partial: result.briefing.partial,
      sources: result.briefing.sources,
    });
  } catch (error: unknown) {
    console.error("Weekly intelligence ingestion failed.", error);
    const detail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? ` ${error.message}`
        : "";

    return Response.json(
      { error: `Weekly intelligence ingestion failed.${detail}` },
      { status: 500 },
    );
  }
}
