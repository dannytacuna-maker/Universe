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
  displayName: string;
  id: string;
  name: string;
  palette: CourseSystemPalette;
  schedule: readonly CourseMeeting[];
  sourceName: string;
  status: "active" | "future";
}>;
