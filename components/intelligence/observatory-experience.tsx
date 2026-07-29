"use client";

import { useEffect, useRef, useState } from "react";

import type { IntelligenceBriefing } from "@/lib/intelligence/contracts";
import type { WeeklyIntelligenceBriefing } from "@/lib/intelligence/weekly-briefing";
import { activateInterfaceSurface } from "@/lib/interface-surface";

import type { IntelligenceBriefingDashboardState } from "./intelligence-briefing";
import { IntelligenceBriefingDashboard } from "./intelligence-briefing-dashboard";

type ObservatoryExperienceProps = Readonly<{
  isVisible: boolean;
  onBriefingSeen?: (briefingId: string) => void;
}>;

export function ObservatoryExperience({
  isVisible,
  onBriefingSeen,
}: ObservatoryExperienceProps) {
  const [state, setState] = useState<IntelligenceBriefingDashboardState>({
    status: "loading",
  });
  const markedBriefingId = useRef<string | null>(null);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    activateInterfaceSurface("observatory");
  }, [isVisible]);

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
          const candidate = payload as Readonly<{
            briefing: IntelligenceBriefing | WeeklyIntelligenceBriefing | null;
            kind?: unknown;
          }>;

          if (candidate.kind === "weekly") {
            setState({
              briefing: candidate.briefing as WeeklyIntelligenceBriefing,
              status: "ready",
            });
          } else {
            setState({
              briefing: candidate.briefing as IntelligenceBriefing | null,
              status: "source-ready",
            });
          }
          return;
        }

        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as Readonly<{ error?: unknown }>).error === "string"
            ? (payload as Readonly<{ error: string }>).error
            : "The weekly intelligence briefing could not be reached.";
        setState({ message, status: "error" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          message:
            error instanceof Error
              ? error.message
              : "The weekly intelligence briefing could not be reached.",
          status: "error",
        });
      });

    return () => controller.abort();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || onBriefingSeen === undefined) {
      return;
    }

    if (
      (state.status === "ready" || state.status === "source-ready") &&
      state.briefing !== null &&
      markedBriefingId.current !== state.briefing.id
    ) {
      markedBriefingId.current = state.briefing.id;
      onBriefingSeen(state.briefing.id);
    }
  }, [isVisible, onBriefingSeen, state]);

  return isVisible ? <IntelligenceBriefingDashboard state={state} /> : null;
}
