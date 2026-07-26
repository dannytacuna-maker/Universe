"use client";

import { useMemo, useState } from "react";

import type {
  MissionPattern,
  MissionReflectionEntry,
  MissionReflectionSystem,
} from "./mission-intelligence";
import styles from "./mission-operating-deck.module.css";

type ReflectionIntelligenceProps = Readonly<{
  patterns: readonly MissionPattern[];
  reflections: readonly MissionReflectionEntry[];
}>;

const systemLabels = {
  all: "All systems",
  "jiu-jitsu": "Jiu-Jitsu",
  reading: "Reading",
  "strength-physique": "Strength & Physique",
  university: "University",
} as const;

type SystemFilter = MissionReflectionSystem | "all";

export function ReflectionIntelligence({
  patterns,
  reflections,
}: ReflectionIntelligenceProps) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<"30" | "90" | "all">("all");
  const [system, setSystem] = useState<SystemFilter>("all");
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const cutoff = new Date();
    if (range !== "all") cutoff.setDate(cutoff.getDate() - Number(range));
    const cutoffKey = cutoff.toISOString().slice(0, 10);

    return reflections.filter(
      (entry) =>
        (system === "all" || entry.system === system) &&
        (range === "all" || entry.date >= cutoffKey) &&
        (normalizedQuery.length === 0 ||
          `${entry.topic} ${entry.text}`
            .toLocaleLowerCase()
            .includes(normalizedQuery)),
    );
  }, [query, range, reflections, system]);
  const resurfaced = useMemo(() => {
    if (reflections.length < 2) return null;
    return reflections.at(-1) ?? null;
  }, [reflections]);

  return (
    <section className={styles.intelligenceSection}>
      <header>
        <div>
          <span className={styles.eyebrow}>Reflection archive</span>
          <h3>Your own evidence, made retrievable.</h3>
        </div>
        <span>{reflections.length} entries</span>
      </header>

      {resurfaced !== null ? (
        <blockquote className={styles.resurfacedReflection}>
          <span>From your past · {resurfaced.label}</span>
          <p>{resurfaced.text}</p>
          <cite>
            {resurfaced.date} · {resurfaced.topic}
          </cite>
        </blockquote>
      ) : null}

      <div className={styles.reflectionFilters}>
        <label>
          <span className="sr-only">Search reflections by topic or text</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a thought, lesson, or topic"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Filter reflection system</span>
          <select
            onChange={(event) => setSystem(event.target.value as SystemFilter)}
            value={system}
          >
            {Object.entries(systemLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter reflection date</span>
          <select
            onChange={(event) =>
              setRange(event.target.value as "30" | "90" | "all")
            }
            value={range}
          >
            <option value="all">All dates</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.intelligenceEmpty}>
          {reflections.length === 0
            ? "Reflections will gather here as you use each real system."
            : "No reflections match this filter."}
        </p>
      ) : (
        <ol className={styles.reflectionArchive}>
          {filtered.slice(0, 30).map((entry) => (
            <li key={entry.id}>
              <div>
                <span>{entry.label}</span>
                <time dateTime={entry.date}>{entry.date}</time>
              </div>
              <strong>{entry.topic}</strong>
              <p>{entry.text}</p>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.patternSection}>
        <span className={styles.eyebrow}>Cross-system patterns</span>
        {patterns.length === 0 ? (
          <p>
            Patterns remain quiet until at least six complete weeks contain
            enough varied records. Mission Control will not invent a trend.
          </p>
        ) : (
          <ul>
            {patterns.map((pattern) => (
              <li key={pattern.id}>
                <strong>{pattern.statement}</strong>
                <small>{pattern.detail}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
