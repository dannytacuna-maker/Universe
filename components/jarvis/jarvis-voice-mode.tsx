"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import styles from "./jarvis.module.css";

type SpeechRecognitionAlternativeLike = Readonly<{
  transcript: string;
}>;

type SpeechRecognitionResultLike = Readonly<{
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}>;

type SpeechRecognitionEventLike = Readonly<{
  results: ArrayLike<SpeechRecognitionResultLike>;
}>;

type SpeechRecognitionErrorEventLike = Readonly<{
  error: string;
}>;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

type JarvisVoiceModeProps = Readonly<{
  disabled: boolean;
  isSpeaking: boolean;
  onClose: () => void;
  onTranscript: (transcript: string) => void;
  open: boolean;
}>;

const waveBars = [
  0.35, 0.7, 0.45, 1, 0.55, 0.85, 0.4, 0.95, 0.5, 0.75, 0.42,
] as const;

function getSpeechRecognition() {
  const voiceWindow = window as VoiceWindow;
  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
}

function describeRecognitionError(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access is blocked in this browser.";
  }
  if (error === "no-speech") return "Still listening…";
  if (error === "network") return "Browser speech recognition is unavailable.";
  return "Voice input could not start.";
}

export function JarvisVoiceMode({
  disabled,
  isSpeaking,
  onClose,
  onTranscript,
  open,
}: JarvisVoiceModeProps) {
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const openRef = useRef(open);
  const disabledRef = useRef(disabled);
  const onTranscriptRef = useRef(onTranscript);
  const restartTimerRef = useRef<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [typedDraft, setTypedDraft] = useState("");

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const clearRestart = () => {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };

    const haltRecognition = () => {
      clearRestart();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };

    if (!open || disabled) {
      haltRecognition();
      return () => {
        haltRecognition();
      };
    }

    const Recognition = getSpeechRecognition();
    if (Recognition === undefined) {
      restartTimerRef.current = window.setTimeout(() => {
        setErrorMessage(
          "Voice input is not supported here. You can still type below.",
        );
      }, 0);
      return () => clearRestart();
    }

    let cancelled = false;

    const armRecognition = () => {
      if (cancelled || !openRef.current || disabledRef.current) {
        return;
      }

      setErrorMessage(null);
      setTranscript("");
      const recognition = new Recognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-GB";
      recognition.onresult = (event) => {
        let nextTranscript = "";
        let hasFinalResult = false;

        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          const alternative = result?.[0];
          if (alternative === undefined) continue;
          nextTranscript += alternative.transcript;
          hasFinalResult ||= result?.isFinal === true;
        }

        const normalizedTranscript = nextTranscript.trim();
        setTranscript(normalizedTranscript);
        if (hasFinalResult && normalizedTranscript.length > 0) {
          onTranscriptRef.current(normalizedTranscript);
        }
      };
      recognition.onerror = (event) => {
        if (event.error === "aborted") {
          setIsListening(false);
          recognitionRef.current = null;
          return;
        }
        if (event.error === "no-speech" && openRef.current) {
          setIsListening(false);
          recognitionRef.current = null;
          restartTimerRef.current = window.setTimeout(() => {
            armRecognition();
          }, 350);
          return;
        }
        setErrorMessage(describeRecognitionError(event.error));
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        if (openRef.current && !disabledRef.current && !cancelled) {
          restartTimerRef.current = window.setTimeout(() => {
            armRecognition();
          }, 420);
        }
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      try {
        recognition.start();
      } catch {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    restartTimerRef.current = window.setTimeout(() => {
      armRecognition();
    }, 0);

    return () => {
      cancelled = true;
      haltRecognition();
    };
  }, [disabled, open]);

  if (!open || !hasMounted) {
    return null;
  }

  const statusLabel = errorMessage
    ? "CHANNEL FAULT"
    : isSpeaking
      ? "TRANSMITTING"
      : isListening
        ? "LISTENING"
        : disabled
          ? "PROCESSING"
          : "STANDBY";

  const statusDetail =
    errorMessage ??
    (transcript ||
      (isSpeaking
        ? "Synthesizing response…"
        : isListening
          ? "Audio uplink open — speak."
          : "Voice channel armed"));

  const reactorState = isSpeaking
    ? "speaking"
    : isListening
      ? "listening"
      : "idle";

  return createPortal(
    <div
      aria-label="Jarvis voice mode"
      aria-modal="true"
      className={styles.voiceMode}
      data-state={reactorState}
      role="dialog"
    >
      <div aria-hidden="true" className={styles.voiceModeGrid} />
      <div aria-hidden="true" className={styles.voiceModeScan} />

      <div aria-hidden="true" className={styles.voiceModeFrame}>
        <span className={styles.voiceModeCorner} data-pos="tl" />
        <span className={styles.voiceModeCorner} data-pos="tr" />
        <span className={styles.voiceModeCorner} data-pos="bl" />
        <span className={styles.voiceModeCorner} data-pos="br" />
      </div>

      <header className={styles.voiceModeHudTop}>
        <span className={styles.voiceModeBrand}>J.A.R.V.I.S.</span>
        <span className={styles.voiceModeHudMeta}>VOICE CHANNEL // ACTIVE</span>
        <span className={styles.voiceModeHudMeta} data-tone="ok">
          SYS.OK
        </span>
      </header>

      <div className={styles.voiceModeStage}>
        <div
          aria-hidden="true"
          className={styles.voiceModeReactor}
          data-state={reactorState}
        >
          <span className={styles.voiceModeRing} data-ring="outer" />
          <span className={styles.voiceModeRing} data-ring="mid" />
          <span className={styles.voiceModeRing} data-ring="inner" />
          <span className={styles.voiceModeCore} />
          <svg className={styles.voiceModeSpokes} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="18"
              stroke="currentColor"
              strokeWidth="0.6"
            />
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="28"
              stroke="currentColor"
              strokeDasharray="2 4"
              strokeWidth="0.45"
            />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + Math.cos(rad) * 12;
              const y1 = 50 + Math.sin(rad) * 12;
              const x2 = 50 + Math.cos(rad) * 34;
              const y2 = 50 + Math.sin(rad) * 34;
              return (
                <line
                  key={angle}
                  stroke="currentColor"
                  strokeWidth="0.55"
                  x1={x1}
                  x2={x2}
                  y1={y1}
                  y2={y2}
                />
              );
            })}
          </svg>
          <div className={styles.voiceModeWave}>
            {waveBars.map((scale, index) => (
              <span
                key={index}
                style={
                  {
                    "--bar-scale": scale,
                    "--bar-delay": `${index * 70}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>

        <div aria-live="polite" className={styles.voiceModeCopy}>
          <strong>{statusLabel}</strong>
          <span>{statusDetail}</span>
        </div>

        <div aria-hidden="true" className={styles.voiceModeReadout}>
          <span>CH-01</span>
          <span>MIC {isListening ? "HOT" : "STBY"}</span>
          <span>TTS {isSpeaking ? "LIVE" : "IDLE"}</span>
          <span>ENC AES</span>
        </div>
      </div>

      <form
        className={styles.voiceModeBar}
        onSubmit={(event) => {
          event.preventDefault();
          const text = typedDraft.trim();
          if (!text || disabled) return;
          setTypedDraft("");
          onTranscript(text);
        }}
      >
        <label
          className={styles.voiceModeBarLabel}
          htmlFor="jarvis-voice-input"
        >
          MANUAL UPLINK
        </label>
        <div className={styles.voiceModeBarRow}>
          <input
            aria-label="Type to Jarvis"
            id="jarvis-voice-input"
            onChange={(event) => setTypedDraft(event.target.value)}
            placeholder="Transmit text…"
            value={typedDraft}
          />
          <button
            aria-label="End voice channel"
            className={styles.voiceModeClose}
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
