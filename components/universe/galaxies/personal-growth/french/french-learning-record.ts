export const frenchPracticeFocuses = [
  "vocabulary",
  "listening",
  "speaking",
  "reading",
  "grammar",
  "mixed",
] as const;

export type FrenchPracticeFocus = (typeof frenchPracticeFocuses)[number];

export type FrenchLearningProfile = Readonly<{
  duolingoScore: number | null;
  duolingoUsername: string;
  id: "primary";
  streakDays: number | null;
  updatedAt: string;
  weeklyTargetDays: number;
  weeklyTargetMinutes: number;
}>;

export type FrenchLearningProfileUpdate = Omit<
  FrenchLearningProfile,
  "id" | "updatedAt"
>;

export type FrenchProgressSnapshot = Readonly<{
  createdAt: string;
  duolingoScore: number | null;
  id: string;
  occurredOn: string;
  streakDays: number | null;
  updatedAt: string;
}>;

export type FrenchPracticeSession = Readonly<{
  confidence: number;
  createdAt: string;
  durationMinutes: number;
  focus: FrenchPracticeFocus;
  id: string;
  lessonsCompleted: number;
  occurredOn: string;
  reflection: string;
  updatedAt: string;
}>;

export type NewFrenchPracticeSession = Omit<
  FrenchPracticeSession,
  "createdAt" | "id" | "updatedAt"
>;

export type FrenchPracticeSessionUpdate = NewFrenchPracticeSession &
  Readonly<{ id: string }>;

export const frenchPracticeFocusLabels = {
  grammar: "Grammar",
  listening: "Listening",
  mixed: "Mixed practice",
  reading: "Reading",
  speaking: "Speaking",
  vocabulary: "Vocabulary",
} as const satisfies Record<FrenchPracticeFocus, string>;
