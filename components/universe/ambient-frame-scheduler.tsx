"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

const AMBIENT_FRAME_RATE = 30;
const FRAME_INTERVAL_MS = 1000 / AMBIENT_FRAME_RATE;

type AmbientFrameSchedulerProps = Readonly<{
  active: boolean;
}>;

export function AmbientFrameScheduler({ active }: AmbientFrameSchedulerProps) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    invalidate();

    if (!active) {
      return;
    }

    const requestFrame = () => {
      if (document.visibilityState === "visible") {
        invalidate();
      }
    };

    const intervalId = window.setInterval(requestFrame, FRAME_INTERVAL_MS);
    document.addEventListener("visibilitychange", requestFrame);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", requestFrame);
    };
  }, [active, invalidate]);

  return null;
}
