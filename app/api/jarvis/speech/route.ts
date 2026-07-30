import { authorizeJarvisRequest } from "@/lib/server/jarvis-request";

export const maxDuration = 30;
export const runtime = "nodejs";

const maxSpeechCharacters = 2_500;

/** Default Jarvis voice — override with ELEVENLABS_VOICE_ID. */
const defaultVoiceId = "lUTamkMw7gOzZbFIwmq4";

type SpeechRequestBody = Readonly<{
  text?: unknown;
}>;

function getElevenLabsConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    modelId: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_flash_v2_5",
    voiceId: process.env.ELEVENLABS_VOICE_ID?.trim() || defaultVoiceId,
  };
}

export async function POST(request: Request) {
  const authorization = await authorizeJarvisRequest(request, {
    requireSameOrigin: true,
  });
  if (authorization.response) return authorization.response;

  const config = getElevenLabsConfig();
  if (config === null) {
    return Response.json(
      { configured: false, error: "ElevenLabs voice is not configured." },
      { status: 503 },
    );
  }

  const body: SpeechRequestBody = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (text.length === 0) {
    return Response.json(
      { error: "Speech text is required." },
      { status: 400 },
    );
  }

  if (text.length > maxSpeechCharacters) {
    return Response.json(
      { error: "Speech text exceeds the voice limit." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}?output_format=mp3_44100_128`,
    {
      body: JSON.stringify({
        model_id: config.modelId,
        text,
        voice_settings: {
          similarity_boost: 0.75,
          stability: 0.45,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": config.apiKey,
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    console.error(
      "ElevenLabs speech failed",
      response.status,
      await response.text().catch(() => ""),
    );
    return Response.json(
      { error: "Jarvis voice could not be synthesized." },
      { status: 502 },
    );
  }

  const audio = await response.arrayBuffer();
  return new Response(audio, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "audio/mpeg",
    },
  });
}
