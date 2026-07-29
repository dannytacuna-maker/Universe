import type { UIMessage } from "ai";

export const jarvisModes = ["quick", "analyze", "deep-review"] as const;

export type JarvisMode = (typeof jarvisModes)[number];

export type JarvisNavigationContext = Readonly<{
  galaxyId: string | null;
  level: "galaxy" | "planet" | "system" | "universe";
  planetId: string | null;
  systemId: string | null;
}>;

export type JarvisThread = Readonly<{
  createdAt: string;
  id: string;
  messages: UIMessage[];
  mode: JarvisMode;
  title: string;
  updatedAt: string;
}>;

export type JarvisThreadSummary = Omit<JarvisThread, "messages"> &
  Readonly<{ messageCount: number }>;

export function isJarvisMode(value: unknown): value is JarvisMode {
  return (
    typeof value === "string" &&
    (jarvisModes as readonly string[]).includes(value)
  );
}

export function createJarvisThreadTitle(message: UIMessage) {
  const text = message.parts
    .filter(
      (
        part,
      ): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length === 0) return "New conversation";
  return text.length > 52 ? `${text.slice(0, 49).trimEnd()}…` : text;
}
