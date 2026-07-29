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
}>;

function getSpeechRecognition() {
  const voiceWindow = window as VoiceWindow;
  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
}

function describeRecognitionError(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access is blocked in this browser.";
  }
  if (error === "no-speech") return "I did not hear anything. Try again.";
  if (error === "network") return "Browser speech recognition is unavailable.";
  return "Voice input could not start. You can still type to Jarvis.";
}

export function JarvisVoiceSession({
  disabled,
  onTranscript,
}: JarvisVoiceSessionProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const startListening = () => {
    const Recognition = getSpeechRecognition();
    if (Recognition === undefined) {
      setErrorMessage(
        "Voice input is not supported here. You can still type to Jarvis.",
      );
      return;
    }
    if (disabled) return;

    setErrorMessage(null);
    setTranscript("");
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
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
        onTranscript(normalizedTranscript);
      }
    };
    recognition.onerror = (event) => {
      setErrorMessage(describeRecognitionError(event.error));
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className={styles.voiceRegion} data-open={isListening}>
      <button
        aria-expanded={isListening}
        aria-label={isListening ? "Stop listening" : "Ask Jarvis by voice"}
        className={styles.iconButton}
        disabled={disabled}
        onClick={isListening ? stopListening : startListening}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M5.5 11.5v.5a6.5 6.5 0 0 0 13 0v-.5M12 18.5V22M9 22h6" />
        </svg>
      </button>

      {isListening || errorMessage ? (
        <div aria-live="polite" className={styles.voicePanel}>
          <div className={styles.voiceStatus} data-status="connected">
            <span aria-hidden="true" className={styles.voiceOrb} />
            <div>
              <strong>{isListening ? "Listening" : "Voice unavailable"}</strong>
              <span>
                {errorMessage ?? (transcript || "Speak naturally, then pause")}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
