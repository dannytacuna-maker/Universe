"use client";

import { ArrowUpRight } from "lucide-react";
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
  visual: "university" | "reading" | "jiujitsu" | "strength" | "observatory";
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
        visual: "university",
      },
      {
        detail: snapshot.activeReadingBook ?? "No active book",
        eyebrow: "Reading",
        section: "reading",
        value: snapshot.activeReadingBook === null ? "—" : "In progress",
        visual: "reading",
      },
      {
        detail: "Logged training sessions",
        eyebrow: "Jiu-Jitsu",
        section: "jiu-jitsu",
        value: String(snapshot.jiuJitsuSessionCount),
        visual: "jiujitsu",
      },
      {
        detail: "Logged strength sessions",
        eyebrow: "Strength",
        section: "strength-physique",
        value: String(snapshot.strengthSessionCount),
        visual: "strength",
      },
      {
        detail:
          snapshot.observatoryAttention >= 0.5
            ? "Fresh briefing available"
            : "Open the daily briefing",
        eyebrow: "Observatory",
        section: "observatory",
        value: snapshot.observatoryAttention >= 0.5 ? "New" : "Ready",
        visual: "observatory",
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
                data-visual={card.visual}
                key={card.section}
                onClick={() => navigate({ section: card.section })}
                type="button"
              >
                <span className={styles.cardGlow} aria-hidden="true" />
                <span className={styles.cardTop}>
                  <DashboardNavIcon section={card.section} size={15} />
                  <span className={styles.cardEyebrow}>{card.eyebrow}</span>
                </span>
                <strong className={styles.cardValue}>{card.value}</strong>
                <span className={styles.cardDetail}>{card.detail}</span>
                <span className={styles.cardAction} aria-hidden="true">
                  <ArrowUpRight absoluteStrokeWidth size={14} strokeWidth={2} />
                </span>
              </button>
            ))}

            {observatoryCard ? (
              <button
                className={`${styles.card} ${styles.observatoryCard}`}
                data-visual={observatoryCard.visual}
                onClick={() => navigate({ section: observatoryCard.section })}
                type="button"
              >
                <span className={styles.cardGlow} aria-hidden="true" />
                <span className={styles.cardTop}>
                  <DashboardNavIcon
                    section={observatoryCard.section}
                    size={15}
                  />
                  <span className={styles.cardEyebrow}>
                    {observatoryCard.eyebrow}
                  </span>
                </span>
                <strong className={styles.cardValue}>
                  {observatoryCard.value}
                </strong>
                <span className={styles.cardDetail}>
                  {observatoryCard.detail}
                </span>
                <span className={styles.cardAction} aria-hidden="true">
                  <ArrowUpRight absoluteStrokeWidth size={14} strokeWidth={2} />
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
