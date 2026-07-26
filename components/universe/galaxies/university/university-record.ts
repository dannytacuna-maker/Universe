import type { universityCourseSystems } from "./university-course-systems";

export type UniversityCourseId = (typeof universityCourseSystems)[number]["id"];

export type UniversityAssignmentStatus =
  "complete" | "in-progress" | "planned" | "submitted";

export type UniversityAssignment = Readonly<{
  courseId: UniversityCourseId;
  createdAt: string;
  details: string;
  dueAt: string;
  id: string;
  status: UniversityAssignmentStatus;
  title: string;
  updatedAt: string;
}>;

export type NewUniversityAssignment = Omit<
  UniversityAssignment,
  "createdAt" | "id" | "updatedAt"
>;

export type UniversityAssignmentUpdate = NewUniversityAssignment &
  Readonly<{ id: string }>;

export type UniversityGrade = Readonly<{
  courseId: UniversityCourseId;
  createdAt: string;
  id: string;
  label: string;
  maximumScore: number;
  occurredOn: string;
  score: number;
  updatedAt: string;
  weightPercent: number | null;
}>;

export type NewUniversityGrade = Omit<
  UniversityGrade,
  "createdAt" | "id" | "updatedAt"
>;

export type UniversityNoteKind = "note" | "reflection";

export type UniversityNote = Readonly<{
  content: string;
  courseId: UniversityCourseId;
  createdAt: string;
  id: string;
  kind: UniversityNoteKind;
  updatedAt: string;
}>;

export type NewUniversityNote = Omit<
  UniversityNote,
  "createdAt" | "id" | "updatedAt"
>;

export type UniversityData = Readonly<{
  assignments: readonly UniversityAssignment[];
  grades: readonly UniversityGrade[];
  notes: readonly UniversityNote[];
}>;
