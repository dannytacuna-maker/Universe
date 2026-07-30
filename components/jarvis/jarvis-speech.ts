"use client";

/** Prefer calm British / formal male voices for browser fallback. */
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

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;

function pickJarvisVoice(): SpeechSynthesisVoice | null {
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

function speakWithBrowser(
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

async function speakWithElevenLabs(
  text: string,
  options?: Readonly<{
    onEnd?: () => void;
    onStart?: () => void;
  }>,
) {
  const response = await fetch("/api/jarvis/speech", {
    body: JSON.stringify({ text }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (response.status === 503) {
    return false;
  }

  if (!response.ok) {
    throw new Error("ElevenLabs speech request failed.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  activeAudio = audio;
  activeObjectUrl = objectUrl;

  const cleanup = () => {
    if (activeObjectUrl === objectUrl) {
      URL.revokeObjectURL(objectUrl);
      activeObjectUrl = null;
    }
    if (activeAudio === audio) {
      activeAudio = null;
    }
  };

  audio.onplay = () => options?.onStart?.();
  audio.onended = () => {
    cleanup();
    options?.onEnd?.();
  };
  audio.onerror = () => {
    cleanup();
    options?.onEnd?.();
  };

  await audio.play();
  return true;
}

export async function speakAsJarvis(
  text: string,
  options?: Readonly<{
    onEnd?: () => void;
    onStart?: () => void;
  }>,
) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    options?.onEnd?.();
    return;
  }

  cancelJarvisSpeech();

  try {
    const usedElevenLabs = await speakWithElevenLabs(trimmed, options);
    if (usedElevenLabs) return;
  } catch (error) {
    console.error("Jarvis ElevenLabs speech fell back to browser TTS", error);
  }

  speakWithBrowser(trimmed, options);
}

export function cancelJarvisSpeech() {
  if (activeAudio !== null) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (activeObjectUrl !== null) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
