"use client";

import { useEffect, useState } from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";

import type { WebsitesProductionCenterController } from "./use-websites-production-center";
import { WebsitesPeoplePanel } from "./websites-people-panel";
import { WebsitesProjectsPanel } from "./websites-projects-panel";
import styles from "./websites-production-center.module.css";

type WebsitesProductionCenterProps = Readonly<{
  isVisible: boolean;
  records: WebsitesProductionCenterController;
}>;

export function WebsitesProductionCenter({
  isVisible,
  records,
}: WebsitesProductionCenterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId !== "websites-production") setIsExpanded(false);
      }),
    [],
  );

  if (!isVisible) {
    return null;
  }

  const statusLine = records.isLoading
    ? "Opening records"
    : records.pulse.activeProjects > 0
      ? `${records.pulse.activeProjects} in production`
      : records.pulse.openOpportunities > 0
        ? `${records.pulse.openOpportunities} open interest`
        : "Ready to plan";

  return (
    <aside
      aria-busy={records.isLoading}
      aria-label="Websites production center"
      className={styles.dashboard}
      data-expanded={isExpanded}
    >
      <header className={styles.dashboardHeader}>
        <div className={styles.headingIdentity}>
          <div>
            <span>Production center</span>
            <strong>{statusLine}</strong>
          </div>
        </div>
        <button
          aria-controls="websites-production-content"
          aria-expanded={isExpanded}
          className={styles.toggleButton}
          onClick={() =>
            setIsExpanded((current) => {
              const next = !current;
              if (next) activateInterfaceSurface("websites-production");
              return next;
            })
          }
          type="button"
        >
          {isExpanded ? "Close" : "Open"}
        </button>
      </header>

      {isExpanded ? (
        <div
          className={styles.dashboardContent}
          id="websites-production-content"
        >
          {records.storageError !== null ? (
            <div className={styles.errorState} role="alert">
              <strong>Production records unavailable</strong>
              <p>{records.storageError}</p>
            </div>
          ) : null}

          <p className={styles.pulse} aria-label="Production summary">
            <strong>{records.pulse.openOpportunities}</strong> interest
            <span aria-hidden="true">·</span>
            <strong>{records.pulse.activeProjects}</strong> active
            <span aria-hidden="true">·</span>
            <strong>{records.pulse.readyToShip}</strong> ready
          </p>

          <WebsitesProjectsPanel
            clients={records.clients}
            onAdd={records.addProject}
            onEdit={records.editProject}
            onRemove={records.removeProject}
            projects={records.projects}
          />

          <details className={styles.peopleDisclosure} open>
            <summary>
              People
              <span>{records.clients.length}</span>
            </summary>
            <WebsitesPeoplePanel
              clients={records.clients}
              onAddClient={records.addClient}
              onAddOpportunity={records.addOpportunity}
              onEditClient={records.editClient}
              onEditOpportunity={records.editOpportunity}
              onRemoveClient={records.removeClient}
              onRemoveOpportunity={records.removeOpportunity}
              opportunities={records.opportunities}
              projects={records.projects}
            />
          </details>
        </div>
      ) : null}
    </aside>
  );
}
