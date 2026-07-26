export const missionSystemCatalog = [
  {
    cadence: "semester",
    galaxyId: "university",
    id: "university",
    label: "University",
    records: ["assignment", "grade", "note", "reflection"],
  },
  {
    cadence: "weekly",
    galaxyId: "personal-growth",
    id: "french",
    label: "French",
    records: ["profile", "progress", "session", "reflection"],
  },
  {
    cadence: "weekly",
    galaxyId: "personal-growth",
    id: "jiu-jitsu",
    label: "Jiu-Jitsu",
    records: ["session", "technique", "mobility", "reflection"],
  },
  {
    cadence: "weekly",
    galaxyId: "personal-growth",
    id: "strength-physique",
    label: "Strength & Physique",
    records: ["session", "exercise", "metric", "recovery", "reflection"],
  },
  {
    cadence: "weekly",
    galaxyId: "personal-growth",
    id: "reading",
    label: "Reading",
    records: ["book", "session", "lesson", "reflection"],
  },
] as const;

export type MissionSystemId = (typeof missionSystemCatalog)[number]["id"];

export function findMissionSystem(systemId: MissionSystemId) {
  return missionSystemCatalog.find((system) => system.id === systemId);
}
