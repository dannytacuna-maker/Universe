export const missionAreas = [
  { id: "general", label: "General" },
  { id: "university", label: "University" },
  { id: "jiu-jitsu", label: "Jiu-Jitsu" },
  { id: "strength-physique", label: "Strength & Physique" },
  { id: "reading", label: "Reading" },
  { id: "business", label: "Business" },
  { id: "relationships", label: "Relationships" },
] as const;

export type MissionAreaId = (typeof missionAreas)[number]["id"];

export const missionDestinations = [
  { areaId: "university", id: "university", label: "University galaxy" },
  { areaId: "university", id: "logistics", label: "Logistics system" },
  { areaId: "jiu-jitsu", id: "jiu-jitsu", label: "Jiu-Jitsu system" },
  {
    areaId: "jiu-jitsu",
    id: "hyperbolic-time-chamber",
    label: "Hyperbolic Time Chamber",
  },
  {
    areaId: "strength-physique",
    id: "strength-physique",
    label: "Strength & Physique system",
  },
  {
    areaId: "strength-physique",
    id: "beerus-planet",
    label: "Strength training",
  },
  { areaId: "reading", id: "reading", label: "Reading system" },
  {
    areaId: "reading",
    id: "celestial-library",
    label: "Celestial Library",
  },
] as const satisfies readonly {
  areaId: MissionAreaId;
  id: string;
  label: string;
}[];

export type MissionDestinationId = (typeof missionDestinations)[number]["id"];
export type GrowthCycleStatus = "active" | "completed" | "paused";
export type CaptureKind =
  "idea" | "note" | "observation" | "task" | "reflection";
export type CaptureStatus = "inbox" | "processed";
export type ExperimentStatus = "active" | "completed";
export type ExperimentDecision = "adapt" | "continue" | "stop";

export type MissionIdentity = Readonly<{
  id: "primary";
  identityStatements: readonly string[];
  name: string;
  northStar: string;
  recoveryMode: boolean;
  updatedAt: string;
  values: readonly string[];
}>;

export type MissionIdentityUpdate = Readonly<{
  identityStatements: readonly string[];
  name: string;
  northStar: string;
  recoveryMode: boolean;
  values: readonly string[];
}>;

export type GrowthCycle = Readonly<{
  areaId: MissionAreaId;
  createdAt: string;
  destinationId: MissionDestinationId | null;
  id: string;
  identityStatement: string;
  minimumAction: string;
  priority: number;
  status: GrowthCycleStatus;
  title: string;
  updatedAt: string;
  weeklyTarget: number;
}>;

export type NewGrowthCycle = Readonly<{
  areaId: MissionAreaId;
  destinationId: MissionDestinationId | null;
  identityStatement: string;
  minimumAction: string;
  title: string;
  weeklyTarget: number;
}>;

export type CycleEvidence = Readonly<{
  createdAt: string;
  cycleId: string;
  id: string;
  occurredOn: string;
}>;

export type MissionCapture = Readonly<{
  areaId: MissionAreaId;
  content: string;
  createdAt: string;
  id: string;
  kind: CaptureKind;
  status: CaptureStatus;
  updatedAt: string;
}>;

export type NewMissionCapture = Readonly<{
  areaId: MissionAreaId;
  content: string;
  kind: CaptureKind;
}>;

export type WeeklyReview = Readonly<{
  adjustment: string;
  createdAt: string;
  friction: string;
  neglected: string;
  nextFocus: string;
  proudOf: string;
  updatedAt: string;
  weekStart: string;
}>;

export type WeeklyReviewInput = Omit<WeeklyReview, "createdAt" | "updatedAt">;

export type MissionExperiment = Readonly<{
  areaId: MissionAreaId;
  createdAt: string;
  decision: ExperimentDecision | null;
  hypothesis: string;
  id: string;
  observation: string;
  protocol: string;
  signal: string;
  status: ExperimentStatus;
  title: string;
  updatedAt: string;
}>;

export type NewMissionExperiment = Readonly<{
  areaId: MissionAreaId;
  hypothesis: string;
  protocol: string;
  signal: string;
  title: string;
}>;

export type MissionExperimentConclusion = Readonly<{
  decision: ExperimentDecision;
  id: string;
  observation: string;
}>;

export type MissionOperatingData = Readonly<{
  captures: readonly MissionCapture[];
  cycles: readonly GrowthCycle[];
  evidence: readonly CycleEvidence[];
  experiments: readonly MissionExperiment[];
  identity: MissionIdentity;
  reviews: readonly WeeklyReview[];
}>;

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

export function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function getWeekStartKey(date = new Date()) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - distanceFromMonday);
  return getLocalDateKey(weekStart);
}

export function findMissionArea(areaId: MissionAreaId) {
  return missionAreas.find((area) => area.id === areaId) ?? missionAreas[0];
}

export function findMissionDestination(
  destinationId: MissionDestinationId | null,
) {
  if (destinationId === null) {
    return null;
  }

  return (
    missionDestinations.find(
      (destination) => destination.id === destinationId,
    ) ?? null
  );
}
