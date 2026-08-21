"use client";

import { useRef, useState, type FormEvent } from "react";

import { forgePlanets, getForgePlanet } from "./firmus-planets";
import type { WebsitesProductionCenterController } from "./use-websites-production-center";
import {
  adjacentProductionStage,
  websitesProductionStageLabels,
  websitesProductionStages,
  type ForgePlanetId,
  type WebsitesProductionStage,
  type WebsitesProject,
} from "./websites-production-record";
import styles from "./websites-production-center.module.css";

type WebsitesProjectsPanelProps = Readonly<{
  clients: WebsitesProductionCenterController["clients"];
  onAdd: WebsitesProductionCenterController["addProject"];
  onEdit: WebsitesProductionCenterController["editProject"];
  onRemove: WebsitesProductionCenterController["removeProject"];
  projects: WebsitesProductionCenterController["projects"];
}>;

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The project could not be updated.";
}

export function WebsitesProjectsPanel({
  clients,
  onAdd,
  onEdit,
  onRemove,
  projects,
}: WebsitesProjectsPanelProps) {
  const pendingGuard = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(projects.length === 0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const editingProject =
    projects.find((project) => project.id === editingId) ?? null;
  const usableClients = clients.filter(
    (client) => client.status !== "archived",
  );

  const openNew = () => {
    setEditingId(null);
    setIsComposerOpen(true);
    setFeedback("");
  };

  const closeComposer = () => {
    setEditingId(null);
    setIsComposerOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingGuard.current) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const planetValue = String(data.get("forgePlanetId") ?? "");
    const input = {
      clientId: String(data.get("clientId") ?? ""),
      forgePlanetId:
        planetValue.length === 0 ? null : (planetValue as ForgePlanetId),
      name: String(data.get("name") ?? ""),
      nextAction: String(data.get("nextAction") ?? ""),
      notes: String(data.get("notes") ?? ""),
      stage: String(data.get("stage") ?? "discovery") as WebsitesProductionStage,
    };

    pendingGuard.current = true;
    setPendingAction("save");
    setFeedback("");

    try {
      if (editingProject === null) {
        await onAdd({ ...input, stage: "discovery" });
        setFeedback("Project added.");
      } else {
        await onEdit({ ...input, id: editingProject.id });
        setFeedback("Project updated.");
      }
      closeComposer();
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const moveStage = async (
    project: WebsitesProject,
    direction: -1 | 1,
  ) => {
    const nextStage = adjacentProductionStage(project.stage, direction);
    if (nextStage === null || pendingGuard.current) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(`${project.id}:${direction}`);
    setFeedback("");

    try {
      await onEdit({
        clientId: project.clientId,
        forgePlanetId: project.forgePlanetId,
        id: project.id,
        name: project.name,
        nextAction: project.nextAction,
        notes: project.notes,
        stage: nextStage,
      });
      setFeedback(`Moved to ${websitesProductionStageLabels[nextStage]}.`);
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const handleRemove = async (project: WebsitesProject) => {
    if (
      pendingGuard.current ||
      !window.confirm(`Remove project “${project.name}”?`)
    ) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(project.id);
    setFeedback("");

    try {
      await onRemove(project.id);
      if (editingId === project.id) {
        closeComposer();
      }
      setFeedback("Project removed.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  return (
    <section
      aria-labelledby="websites-projects-title"
      className={styles.panel}
    >
      <header className={styles.sectionHeading}>
        <div>
          <span>Production</span>
          <h3 id="websites-projects-title">Projects</h3>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={openNew}
          type="button"
        >
          Add
        </button>
      </header>

      {isComposerOpen ? (
        <form
          className={styles.recordForm}
          key={editingProject?.id ?? "new-project"}
          onSubmit={handleSubmit}
        >
          <div className={styles.formHeading}>
            <strong>
              {editingProject === null ? "New project" : "Edit project"}
            </strong>
            <button onClick={closeComposer} type="button">
              Cancel
            </button>
          </div>
          <label className={styles.wideField}>
            <span>Name</span>
            <input
              defaultValue={editingProject?.name ?? ""}
              maxLength={160}
              name="name"
              required
            />
          </label>
          <label>
            <span>Client</span>
            <select
              defaultValue={editingProject?.clientId ?? usableClients[0]?.id}
              name="clientId"
              required
            >
              {usableClients.length === 0 ? (
                <option value="">Add a client first</option>
              ) : (
                usableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))
              )}
            </select>
          </label>
          {editingProject === null ? (
            <input name="stage" type="hidden" value="discovery" />
          ) : (
            <label>
              <span>Stage</span>
              <select defaultValue={editingProject.stage} name="stage">
                {websitesProductionStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {websitesProductionStageLabels[stage]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span>Live planet · optional</span>
            <select
              defaultValue={editingProject?.forgePlanetId ?? ""}
              name="forgePlanetId"
            >
              <option value="">None</option>
              {forgePlanets.map((planet) => (
                <option key={planet.id} value={planet.id}>
                  {planet.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wideField}>
            <span>Next action · optional</span>
            <input
              defaultValue={editingProject?.nextAction ?? ""}
              maxLength={240}
              name="nextAction"
            />
          </label>
          <details className={styles.more} open={Boolean(editingProject?.notes)}>
            <summary>Notes</summary>
            <label className={styles.wideField}>
              <span>Notes</span>
              <textarea
                defaultValue={editingProject?.notes ?? ""}
                maxLength={3000}
                name="notes"
                rows={3}
              />
            </label>
          </details>
          <button
            className={styles.primaryButton}
            disabled={pendingAction !== null || usableClients.length === 0}
            type="submit"
          >
            {pendingAction === "save"
              ? "Saving…"
              : editingProject === null
                ? "Save project"
                : "Save changes"}
          </button>
        </form>
      ) : null}

      {projects.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>No projects yet</strong>
          <p>Add a client, then open a production project.</p>
        </div>
      ) : (
        <div className={styles.stageBoard}>
          {websitesProductionStages.map((stage) => {
            const stageProjects = projects.filter(
              (project) => project.stage === stage,
            );
            if (stageProjects.length === 0 && stage === "shipped") {
              return null;
            }

            return (
              <section
                aria-label={websitesProductionStageLabels[stage]}
                className={styles.stageColumn}
                data-stage={stage}
                key={stage}
              >
                <header>
                  <strong>{websitesProductionStageLabels[stage]}</strong>
                  <span>{stageProjects.length}</span>
                </header>
                {stageProjects.length === 0 ? (
                  <p className={styles.stageEmpty}>Empty</p>
                ) : (
                  <ul className={styles.recordList}>
                    {stageProjects.map((project) => {
                      const client = clients.find(
                        (item) => item.id === project.clientId,
                      );
                      const planet =
                        project.forgePlanetId === null
                          ? null
                          : getForgePlanet(project.forgePlanetId);

                      return (
                        <li key={project.id}>
                          <strong>{project.name}</strong>
                          <p>
                            {client?.name ?? "Unknown client"}
                            {planet === null ? "" : ` · ${planet.name}`}
                          </p>
                          {project.nextAction.length > 0 ? (
                            <p>{project.nextAction}</p>
                          ) : null}
                          <div className={styles.recordActions}>
                            <button
                              disabled={
                                pendingAction !== null ||
                                adjacentProductionStage(project.stage, -1) ===
                                  null
                              }
                              onClick={() => void moveStage(project, -1)}
                              type="button"
                            >
                              Back
                            </button>
                            <button
                              disabled={
                                pendingAction !== null ||
                                adjacentProductionStage(project.stage, 1) ===
                                  null
                              }
                              onClick={() => void moveStage(project, 1)}
                              type="button"
                            >
                              Next
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(project.id);
                                setIsComposerOpen(true);
                                setFeedback("");
                              }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => void handleRemove(project)}
                              type="button"
                            >
                              Remove
                            </button>
                            {planet !== null ? (
                              <a
                                href={planet.externalUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Open live
                              </a>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p aria-live="polite" className={styles.feedback}>
        {feedback}
      </p>
    </section>
  );
}
