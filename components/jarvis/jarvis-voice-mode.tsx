"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
    ? "Channel unavailable"
    : isSpeaking
      ? "Speaking"
      : isListening
        ? "Listening"
        : disabled
          ? "Working"
          : "Ready";

  const statusDetail =
    errorMessage ??
    (transcript ||
      (isSpeaking
        ? "Responding…"
        : isListening
          ? "Go ahead."
          : "Voice channel open"));

  const orbState = isSpeaking ? "speaking" : isListening ? "listening" : "idle";

  return createPortal(
    <div
      aria-label="Jarvis voice mode"
      aria-modal="true"
      className={styles.voiceMode}
      role="dialog"
    >
      <div className={styles.voiceModeStage}>
        <div
          aria-hidden="true"
          className={styles.voiceModeOrb}
          data-state={orbState}
        >
          <span className={styles.voiceModeOrbCore} />
          <span className={styles.voiceModeOrbHalo} />
          <span className={styles.voiceModeOrbBloom} />
        </div>

        <div aria-live="polite" className={styles.voiceModeCopy}>
          <strong>{statusLabel}</strong>
          <span>{statusDetail}</span>
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
        <input
          aria-label="Type to Jarvis"
          onChange={(event) => setTypedDraft(event.target.value)}
          placeholder="Or type here"
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
      </form>
    </div>,
    document.body,
  );
}
