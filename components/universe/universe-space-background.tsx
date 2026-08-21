"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

const universeVideoPath = "/assets/environments/universe-cinematic.mp4";
const universePosterPath = "/assets/environments/universe-cinematic.webp";

export function UniverseSpaceBackground() {
  const shouldReduceMotion = useReducedMotion();
  const motionEnabled = shouldReduceMotion === false;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!motionEnabled || video === null) {
      return;
    }

    const play = () => {
      if (!document.hidden) {
        void video.play().catch(() => undefined);
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
        return;
      }

      play();
    };

    video.addEventListener("loadeddata", play, { once: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    video.load();
    play();

    return () => {
      video.removeEventListener("loadeddata", play);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      video.pause();
    };
  }, [motionEnabled]);

  if (!motionEnabled) {
    return (
      <div
        aria-hidden="true"
        className="universe-space-background universe-space-background--still"
        style={{ backgroundImage: `url(${universePosterPath})` }}
      />
    );
  }

  return (
    <video
      aria-hidden="true"
      className="universe-space-background"
      disablePictureInPicture
      loop
      muted
      playsInline
      poster={universePosterPath}
      preload="auto"
      ref={videoRef}
      src={universeVideoPath}
    />
  );
}
