"use client";

import { useMemo } from "react";

import type { DashboardSectionId } from "@/lib/dashboard-sections";
import { useDashboardNavigationStore } from "@/store/dashboard-navigation-store-provider";

import { DashboardNavIcon } from "./dashboard-nav-icon";
import { HomeSchedule } from "./home-schedule";
import styles from "./home-status-page.module.css";

export type HomeStatusSnapshot = Readonly<{
  activeReadingBook: string | null;
  jiuJitsuSessionCount: number;
  observatoryAttention: number;
  openUniversityAssignments: number;
  strengthSessionCount: number;
}>;

type HomeStatusPageProps = Readonly<{
  snapshot: HomeStatusSnapshot;
}>;

type StatusCard = Readonly<{
  detail: string;
  eyebrow: string;
  section: Exclude<DashboardSectionId, "home" | "french">;
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

  const primaryCards = cards.slice(0, 4);
  const observatoryCard = cards[4];

  return (
    <section aria-label="Home" className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.calendarPane}>
          <HomeSchedule />
        </div>

        <div className={styles.cardsPane}>
          <div className={styles.cardGrid}>
            {primaryCards.map((card) => (
              <button
                className={styles.card}
                key={card.section}
                onClick={() => navigate({ section: card.section })}
                type="button"
              >
                <span className={styles.cardTop}>
                  <span className={styles.cardEyebrow}>{card.eyebrow}</span>
                  <DashboardNavIcon section={card.section} size={16} />
                </span>
                <strong>{card.value}</strong>
                <span className={styles.cardDetail}>{card.detail}</span>
              </button>
            ))}

            {observatoryCard ? (
              <button
                className={`${styles.card} ${styles.observatoryCard}`}
                onClick={() => navigate({ section: observatoryCard.section })}
                type="button"
              >
                <span className={styles.cardTop}>
                  <span className={styles.cardEyebrow}>
                    {observatoryCard.eyebrow}
                  </span>
                  <DashboardNavIcon
                    section={observatoryCard.section}
                    size={16}
                  />
                </span>
                <strong>{observatoryCard.value}</strong>
                <span className={styles.cardDetail}>
                  {observatoryCard.detail}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
