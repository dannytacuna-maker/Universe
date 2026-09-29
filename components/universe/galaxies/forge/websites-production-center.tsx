"use client";

import { useState } from "react";

import { MissionWorkspace } from "@/components/ui/mission-workspace";

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

  if (!isVisible) {
    return null;
  }

  const shippedProjects = records.projects.filter(
    (project) => project.stage === "shipped",
  ).length;
  const statusLine = records.isLoading
    ? "Opening records"
    : records.pulse.activeProjects > 0
      ? `${records.pulse.activeProjects} in production`
      : records.pulse.openOpportunities > 0
        ? `${records.pulse.openOpportunities} open interest`
        : "Ready to plan";

  return (
    <MissionWorkspace
      accent="132 164 238"
      description="Clients, interested leads, and every site moving from discovery to shipped."
      eyebrow="The Forge · Production center"
      isBusy={records.isLoading}
      isOpen={isExpanded}
      metrics={[
        {
          id: "interest",
          label: "Open interest",
          value: records.pulse.openOpportunities,
        },
        {
          id: "active",
          label: "In production",
          value: records.pulse.activeProjects,
        },
        {
          hint: "review · launch",
          id: "ready",
          label: "Ready to ship",
          tone: records.pulse.readyToShip > 0 ? "positive" : "neutral",
          value: records.pulse.readyToShip,
        },
        {
          hint: `${records.clients.length} clients`,
          id: "shipped",
          label: "Shipped",
          value: shippedProjects,
        },
      ]}
      onOpenChange={setIsExpanded}
      status={statusLine}
      surfaceId="websites-production"
      title="Websites pipeline"
    >
      {records.storageError !== null ? (
        <div className={styles.errorState} role="alert">
          <strong>Production records unavailable</strong>
          <p>{records.storageError}</p>
        </div>
      ) : null}

      <div className={styles.layout}>
        <WebsitesProjectsPanel
          clients={records.clients}
          onAdd={records.addProject}
          onEdit={records.editProject}
          onRemove={records.removeProject}
          projects={records.projects}
        />

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
      </div>
    </MissionWorkspace>
  );
}
