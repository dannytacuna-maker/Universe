import type {
  WebsitesProductionData,
  WebsitesProductionStage,
} from "./websites-production-record";

export type WebsitesProductionPulse = Readonly<{
  activeProjects: number;
  openOpportunities: number;
  readyToShip: number;
}>;

export function deriveWebsitesProductionPulse(
  data: WebsitesProductionData,
): WebsitesProductionPulse {
  const readyStages = new Set<WebsitesProductionStage>(["review", "launch"]);

  return {
    activeProjects: data.projects.filter(
      (project) => project.stage !== "shipped",
    ).length,
    openOpportunities: data.opportunities.filter(
      (opportunity) => opportunity.status === "open",
    ).length,
    readyToShip: data.projects.filter((project) =>
      readyStages.has(project.stage),
    ).length,
  };
}
