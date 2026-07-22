import type { Vector3Tuple } from "../galaxy-definition";

export type CourseSystemPalette = Readonly<{
  core: string;
  halo: string;
  orbit: string;
}>;

export type CourseWeekday =
  "friday" | "monday" | "thursday" | "tuesday" | "wednesday";

export type CourseMeeting = Readonly<{
  day: CourseWeekday;
  endTime: string;
  group: string;
  room: string;
  startTime: string;
}>;

export type CourseSystemDefinition = Readonly<{
  cameraPosition: Vector3Tuple;
  displayName: string;
  id: string;
  labelPosition: Readonly<{
    compact: readonly [number, number];
    desktop: readonly [number, number];
    portrait: readonly [number, number];
  }>;
  name: string;
  sourceName: string;
  palette: CourseSystemPalette;
  position: Vector3Tuple;
  schedule: readonly CourseMeeting[];
  scale: number;
  seed: number;
  status: "explorable" | "future";
}>;
