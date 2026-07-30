"use client";

import { useEffect, useRef, useState } from "react";

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

type JarvisVoiceSessionProps = Readonly<{
  disabled: boolean;
  onTranscript: (transcript: string) => void;
  /** When true, mic stays armed and restarts after each reply. */
  sessionActive: boolean;
  onSessionActiveChange: (active: boolean) => void;
}>;

function getSpeechRecognition() {
  const voiceWindow = window as VoiceWindow;
  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
}

function describeRecognitionError(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access is blocked in this browser.";
  }
  if (error === "no-speech") return "Standing by. Tap the mic or speak again.";
  if (error === "network") return "Browser speech recognition is unavailable.";
  return "Voice input could not start. You can still type to Jarvis.";
}

export function JarvisVoiceSession({
  disabled,
  onSessionActiveChange,
  onTranscript,
  sessionActive,
}: JarvisVoiceSessionProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionActiveRef = useRef(sessionActive);
  const disabledRef = useRef(disabled);
  const onTranscriptRef = useRef(onTranscript);
  const restartTimerRef = useRef<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

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

    if (!sessionActive || disabled) {
      haltRecognition();
      return () => {
        haltRecognition();
      };
    }

    const Recognition = getSpeechRecognition();
    if (Recognition === undefined) {
      restartTimerRef.current = window.setTimeout(() => {
        setErrorMessage(
          "Voice input is not supported here. You can still type to Jarvis.",
        );
        onSessionActiveChange(false);
      }, 0);
      return () => clearRestart();
    }

    let cancelled = false;

    const armRecognition = () => {
      if (cancelled || !sessionActiveRef.current || disabledRef.current) {
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
        if (event.error === "no-speech" && sessionActiveRef.current) {
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
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          onSessionActiveChange(false);
        }
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        if (sessionActiveRef.current && !disabledRef.current && !cancelled) {
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
  }, [disabled, onSessionActiveChange, sessionActive]);

  const toggleSession = () => {
    if (sessionActive) {
      onSessionActiveChange(false);
      setTranscript("");
      return;
    }
    setErrorMessage(null);
    onSessionActiveChange(true);
  };

  return (
    <div className={styles.voiceRegion} data-open={sessionActive}>
      <button
        aria-expanded={sessionActive}
        aria-label={
          sessionActive
            ? "End Jarvis voice session"
            : "Start Jarvis voice session"
        }
        className={styles.iconButton}
        disabled={disabled && !sessionActive}
        onClick={toggleSession}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M5.5 11.5v.5a6.5 6.5 0 0 0 13 0v-.5M12 18.5V22M9 22h6" />
        </svg>
      </button>

      {sessionActive || errorMessage ? (
        <div aria-live="polite" className={styles.voicePanel}>
          <div
            className={styles.voiceStatus}
            data-status={isListening ? "connected" : "standby"}
          >
            <span aria-hidden="true" className={styles.voiceOrb} />
            <div>
              <strong>
                {errorMessage
                  ? "Voice unavailable"
                  : isListening
                    ? "Listening"
                    : disabled
                      ? "Speaking"
                      : "Standing by"}
              </strong>
              <span>
                {errorMessage ??
                  (transcript ||
                    (isListening
                      ? "Go ahead, sir."
                      : "Voice channel open — speak anytime"))}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
