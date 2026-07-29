import type { UIMessage } from "ai";

import { createJarvisThreadTitle } from "@/lib/jarvis";
import {
  getJarvisThread,
  saveJarvisThread,
} from "@/lib/server/jarvis-database";
import { authorizeJarvisRequest } from "@/lib/server/jarvis-request";

export const runtime = "nodejs";

const threadIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseTranscriptMessage(value: unknown): UIMessage | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<UIMessage>;

  if (
    typeof candidate.id !== "string" ||
    (candidate.role !== "user" && candidate.role !== "assistant") ||
    !Array.isArray(candidate.parts)
  ) {
    return null;
  }

  const text = candidate.parts
    .filter(
      (part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
        typeof part === "object" && part !== null && part.type === "text",
    )
    .map((part) => part.text)
    .join(" ")
    .trim()
    .slice(0, 4_000);

  if (!text) return null;
  return {
    id: candidate.id.slice(0, 120),
    parts: [{ text, type: "text" }],
    role: candidate.role,
  };
}

export async function POST(request: Request) {
  const authorization = await authorizeJarvisRequest(request, {
    requireSameOrigin: true,
  });
  if (authorization.response) return authorization.response;

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid transcript." }, { status: 400 });
  }

  const candidate = body as Readonly<{ id?: unknown; messages?: unknown }>;
  if (
    typeof candidate.id !== "string" ||
    !threadIdPattern.test(candidate.id) ||
    !Array.isArray(candidate.messages)
  ) {
    return Response.json({ error: "Invalid transcript." }, { status: 400 });
  }

  const transcript = candidate.messages
    .slice(-30)
    .map(parseTranscriptMessage)
    .filter((message): message is UIMessage => message !== null);
  if (transcript.length === 0) {
    return Response.json(
      { error: "The transcript is empty." },
      { status: 400 },
    );
  }

  const thread = await getJarvisThread(authorization.owner.id, candidate.id);
  if (!thread) {
    return Response.json({ error: "Conversation not found." }, { status: 404 });
  }

  const knownIds = new Set(thread.messages.map((message) => message.id));
  const newMessages = transcript.filter((message) => !knownIds.has(message.id));
  const messages = [...thread.messages, ...newMessages].slice(-120);
  const firstUserMessage = messages.find((message) => message.role === "user");
  const title =
    thread.title === "New conversation" && firstUserMessage
      ? createJarvisThreadTitle(firstUserMessage)
      : thread.title;

  await saveJarvisThread(authorization.owner.id, thread.id, {
    messages,
    mode: thread.mode,
    title,
  });

  return Response.json({ messages, saved: true });
}
