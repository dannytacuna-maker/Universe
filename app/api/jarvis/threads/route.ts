import { isJarvisMode } from "@/lib/jarvis";
import {
  createJarvisThread,
  isJarvisConfigured,
  listJarvisThreads,
} from "@/lib/server/jarvis-database";
import { authorizeJarvisRequest } from "@/lib/server/jarvis-request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeJarvisRequest(request);
  if (authorization.response) return authorization.response;

  if (!isJarvisConfigured()) {
    return Response.json({ configured: false, threads: [] });
  }

  const threads = await listJarvisThreads(authorization.owner.id);
  return Response.json({ configured: true, threads });
}

export async function POST(request: Request) {
  const authorization = await authorizeJarvisRequest(request, {
    requireSameOrigin: true,
  });
  if (authorization.response) return authorization.response;

  if (!isJarvisConfigured()) {
    return Response.json(
      { error: "Jarvis is not configured on this deployment." },
      { status: 503 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const mode =
    typeof body === "object" && body !== null && "mode" in body
      ? (body as Readonly<{ mode?: unknown }>).mode
      : null;
  const thread = await createJarvisThread(
    authorization.owner.id,
    isJarvisMode(mode) ? mode : "quick",
  );

  return Response.json({ thread }, { status: 201 });
}
