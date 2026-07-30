"use client";

/** Prefer calm British / formal male voices for an MCU Jarvis feel. */
const preferredVoicePatterns = [
  /google uk english male/i,
  /microsoft george/i,
  /microsoft ryan/i,
  /daniel/i,
  /arthur/i,
  /oliver/i,
  /british/i,
  /en-gb/i,
  /uk english/i,
] as const;

export function pickJarvisVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  for (const pattern of preferredVoicePatterns) {
    const match = voices.find((voice) => pattern.test(voice.name));
    if (match !== undefined) return match;
  }

  return (
    voices.find(
      (voice) => /^en(-|_)/i.test(voice.lang) && voice.localService,
    ) ??
    voices.find((voice) => /^en(-|_)/i.test(voice.lang)) ??
    voices[0] ??
    null
  );
}

export function speakAsJarvis(
  text: string,
  options?: Readonly<{
    onEnd?: () => void;
    onStart?: () => void;
  }>,
) {
  if (!("speechSynthesis" in window) || text.trim().length === 0) {
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  const voice = pickJarvisVoice();
  if (voice !== null) utterance.voice = voice;
  utterance.rate = 0.92;
  utterance.pitch = 0.92;
  utterance.volume = 1;
  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = () => options?.onEnd?.();

  // Voices can load async in Chromium; retry once if empty.
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const lateVoice = pickJarvisVoice();
      if (lateVoice !== null) utterance.voice = lateVoice;
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.speak(utterance);
    };
    return;
  }

  window.speechSynthesis.speak(utterance);
}

export function cancelJarvisSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
