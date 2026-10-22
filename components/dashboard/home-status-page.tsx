"use client";

import { useMemo } from "react";

import type { DashboardSectionId } from "@/lib/dashboard-sections";
import { useDashboardNavigationStore } from "@/store/dashboard-navigation-store-provider";

import styles from "./home-status-page.module.css";

export type HomeStatusSnapshot = Readonly<{
  activeReadingBook: string | null;
  jiuJitsuSessionCount: number;
  observatoryAttention: number;
  openUniversityAssignments: number;
  strengthSessionCount: number;
  websitesActiveProjects: number;
  websitesOpenOpportunities: number;
}>;

type HomeStatusPageProps = Readonly<{
  snapshot: HomeStatusSnapshot;
}>;

type StatusCard = Readonly<{
  detail: string;
  eyebrow: string;
  section: DashboardSectionId;
  value: string;
}>;

export function HomeStatusPage({ snapshot }: HomeStatusPageProps) {
  const navigate = useDashboardNavigationStore((state) => state.navigate);

  const cards = useMemo((): readonly StatusCard[] => {
    return [
      {
        detail:
          snapshot.openUniversityAssignments === 0
            ? "No open assignments"
            : "Open assignments needing attention",
        eyebrow: "University",
        section: "university",
        value: String(snapshot.openUniversityAssignments),
      },
      {
        detail: snapshot.activeReadingBook ?? "No active book",
        eyebrow: "Reading",
        section: "reading",
        value: snapshot.activeReadingBook === null ? "—" : "In progress",
      },
      {
        detail: "Logged training sessions",
        eyebrow: "Jiu-Jitsu",
        section: "jiu-jitsu",
        value: String(snapshot.jiuJitsuSessionCount),
      },
      {
        detail: "Logged strength sessions",
        eyebrow: "Strength",
        section: "strength-physique",
        value: String(snapshot.strengthSessionCount),
      },
      {
        detail: `${snapshot.websitesOpenOpportunities} open interest`,
        eyebrow: "Websites",
        section: "websites",
        value: String(snapshot.websitesActiveProjects),
      },
      {
        detail:
          snapshot.observatoryAttention >= 0.5
            ? "Fresh briefing available"
            : "Open the daily briefing",
        eyebrow: "Observatory",
        section: "observatory",
        value: snapshot.observatoryAttention >= 0.5 ? "New" : "Ready",
      },
    ];
  }, [snapshot]);

  return (
    <section aria-labelledby="home-status-title" className={styles.page}>
      <div className={styles.intro}>
        <h2 id="home-status-title">Status</h2>
        <p>
          A compact view of academic work, training, reading, and production.
          Open any area from the sidebar or the cards below.
        </p>
      </div>

      {snapshot.observatoryAttention >= 0.5 ? (
        <div className={styles.attention} role="status">
          <div>
            <strong>Observatory briefing ready</strong>
            <p>A new intelligence brief is waiting for review.</p>
          </div>
          <button
            onClick={() => navigate({ section: "observatory" })}
            type="button"
          >
            Open Observatory
          </button>
        </div>
      ) : null}

      <div className={styles.grid}>
        {cards.map((card) => (
          <button
            className={styles.card}
            key={card.section}
            onClick={() => navigate({ section: card.section })}
            type="button"
          >
            <span className={styles.cardEyebrow}>{card.eyebrow}</span>
            <strong>{card.value}</strong>
            <span>{card.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
