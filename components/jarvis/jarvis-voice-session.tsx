"use client";

import { gateway } from "@ai-sdk/gateway";
import { experimental_useRealtime } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Experimental_RealtimeSessionConfig, UIMessage } from "ai";

import styles from "./jarvis.module.css";

const realtimeModel = gateway.experimental_realtime("openai/gpt-realtime-mini");

const voiceInstructions =
  "You are Jarvis, Daniel's personal Mission Control voice assistant. Speak naturally, calmly, and concisely. Lead with a direct answer. You are read-only and must not claim to change Mission Control data.";

const realtimeSessionConfig: Partial<Experimental_RealtimeSessionConfig> = {
  inputAudioTranscription: { model: "gpt-realtime-whisper" },
  instructions: voiceInstructions,
  outputAudioTranscription: {},
  outputModalities: ["audio"],
  turnDetection: {
    prefixPaddingMs: 240,
    silenceDurationMs: 650,
    threshold: 0.48,
    type: "semantic-vad",
  },
  voice: "marin",
};

type JarvisVoiceSessionProps = Readonly<{
  onMessagesSaved: (messages: UIMessage[]) => void;
  threadId: string;
}>;

function messageText(message: UIMessage) {
  return message.parts
    .filter(
      (
        part,
      ): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join(" ");
}

export function JarvisVoiceSession({
  onMessagesSaved,
  threadId,
}: JarvisVoiceSessionProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const realtime = experimental_useRealtime({
    api: { token: "/api/jarvis/voice/session" },
    model: realtimeModel,
    onError: (error) => setErrorMessage(error.message),
    sessionConfig: realtimeSessionConfig,
  });
  const realtimeRef = useRef(realtime);

  useEffect(() => {
    realtimeRef.current = realtime;
  }, [realtime]);

  useEffect(() => {
    if (
      realtime.status === "connected" &&
      mediaStreamRef.current &&
      !realtime.isCapturing
    ) {
      realtime.startAudioCapture(mediaStreamRef.current);
    }
  }, [realtime, realtime.isCapturing, realtime.status]);

  const releaseMicrophone = useCallback(() => {
    for (const track of mediaStreamRef.current?.getTracks() ?? []) track.stop();
    mediaStreamRef.current = null;
  }, []);

  useEffect(
    () => () => {
      realtimeRef.current.stopAudioCapture();
      realtimeRef.current.disconnect();
      releaseMicrophone();
    },
    [releaseMicrophone],
  );

  const saveTranscript = useCallback(async () => {
    if (realtime.messages.length === 0) return;

    const response = await fetch("/api/jarvis/voice/transcript", {
      body: JSON.stringify({ id: threadId, messages: realtime.messages }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) return;

    const payload: unknown = await response.json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "messages" in payload &&
      Array.isArray((payload as Readonly<{ messages?: unknown }>).messages)
    ) {
      onMessagesSaved(
        (payload as Readonly<{ messages: UIMessage[] }>).messages,
      );
    }
  }, [onMessagesSaved, realtime.messages, threadId]);

  const stopVoice = useCallback(async () => {
    realtime.stopAudioCapture();
    realtime.stopPlayback();
    realtime.disconnect();
    releaseMicrophone();
    await saveTranscript();
  }, [realtime, releaseMicrophone, saveTranscript]);

  const handleVoiceToggle = async () => {
    if (isOpen) {
      await stopVoice();
      setIsOpen(false);
      return;
    }

    setErrorMessage(null);
    setIsOpen(true);

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      await realtime.connect();
    } catch (error) {
      releaseMicrophone();
      setErrorMessage(
        error instanceof Error ? error.message : "Microphone access failed.",
      );
    }
  };

  return (
    <div className={styles.voiceRegion} data-open={isOpen}>
      <button
        aria-expanded={isOpen}
        aria-label={
          isOpen ? "End voice conversation" : "Start voice conversation"
        }
        className={styles.iconButton}
        onClick={() => void handleVoiceToggle()}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M5.5 11.5v.5a6.5 6.5 0 0 0 13 0v-.5M12 18.5V22M9 22h6" />
        </svg>
      </button>

      {isOpen ? (
        <div className={styles.voicePanel}>
          <div className={styles.voiceStatus} data-status={realtime.status}>
            <span aria-hidden="true" className={styles.voiceOrb} />
            <div>
              <strong>
                {realtime.status === "connected"
                  ? realtime.isPlaying
                    ? "Jarvis is speaking"
                    : realtime.isCapturing
                      ? "Listening"
                      : "Voice ready"
                  : realtime.status === "connecting"
                    ? "Establishing voice"
                    : "Voice session"}
              </strong>
              <span>Microphone active only during this session</span>
            </div>
          </div>

          <div aria-live="polite" className={styles.voiceTranscript}>
            {realtime.messages.slice(-4).map((message) => (
              <p data-role={message.role} key={message.id}>
                <strong>{message.role === "user" ? "You" : "Jarvis"}</strong>
                <span>{messageText(message)}</span>
              </p>
            ))}
          </div>

          {errorMessage ? (
            <p className={styles.errorText}>{errorMessage}</p>
          ) : null}

          <button
            className={styles.endVoiceButton}
            onClick={() => void handleVoiceToggle()}
            type="button"
          >
            End voice
          </button>
        </div>
      ) : null}
    </div>
  );
}
