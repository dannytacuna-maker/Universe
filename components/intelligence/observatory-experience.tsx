"use client";

import { useEffect, useState } from "react";

import type { IntelligenceBriefing } from "@/lib/intelligence/contracts";

import type { IntelligenceBriefingDashboardState } from "./intelligence-briefing";
import { IntelligenceBriefingDashboard } from "./intelligence-briefing-dashboard";

type ObservatoryExperienceProps = Readonly<{ isVisible: boolean }>;

export function ObservatoryExperience({
  isVisible,
}: ObservatoryExperienceProps) {
  const [state, setState] = useState<IntelligenceBriefingDashboardState>({
    status: "loading",
  });

  useEffect(() => {
    if (!isVisible) return;

    const controller = new AbortController();

    void fetch("/api/intelligence/latest", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);

        if (
          (response.ok || response.status === 404) &&
          typeof payload === "object" &&
          payload !== null &&
          "briefing" in payload
        ) {
          setState({
            briefing: (
              payload as Readonly<{
                briefing: IntelligenceBriefing | null;
              }>
            ).briefing,
            status: "source-ready",
          });
          return;
        }

        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as Readonly<{ error?: unknown }>).error === "string"
            ? (payload as Readonly<{ error: string }>).error
            : "The daily intelligence feed could not be reached.";
        setState({ message, status: "error" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          message:
            error instanceof Error
              ? error.message
              : "The daily intelligence feed could not be reached.",
          status: "error",
        });
      });

    return () => controller.abort();
  }, [isVisible]);

  return isVisible ? <IntelligenceBriefingDashboard state={state} /> : null;
}
