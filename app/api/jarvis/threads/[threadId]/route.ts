import { isJarvisMode } from "@/lib/jarvis";
import {
  archiveJarvisThread,
  getJarvisThread,
  updateJarvisThread,
} from "@/lib/server/jarvis-database";
import { authorizeJarvisRequest } from "@/lib/server/jarvis-request";

export const runtime = "nodejs";

type RouteContext = Readonly<{ params: Promise<{ threadId: string }> }>;

function isThreadId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(request: Request, context: RouteContext) {
  const authorization = await authorizeJarvisRequest(request);
  if (authorization.response) return authorization.response;

  const { threadId } = await context.params;
  if (!isThreadId(threadId)) {
    return Response.json(
      { error: "Invalid conversation ID." },
      { status: 400 },
    );
  }

  const thread = await getJarvisThread(authorization.owner.id, threadId);
  return thread
    ? Response.json({ thread })
    : Response.json({ error: "Conversation not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await authorizeJarvisRequest(request, {
    requireSameOrigin: true,
  });
  if (authorization.response) return authorization.response;

  const { threadId } = await context.params;
  if (!isThreadId(threadId)) {
    return Response.json(
      { error: "Invalid conversation ID." },
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const candidate = body as Readonly<{ mode?: unknown; title?: unknown }>;
  const mode = isJarvisMode(candidate.mode) ? candidate.mode : undefined;
  const title =
    typeof candidate.title === "string"
      ? candidate.title.slice(0, 80)
      : undefined;
  const thread = await updateJarvisThread(authorization.owner.id, threadId, {
    mode,
    title,
  });

  return thread
    ? Response.json({ thread })
    : Response.json({ error: "Conversation not found." }, { status: 404 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const authorization = await authorizeJarvisRequest(request, {
    requireSameOrigin: true,
  });
  if (authorization.response) return authorization.response;

  const { threadId } = await context.params;
  if (!isThreadId(threadId)) {
    return Response.json(
      { error: "Invalid conversation ID." },
      { status: 400 },
    );
  }

  await archiveJarvisThread(authorization.owner.id, threadId);
  return new Response(null, { status: 204 });
}
