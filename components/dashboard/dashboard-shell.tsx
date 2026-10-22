"use client";

import type { ReactNode } from "react";

import { AuthenticatedAccountControl } from "@/components/auth/authenticated-account-control";
import {
  dashboardNavGroups,
  dashboardTopLevelItems,
  sectionTitle,
  type DashboardSectionId,
} from "@/lib/dashboard-sections";
import type { MissionSyncStatus } from "@/lib/mission-record-sync";
import { useDashboardNavigationStore } from "@/store/dashboard-navigation-store-provider";

import styles from "./dashboard-shell.module.css";

type DashboardShellProps = Readonly<{
  children: ReactNode;
  observatoryAttention: number;
  ownerEmail: string;
  subnav?: ReactNode;
  syncStatus: MissionSyncStatus;
}>;

export function DashboardShell({
  children,
  observatoryAttention,
  ownerEmail,
  subnav,
  syncStatus,
}: DashboardShellProps) {
  const section = useDashboardNavigationStore((state) => state.section);
  const navigate = useDashboardNavigationStore((state) => state.navigate);

  const goTo = (nextSection: DashboardSectionId) => {
    navigate({ section: nextSection });
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>Mission Control</span>
          <p className={styles.brandName}>Operations</p>
        </div>

        <nav aria-label="Primary" className={styles.nav}>
          <div className={styles.topLinks}>
            {dashboardTopLevelItems
              .filter((item) => item.id === "home")
              .map((item) => (
                <button
                  className={styles.navLink}
                  data-active={section === item.id}
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  type="button"
                >
                  <span>{item.label}</span>
                </button>
              ))}
          </div>

          {dashboardNavGroups.map((group) => (
            <div className={styles.group} key={group.id}>
              <div className={styles.groupLabel}>{group.label}</div>
              <div className={styles.groupItems}>
                {group.items.map((item) => (
                  <button
                    className={styles.navLink}
                    data-active={section === item.id}
                    key={item.id}
                    onClick={() => goTo(item.id)}
                    type="button"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.topLinks}>
            {dashboardTopLevelItems
              .filter((item) => item.id === "observatory")
              .map((item) => (
                <button
                  className={styles.navLink}
                  data-active={section === item.id}
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  type="button"
                >
                  <span>{item.label}</span>
                  {observatoryAttention >= 0.5 ? (
                    <span aria-label="New briefing" className={styles.attentionDot} />
                  ) : null}
                </button>
              ))}
          </div>
        </nav>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.headerEyebrow}>Dashboard</span>
            <h1 className={styles.headerTitle}>{sectionTitle(section)}</h1>
          </div>
          <div className={styles.headerAside}>
            <AuthenticatedAccountControl
              ownerEmail={ownerEmail}
              status={syncStatus}
            />
          </div>
        </header>

        {subnav === undefined ? null : (
          <div className={styles.subnav}>{subnav}</div>
        )}

        <div className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </div>
      </div>
    </div>
  );
}
