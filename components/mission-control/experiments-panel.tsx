"use client";

import { useState, type FormEvent } from "react";

import type {
  ExperimentDecision,
  MissionAreaId,
  MissionExperiment,
  MissionExperimentConclusion,
  NewMissionExperiment,
} from "./mission-operating-record";
import { findMissionArea, missionAreas } from "./mission-operating-record";
import styles from "./mission-operating-deck.module.css";

type ExperimentsPanelProps = Readonly<{
  experiments: readonly MissionExperiment[];
  onAdd: (input: NewMissionExperiment) => Promise<void>;
  onConclude: (input: MissionExperimentConclusion) => Promise<void>;
}>;

export function ExperimentsPanel({
  experiments,
  onAdd,
  onConclude,
}: ExperimentsPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const activeExperiments = experiments.filter(
    (experiment) => experiment.status === "active",
  );
  const completedExperiments = experiments.filter(
    (experiment) => experiment.status === "completed",
  );

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input: NewMissionExperiment = {
      areaId: String(formData.get("areaId")) as MissionAreaId,
      hypothesis: String(formData.get("hypothesis") ?? ""),
      protocol: String(formData.get("protocol") ?? ""),
      signal: String(formData.get("signal") ?? ""),
      title: String(formData.get("title") ?? ""),
    };
    setIsSaving(true);
    setFeedback("");

    try {
      await onAdd(input);
      form.reset();
      setFeedback("Experiment started. Change one variable and observe.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The experiment could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConclude = async (
    event: FormEvent<HTMLFormElement>,
    experimentId: string,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: MissionExperimentConclusion = {
      decision: String(formData.get("decision")) as ExperimentDecision,
      id: experimentId,
      observation: String(formData.get("observation") ?? ""),
    };
    setFeedback("");

    try {
      await onConclude(input);
      setFeedback("Experiment concluded. The observation is preserved.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "The experiment could not be concluded.",
      );
    }
  };

  return (
    <div className={styles.sectionStack}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Optimization lab</span>
          <h2>Change one variable. Learn honestly.</h2>
        </div>
        <span className={styles.capacity}>
          {activeExperiments.length} active
        </span>
      </header>
      <p className={styles.sectionIntro}>
        Experiments turn vague self-improvement into a bounded question. Keep
        the change small enough to understand its effect.
      </p>

      {activeExperiments.length > 0 ? (
        <div className={styles.experimentList}>
          {activeExperiments.map((experiment) => (
            <article key={experiment.id}>
              <div className={styles.vectorCardTopline}>
                <span>{findMissionArea(experiment.areaId).label}</span>
                <span>Active experiment</span>
              </div>
              <h3>{experiment.title}</h3>
              <dl>
                <div>
                  <dt>If</dt>
                  <dd>{experiment.hypothesis}</dd>
                </div>
                <div>
                  <dt>Change</dt>
                  <dd>{experiment.protocol}</dd>
                </div>
                <div>
                  <dt>Observe</dt>
                  <dd>{experiment.signal}</dd>
                </div>
              </dl>
              <details className={styles.conclusionForm}>
                <summary>Conclude experiment</summary>
                <form
                  onSubmit={(event) =>
                    void handleConclude(event, experiment.id)
                  }
                >
                  <label>
                    <span>What happened?</span>
                    <textarea
                      name="observation"
                      placeholder="Record the result without judging yourself"
                      required
                      rows={3}
                    />
                  </label>
                  <label>
                    <span>Decision</span>
                    <select defaultValue="continue" name="decision">
                      <option value="continue">Continue</option>
                      <option value="adapt">Adapt</option>
                      <option value="stop">Stop</option>
                    </select>
                  </label>
                  <button className={styles.primaryAction} type="submit">
                    Save conclusion
                  </button>
                </form>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>No active experiment</strong>
          <p>Start only when a real question deserves a controlled change.</p>
        </div>
      )}

      <details
        className={styles.composer}
        open={activeExperiments.length === 0}
      >
        <summary>Start an experiment</summary>
        <form className={styles.formGrid} onSubmit={handleAdd}>
          <label>
            <span>Experiment</span>
            <input name="title" placeholder="Earlier phone cutoff" required />
          </label>
          <label>
            <span>Area</span>
            <select defaultValue="general" name="areaId">
              {missionAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wideField}>
            <span>Hypothesis</span>
            <input
              name="hypothesis"
              placeholder="If I change this, I expect..."
              required
            />
          </label>
          <label className={styles.wideField}>
            <span>One change</span>
            <input
              name="protocol"
              placeholder="For the next seven days..."
              required
            />
          </label>
          <label className={styles.wideField}>
            <span>Signal to observe</span>
            <input
              name="signal"
              placeholder="The outcome or feeling that will tell me something"
              required
            />
          </label>
          <button
            className={styles.primaryAction}
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Starting…" : "Start experiment"}
          </button>
        </form>
      </details>

      {completedExperiments.length > 0 ? (
        <details className={styles.composer}>
          <summary>Completed · {completedExperiments.length}</summary>
          <div className={styles.reviewHistory}>
            {completedExperiments.slice(0, 8).map((experiment) => (
              <article key={experiment.id}>
                <time dateTime={experiment.updatedAt}>
                  {experiment.decision ?? "concluded"}
                </time>
                <strong>{experiment.title}</strong>
                <p>{experiment.observation}</p>
              </article>
            ))}
          </div>
        </details>
      ) : null}

      <p aria-live="polite" className={styles.feedback}>
        {feedback}
      </p>
    </div>
  );
}
