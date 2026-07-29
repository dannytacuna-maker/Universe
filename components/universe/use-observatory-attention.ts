"use client";

import { useEffect, useState } from "react";

import {
  getSeenObservatoryBriefingId,
  markObservatoryBriefingSeen,
} from "@/lib/living-universe";

function getIsoWeekId(date = new Date()) {
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function useObservatoryAttention(isUniverseView: boolean) {
  const [attention, setAttention] = useState(0);

  useEffect(() => {
    if (!isUniverseView) {
      return;
    }

    const controller = new AbortController();

    void fetch("/api/intelligence/latest", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok && response.status !== 404) {
          setAttention(0);
          return;
        }

        const payload: unknown = await response.json().catch(() => null);
        if (typeof payload !== "object" || payload === null) {
          setAttention(0);
          return;
        }

        const candidate = payload as Readonly<{
          briefing?: Readonly<{ id?: unknown; weekId?: unknown }> | null;
          kind?: unknown;
        }>;

        if (candidate.briefing === null || candidate.briefing === undefined) {
          setAttention(0);
          return;
        }

        const briefingId =
          typeof candidate.briefing.id === "string"
            ? candidate.briefing.id
            : typeof candidate.briefing.weekId === "string"
              ? candidate.briefing.weekId
              : getIsoWeekId();
        const isWeekly = candidate.kind === "weekly";
        const seenId = getSeenObservatoryBriefingId();
        const isFresh = isWeekly && seenId !== briefingId;

        setAttention(isFresh ? 0.82 : isWeekly ? 0.18 : 0.08);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAttention(0);
        }
      });

    return () => controller.abort();
  }, [isUniverseView]);

  return {
    attention,
    markBriefingSeen: (briefingId: string) => {
      markObservatoryBriefingSeen(briefingId);
      setAttention(0.18);
    },
  };
}
