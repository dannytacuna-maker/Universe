import { frenchPlanets } from "./french/french-planets";
import { jiuJitsuPlanets } from "./jiu-jitsu/jiu-jitsu-planets";
import { readingPlanets } from "./reading/reading-planets";
import { strengthPlanets } from "./strength-physique/strength-planets";

export const personalGrowthPlanets = [
  ...frenchPlanets,
  ...jiuJitsuPlanets,
  ...strengthPlanets,
  ...readingPlanets,
] as const;

export const standardPersonalGrowthPlanets = personalGrowthPlanets.filter(
  (planet) => planet.kind !== "sanctuary" && planet.kind !== "station",
);
