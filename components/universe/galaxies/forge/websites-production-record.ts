import type { forgePlanets } from "./firmus-planets";

export type ForgePlanetId = (typeof forgePlanets)[number]["id"];

export const websitesProductionStages = [
  "discovery",
  "design",
  "build",
  "review",
  "launch",
  "shipped",
] as const;

export type WebsitesProductionStage =
  (typeof websitesProductionStages)[number];

export const websitesProductionStageLabels = {
  discovery: "Discovery",
  design: "Design",
  build: "Build",
  review: "Review",
  launch: "Launch",
  shipped: "Shipped",
} as const satisfies Record<WebsitesProductionStage, string>;

export type WebsitesClientStatus =
  | "active"
  | "archived"
  | "lead"
  | "paused";

export const websitesClientStatusLabels = {
  active: "Active",
  archived: "Archived",
  lead: "Lead",
  paused: "Paused",
} as const satisfies Record<WebsitesClientStatus, string>;

export type WebsitesOpportunityStatus =
  | "lost"
  | "open"
  | "parked"
  | "won";

export const websitesOpportunityStatusLabels = {
  lost: "Lost",
  open: "Open",
  parked: "Parked",
  won: "Won",
} as const satisfies Record<WebsitesOpportunityStatus, string>;

export type WebsitesClient = Readonly<{
  company: string;
  contact: string;
  createdAt: string;
  id: string;
  name: string;
  notes: string;
  status: WebsitesClientStatus;
  updatedAt: string;
}>;

export type NewWebsitesClient = Omit<
  WebsitesClient,
  "createdAt" | "id" | "updatedAt"
>;

export type WebsitesClientUpdate = NewWebsitesClient & Readonly<{ id: string }>;

export type WebsitesOpportunity = Readonly<{
  clientId: string;
  createdAt: string;
  id: string;
  interest: string;
  notes: string;
  status: WebsitesOpportunityStatus;
  updatedAt: string;
}>;

export type NewWebsitesOpportunity = Omit<
  WebsitesOpportunity,
  "createdAt" | "id" | "updatedAt"
>;

export type WebsitesOpportunityUpdate = NewWebsitesOpportunity &
  Readonly<{ id: string }>;

export type WebsitesProject = Readonly<{
  clientId: string;
  createdAt: string;
  forgePlanetId: ForgePlanetId | null;
  id: string;
  name: string;
  nextAction: string;
  notes: string;
  stage: WebsitesProductionStage;
  updatedAt: string;
}>;

export type NewWebsitesProject = Omit<
  WebsitesProject,
  "createdAt" | "id" | "updatedAt"
>;

export type WebsitesProjectUpdate = NewWebsitesProject &
  Readonly<{ id: string }>;

export type WebsitesProductionData = Readonly<{
  clients: readonly WebsitesClient[];
  opportunities: readonly WebsitesOpportunity[];
  projects: readonly WebsitesProject[];
}>;

export function isWebsitesProductionStage(
  value: string,
): value is WebsitesProductionStage {
  return (websitesProductionStages as readonly string[]).includes(value);
}

export function adjacentProductionStage(
  stage: WebsitesProductionStage,
  direction: -1 | 1,
): WebsitesProductionStage | null {
  const index = websitesProductionStages.indexOf(stage);
  const next = index + direction;

  if (next < 0 || next >= websitesProductionStages.length) {
    return null;
  }

  return websitesProductionStages[next] ?? null;
}
