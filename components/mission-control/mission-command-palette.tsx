"use client";

import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";

import {
  findMissionDestination,
  missionDestinations,
  type MissionDestinationId,
} from "./mission-operating-record";
import styles from "./mission-operating-deck.module.css";

export type MissionPaletteAction =
  | Readonly<{ kind: "capture"; content: string }>
  | Readonly<{ kind: "go"; destinationId: MissionDestinationId }>
  | Readonly<{ kind: "log"; target: "jiu-jitsu" | "strength" }>
  | Readonly<{ kind: "panel"; panel: "capture" | "review" | "vector" }>
  | Readonly<{ kind: "ceremony" }>;

type MissionCommandPaletteProps = Readonly<{
  onAction: (action: MissionPaletteAction) => void | Promise<void>;
  statusMessage?: string;
}>;

type PaletteCommand = Readonly<{
  action: MissionPaletteAction;
  group: string;
  id: string;
  keywords: string;
  label: string;
}>;

function localDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const staticCommands: readonly PaletteCommand[] = [
  {
    action: { kind: "log", target: "jiu-jitsu" },
    group: "Log",
    id: "log-jj",
    keywords: "log jiu jitsu class mat training mvp",
    label: "Log Jiu-Jitsu class (today)",
  },
  {
    action: { kind: "log", target: "strength" },
    group: "Log",
    id: "log-strength",
    keywords: "log strength whis training workout split",
    label: "Log next Whis workout day",
  },
  {
    action: { kind: "panel", panel: "capture" },
    group: "Capture",
    id: "open-capture",
    keywords: "capture note idea inbox",
    label: "Open Capture inbox",
  },
  {
    action: { kind: "panel", panel: "review" },
    group: "Review",
    id: "open-review",
    keywords: "weekly review adjust",
    label: "Open Weekly Review",
  },
  {
    action: { kind: "ceremony" },
    group: "Review",
    id: "ceremony",
    keywords: "ceremony end week observatory briefing constellation",
    label: "End-of-week ceremony",
  },
  {
    action: { kind: "go", destinationId: "observatory" },
    group: "Go",
    id: "go-observatory",
    keywords: "observatory briefing intelligence week",
    label: "Go to The Observatory",
  },
  ...missionDestinations
    .filter((destination) => destination.id !== "observatory")
    .map(
      (destination): PaletteCommand => ({
        action: { kind: "go", destinationId: destination.id },
        group: "Go",
        id: `go-${destination.id}`,
        keywords: `go ${destination.label} ${destination.areaId}`,
        label: `Go to ${destination.label}`,
      }),
    ),
];

export function MissionCommandPalette({
  onAction,
  statusMessage = "",
}: MissionCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const commands = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (normalized.length === 0) {
      return staticCommands.slice(0, 8);
    }

    return staticCommands
      .filter((command) =>
        `${command.label} ${command.keywords}`
          .toLocaleLowerCase()
          .includes(normalized),
      )
      .slice(0, 10);
  }, [query]);

  const runAction = async (action: MissionPaletteAction) => {
    setIsPending(true);
    try {
      await onAction(action);
      if (action.kind === "capture" || action.kind === "log") {
        setQuery("");
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.startsWith("/c ") || trimmed.startsWith("/capture ")) {
      const content = trimmed.replace(/^\/c(?:apture)?\s+/iu, "").trim();
      if (content.length > 0) {
        await runAction({ content, kind: "capture" });
      }
      return;
    }

    const command = commands[activeIndex] ?? commands[0];
    if (command !== undefined) {
      await runAction(command.action);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        commands.length === 0 ? 0 : (current + 1) % commands.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        commands.length === 0
          ? 0
          : (current - 1 + commands.length) % commands.length,
      );
    }
  };

  return (
    <section aria-label="Mission command palette" className={styles.palette}>
      <form className={styles.paletteForm} onSubmit={(event) => void handleSubmit(event)}>
          <label className="sr-only" htmlFor="mission-command-palette">
            Search Mission commands
          </label>
        <input
          autoComplete="off"
          id="mission-command-palette"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Go, log, capture…  /c note for quick capture"
          spellCheck={false}
          value={query}
        />
        <button disabled={isPending} type="submit">
          Run
        </button>
      </form>

      <ul className={styles.paletteList}>
        {commands.map((command, index) => (
          <li key={command.id}>
            <button
              data-active={index === activeIndex}
              disabled={isPending}
              onClick={() => void runAction(command.action)}
              onMouseEnter={() => setActiveIndex(index)}
              type="button"
            >
              <span>{command.group}</span>
              <strong>{command.label}</strong>
            </button>
          </li>
        ))}
        {commands.length === 0 ? (
          <li className={styles.paletteEmpty}>No matching commands.</li>
        ) : null}
      </ul>

      <p aria-live="polite" className={styles.paletteStatus}>
        {statusMessage ||
          `Quick capture: /c … · Destinations: ${missionDestinations.length} · Today ${localDateValue()}`}
      </p>
    </section>
  );
}

export function getMissionDestinationLabel(
  destinationId: MissionDestinationId | null,
) {
  if (destinationId === null) {
    return null;
  }

  return findMissionDestination(destinationId)?.label ?? destinationId;
}
