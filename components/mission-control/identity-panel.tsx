"use client";

import { useState, type FormEvent } from "react";

import type {
  MissionIdentity,
  MissionIdentityUpdate,
} from "./mission-operating-record";
import type { MissionIdentityEvidence } from "./mission-intelligence";
import styles from "./mission-operating-deck.module.css";

type IdentityPanelProps = Readonly<{
  evidence: MissionIdentityEvidence;
  identity: MissionIdentity;
  onUpdate: (input: MissionIdentityUpdate) => Promise<void>;
}>;

export function IdentityPanel({
  evidence,
  identity,
  onUpdate,
}: IdentityPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: MissionIdentityUpdate = {
      identityStatements: String(formData.get("identityStatements") ?? "")
        .split("\n")
        .filter(Boolean),
      name: String(formData.get("name") ?? ""),
      northStar: String(formData.get("northStar") ?? ""),
      recoveryMode: formData.get("recoveryMode") === "on",
      values: String(formData.get("values") ?? "")
        .split(",")
        .filter(Boolean),
    };
    setIsSaving(true);
    setFeedback("");

    try {
      await onUpdate(input);
      setFeedback("Identity profile saved.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The profile could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.sectionStack}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Identity</span>
          <h2>Decide who the system serves.</h2>
        </div>
      </header>
      <p className={styles.sectionIntro}>
        Mission Control measures evidence of identity, not busyness. Change this
        slowly; it is the compass for every cycle and review.
      </p>

      <section className={styles.identityEvidence}>
        <header>
          <span>Living evidence · last 30 days</span>
          <strong>{evidence.activeSystemCount} active systems</strong>
        </header>
        {evidence.statements.length === 0 ? (
          <p>
            Your identity narrative will update from real sessions, reading,
            training, and university reflection—not from claims alone.
          </p>
        ) : (
          <ul>
            {evidence.statements.map((statement) => (
              <li key={statement}>{statement}</li>
            ))}
          </ul>
        )}
      </section>

      <form className={styles.identityForm} onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input defaultValue={identity.name} name="name" required />
        </label>
        <label>
          <span>North star</span>
          <textarea
            defaultValue={identity.northStar}
            name="northStar"
            required
            rows={3}
          />
        </label>
        <label>
          <span>Identity statements · one per line</span>
          <textarea
            defaultValue={identity.identityStatements.join("\n")}
            name="identityStatements"
            required
            rows={5}
          />
        </label>
        <label>
          <span>Values · separated by commas</span>
          <input defaultValue={identity.values.join(", ")} name="values" />
        </label>
        <label className={styles.recoveryToggle}>
          <span>
            <strong>Recovery mode</strong>
            <small>
              Replace performance pressure with the minimum action until energy
              returns.
            </small>
          </span>
          <input
            defaultChecked={identity.recoveryMode}
            name="recoveryMode"
            type="checkbox"
          />
        </label>
        <div className={styles.formFooter}>
          <button
            className={styles.primaryAction}
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving…" : "Save identity"}
          </button>
          <p aria-live="polite" className={styles.feedback}>
            {feedback}
          </p>
        </div>
      </form>
    </div>
  );
}
