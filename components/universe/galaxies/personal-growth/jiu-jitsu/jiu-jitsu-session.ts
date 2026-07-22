export type JiuJitsuClassType =
  "competition" | "drilling" | "gi" | "no-gi" | "open-mat";

export type JiuJitsuSession = Readonly<{
  classType: JiuJitsuClassType;
  createdAt: string;
  durationMinutes: number;
  id: string;
  mobilityWork: boolean;
  notes: string;
  occurredOn: string;
  sparringRounds: number;
  techniques: readonly string[];
}>;

export type NewJiuJitsuSession = Omit<JiuJitsuSession, "createdAt" | "id">;

export const jiuJitsuClassTypeLabels = {
  competition: "Competition",
  drilling: "Drilling",
  gi: "Gi class",
  "no-gi": "No-gi class",
  "open-mat": "Open mat",
} as const satisfies Record<JiuJitsuClassType, string>;
