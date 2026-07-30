import { createHash } from "node:crypto";

import { GatewayError, gateway } from "@ai-sdk/gateway";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
  validateUIMessages,
} from "ai";

import { missionControlAiModels } from "@/lib/ai-models";
import {
  createJarvisThreadTitle,
  isJarvisMode,
  type JarvisMode,
  type JarvisNavigationContext,
} from "@/lib/jarvis";
import { createJarvisInstructions } from "@/lib/jarvis-instructions";
import {
  consumeJarvisRequestAllowance,
  getJarvisThread,
  isJarvisConfigured,
  saveJarvisThread,
} from "@/lib/server/jarvis-database";
import { authorizeJarvisRequest } from "@/lib/server/jarvis-request";
import { createJarvisTools } from "@/lib/server/jarvis-tools";

export const maxDuration = 60;
export const runtime = "nodejs";

const threadIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const modelSettings: Record<
  JarvisMode,
  Readonly<{
    maxOutputTokens: number;
  }>
> = {
  quick: {
    maxOutputTokens: 900,
  },
  analyze: {
    maxOutputTokens: 1_800,
  },
  "deep-review": {
    maxOutputTokens: 2_800,
  },
};

type ChatRequestBody = Readonly<{
  context?: JarvisNavigationContext;
  id?: unknown;
  message?: unknown;
  mode?: unknown;
}>;

function isNavigationContext(value: unknown): value is JarvisNavigationContext {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<JarvisNavigationContext>;
  return (
    ["galaxy", "planet", "system", "universe"].includes(
      candidate.level ?? "",
    ) &&
    [candidate.galaxyId, candidate.planetId, candidate.systemId].every(
      (item) => item === null || typeof item === "string",
    )
  );
}

function getMessageTextLength(message: UIMessage) {
  return message.parts.reduce(
    (total, part) => total + (part.type === "text" ? part.text.length : 0),
    0,
  );
}

function describeJarvisStreamError(error: unknown) {
  console.error("Jarvis response failed", error);

  if (GatewayError.isInstance(error)) {
    if (error.statusCode === 429) {
      return "Request volume is high right now. Wait a moment and continue.";
    }

    if (error.statusCode === 402) {
      return "The intelligence route is temporarily unavailable. Try again shortly.";
    }

    return "Jarvis could not reach the intelligence service. Try again shortly.";
  }

  return "That response did not complete. Try again.";
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

  const withinAllowance = await consumeJarvisRequestAllowance(
    authorization.owner.id,
  );
  if (!withinAllowance) {
    return Response.json(
      {
        error: "Too many requests right now. Try again in a minute.",
      },
      { status: 429 },
    );
  }

  const body: ChatRequestBody = await request.json().catch(() => ({}));
  const threadId = typeof body.id === "string" ? body.id : "";
  if (!threadIdPattern.test(threadId)) {
    return Response.json(
      { error: "Invalid conversation ID." },
      { status: 400 },
    );
  }

  const thread = await getJarvisThread(authorization.owner.id, threadId);
  if (!thread) {
    return Response.json({ error: "Conversation not found." }, { status: 404 });
  }

  const mode = isJarvisMode(body.mode) ? body.mode : thread.mode;
  const context = isNavigationContext(body.context) ? body.context : null;
  const tools = createJarvisTools(authorization.owner.id);

  let messages: UIMessage[];
  try {
    messages = await validateUIMessages({
      messages: [...thread.messages, body.message],
    });
  } catch {
    return Response.json(
      { error: "Invalid conversation message." },
      { status: 400 },
    );
  }

  const latestMessage = messages.at(-1);
  if (
    !latestMessage ||
    latestMessage.role !== "user" ||
    getMessageTextLength(latestMessage) === 0 ||
    getMessageTextLength(latestMessage) > 8_000 ||
    messages.length > 120
  ) {
    return Response.json(
      {
        error: "The message is empty or exceeds conversation limits.",
      },
      { status: 400 },
    );
  }

  const settings = modelSettings[mode];
  const safetyIdentifier = createHash("sha256")
    .update(authorization.owner.userId)
    .digest("hex");
  const result = streamText({
    instructions: createJarvisInstructions(context, mode),
    maxOutputTokens: settings.maxOutputTokens,
    messages: await convertToModelMessages(messages),
    model: gateway(missionControlAiModels.primary),
    providerOptions: {
      gateway: {
        models: [missionControlAiModels.fallback],
        tags: ["feature:jarvis", `mode:${mode}`],
        user: safetyIdentifier,
      },
    },
    stopWhen: isStepCount(6),
    temperature: 0.45,
    tools,
  });

  result.consumeStream();

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      generateMessageId: () => crypto.randomUUID(),
      onError: describeJarvisStreamError,
      onEnd: async ({ messages: completedMessages }) => {
        const title =
          thread.title === "New conversation"
            ? createJarvisThreadTitle(latestMessage)
            : thread.title;
        await saveJarvisThread(authorization.owner.id, threadId, {
          messages: completedMessages,
          mode,
          title,
        });
      },
      originalMessages: messages,
      stream: result.stream,
    }),
  });
}
