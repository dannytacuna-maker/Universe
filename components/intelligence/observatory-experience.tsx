"use client";

import { useEffect, useRef, useState } from "react";

import {
  MissionWorkspace,
  useArrivalWorkspace,
} from "@/components/ui/mission-workspace";
import type { IntelligenceBriefing } from "@/lib/intelligence/contracts";
import type { WeeklyIntelligenceBriefing } from "@/lib/intelligence/weekly-briefing";

import type { IntelligenceBriefingDashboardState } from "./intelligence-briefing";
import {
  deriveBriefingEdition,
  IntelligenceBriefingDashboard,
} from "./intelligence-briefing-dashboard";

function briefingStatusLabel(state: IntelligenceBriefingDashboardState) {
  switch (state.status) {
    case "loading":
      return "Receiving today's brief";
    case "error":
      return "Brief unavailable";
    case "ready":
      return "Daily analysis ready";
    case "source-ready":
      return "Source watch live";
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

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
  const [isOpen, setIsOpen] = useArrivalWorkspace(isVisible);

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

          if (candidate.kind === "daily" || candidate.kind === "weekly") {
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
            : "The daily intelligence briefing could not be reached.";
        setState({ message, status: "error" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          message:
            error instanceof Error
              ? error.message
              : "The daily intelligence briefing could not be reached.",
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

  if (!isVisible) return null;

  const edition = deriveBriefingEdition(state);

  return (
    <MissionWorkspace
      accent="222 176 112"
      description="A concise daily view of the world developments most worth understanding."
      eyebrow="Global intelligence station"
      isBusy={state.status === "loading"}
      isOpen={isOpen}
      launcherLabel="Brief"
      metrics={
        edition === null
          ? undefined
          : [
              {
                id: "edition",
                kind: "text",
                label: "Edition",
                value: (
                  <time dateTime={edition.editionDateIso}>
                    {edition.editionDateLabel}
                  </time>
                ),
              },
              {
                id: "compiled",
                kind: "text",
                label: "Compiled",
                value: edition.generatedAtLabel,
              },
              {
                id: "developments",
                label: "Developments",
                value: edition.developmentCount,
              },
              {
                id: "layer",
                kind: "text",
                label: "Layer",
                tone: edition.kind === "analysis" ? "positive" : "neutral",
                value: edition.kind === "analysis" ? "Analysed" : "Source feed",
              },
            ]
      }
      onOpenChange={setIsOpen}
      placement="center"
      status={briefingStatusLabel(state)}
      surfaceId="observatory"
      title="The Observatory"
    >
      <IntelligenceBriefingDashboard state={state} />
    </MissionWorkspace>
  );
}
