import { isMissionDatabaseConfigured } from "@/lib/server/mission-record-database";
import {
  clearMissionSession,
  createMissionSession,
  hasValidMissionSession,
  isMissionSessionConfigured,
  isSameOriginRequest,
  verifyMissionAccessKey,
} from "@/lib/server/mission-session";

export const runtime = "nodejs";

export async function GET() {
  const configured =
    isMissionSessionConfigured() && isMissionDatabaseConfigured();

  return Response.json({
    authenticated: configured && (await hasValidMissionSession()),
    configured,
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  if (!isMissionSessionConfigured() || !isMissionDatabaseConfigured()) {
    return Response.json(
      { error: "Cloud sync is not configured yet." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const accessKey =
    typeof body === "object" && body !== null && "accessKey" in body
      ? body.accessKey
      : null;
  const isValid =
    typeof accessKey === "string" && verifyMissionAccessKey(accessKey);
  const remainingDelay = 350 - (Date.now() - startedAt);

  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }

  if (!isValid) {
    return Response.json(
      { error: "Access key not recognized." },
      { status: 401 },
    );
  }

  await createMissionSession();
  return Response.json({ authenticated: true });
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  await clearMissionSession();
  return Response.json({ authenticated: false });
}
