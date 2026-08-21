"use client";

import { useRef, useState, type FormEvent } from "react";

import type { WebsitesProductionCenterController } from "./use-websites-production-center";
import {
  websitesClientStatusLabels,
  websitesOpportunityStatusLabels,
  websitesProductionStageLabels,
  type WebsitesClient,
  type WebsitesClientStatus,
  type WebsitesOpportunity,
  type WebsitesOpportunityStatus,
} from "./websites-production-record";
import styles from "./websites-production-center.module.css";

type WebsitesPeoplePanelProps = Readonly<{
  clients: WebsitesProductionCenterController["clients"];
  onAddClient: WebsitesProductionCenterController["addClient"];
  onAddOpportunity: WebsitesProductionCenterController["addOpportunity"];
  onEditClient: WebsitesProductionCenterController["editClient"];
  onEditOpportunity: WebsitesProductionCenterController["editOpportunity"];
  onRemoveClient: WebsitesProductionCenterController["removeClient"];
  onRemoveOpportunity: WebsitesProductionCenterController["removeOpportunity"];
  opportunities: WebsitesProductionCenterController["opportunities"];
  projects: WebsitesProductionCenterController["projects"];
}>;

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The record could not be updated.";
}

export function WebsitesPeoplePanel({
  clients,
  onAddClient,
  onAddOpportunity,
  onEditClient,
  onEditOpportunity,
  onRemoveClient,
  onRemoveOpportunity,
  opportunities,
  projects,
}: WebsitesPeoplePanelProps) {
  const pendingGuard = useRef(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [isClientComposerOpen, setIsClientComposerOpen] = useState(
    clients.length === 0,
  );
  const [isOpportunityComposerOpen, setIsOpportunityComposerOpen] =
    useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ?? null;
  const editingClient =
    clients.find((client) => client.id === editingClientId) ?? null;
  const relatedOpportunities =
    selectedClient === null
      ? []
      : opportunities.filter(
          (opportunity) => opportunity.clientId === selectedClient.id,
        );
  const relatedProjects =
    selectedClient === null
      ? []
      : projects.filter((project) => project.clientId === selectedClient.id);
  const openOpportunities = opportunities.filter(
    (opportunity) => opportunity.status === "open",
  );

  const handleClientSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingGuard.current) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      company: String(data.get("company") ?? ""),
      contact: String(data.get("contact") ?? ""),
      name: String(data.get("name") ?? ""),
      notes: String(data.get("notes") ?? ""),
      status: String(data.get("status") ?? "lead") as WebsitesClientStatus,
    };

    pendingGuard.current = true;
    setPendingAction("client-save");
    setFeedback("");

    try {
      if (editingClient === null) {
        const created = await onAddClient(input);
        setSelectedClientId(created.id);
        setFeedback("Client saved.");
      } else {
        await onEditClient({ ...input, id: editingClient.id });
        setFeedback("Client updated.");
      }
      setEditingClientId(null);
      setIsClientComposerOpen(false);
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const handleOpportunitySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingGuard.current) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      clientId: String(data.get("clientId") ?? ""),
      interest: String(data.get("interest") ?? ""),
      notes: String(data.get("notes") ?? ""),
      status: String(data.get("status") ?? "open") as WebsitesOpportunityStatus,
    };

    pendingGuard.current = true;
    setPendingAction("opportunity-save");
    setFeedback("");

    try {
      await onAddOpportunity(input);
      form.reset();
      setIsOpportunityComposerOpen(false);
      setFeedback("Opportunity saved.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const updateOpportunityStatus = async (
    opportunity: WebsitesOpportunity,
    status: WebsitesOpportunityStatus,
  ) => {
    if (pendingGuard.current) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(opportunity.id);
    setFeedback("");

    try {
      await onEditOpportunity({
        clientId: opportunity.clientId,
        id: opportunity.id,
        interest: opportunity.interest,
        notes: opportunity.notes,
        status,
      });
      setFeedback(`Marked ${websitesOpportunityStatusLabels[status]}.`);
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const handleRemoveClient = async (client: WebsitesClient) => {
    if (
      pendingGuard.current ||
      !window.confirm(
        `Remove client “${client.name}”? Related projects and opportunities stay until removed separately.`,
      )
    ) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(client.id);
    setFeedback("");

    try {
      await onRemoveClient(client.id);
      if (selectedClientId === client.id) {
        setSelectedClientId(null);
      }
      setFeedback("Client removed.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  const handleRemoveOpportunity = async (opportunity: WebsitesOpportunity) => {
    if (
      pendingGuard.current ||
      !window.confirm("Remove this opportunity?")
    ) {
      return;
    }

    pendingGuard.current = true;
    setPendingAction(opportunity.id);
    setFeedback("");

    try {
      await onRemoveOpportunity(opportunity.id);
      setFeedback("Opportunity removed.");
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      pendingGuard.current = false;
      setPendingAction(null);
    }
  };

  return (
    <section aria-labelledby="websites-people-title" className={styles.panel}>
      <header className={styles.sectionHeading}>
        <div>
          <span>People</span>
          <h3 id="websites-people-title">Clients & interest</h3>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={() => {
            setEditingClientId(null);
            setIsClientComposerOpen(true);
            setFeedback("");
          }}
          type="button"
        >
          Add client
        </button>
      </header>

      {isClientComposerOpen ? (
        <form
          className={styles.recordForm}
          key={editingClient?.id ?? "new-client"}
          onSubmit={handleClientSubmit}
        >
          <div className={styles.formHeading}>
            <strong>
              {editingClient === null ? "New client" : "Edit client"}
            </strong>
            <button
              onClick={() => {
                setEditingClientId(null);
                setIsClientComposerOpen(false);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
          <label className={styles.wideField}>
            <span>Name</span>
            <input
              defaultValue={editingClient?.name ?? ""}
              maxLength={160}
              name="name"
              required
            />
          </label>
          <label>
            <span>Status</span>
            <select
              defaultValue={editingClient?.status ?? "lead"}
              name="status"
            >
              {(
                Object.keys(
                  websitesClientStatusLabels,
                ) as WebsitesClientStatus[]
              ).map((status) => (
                <option key={status} value={status}>
                  {websitesClientStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Company · optional</span>
            <input
              defaultValue={editingClient?.company ?? ""}
              maxLength={160}
              name="company"
            />
          </label>
          <label className={styles.wideField}>
            <span>Contact · optional</span>
            <input
              defaultValue={editingClient?.contact ?? ""}
              maxLength={240}
              name="contact"
              placeholder="Email, phone, or channel"
            />
          </label>
          <details className={styles.more} open={Boolean(editingClient?.notes)}>
            <summary>Notes</summary>
            <label className={styles.wideField}>
              <span>Notes</span>
              <textarea
                defaultValue={editingClient?.notes ?? ""}
                maxLength={3000}
                name="notes"
                rows={3}
              />
            </label>
          </details>
          <button
            className={styles.primaryButton}
            disabled={pendingAction !== null}
            type="submit"
          >
            {pendingAction === "client-save" ? "Saving…" : "Save client"}
          </button>
        </form>
      ) : null}

      {clients.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>No clients yet</strong>
          <p>Capture a lead or active client to start planning.</p>
        </div>
      ) : (
        <ul className={styles.peopleList}>
          {clients.map((client) => (
            <li data-active={client.id === selectedClientId} key={client.id}>
              <button
                onClick={() => setSelectedClientId(client.id)}
                type="button"
              >
                <strong>{client.name}</strong>
                <small>{websitesClientStatusLabels[client.status]}</small>
              </button>
            </li>
          ))}
        </ul>
      )}

      <details
        className={styles.more}
        open={openOpportunities.length > 0 || isOpportunityComposerOpen}
      >
        <summary>
          Open interest
          <span>{openOpportunities.length}</span>
        </summary>
        <div className={styles.inlineActions}>
          <button
            className={styles.secondaryButton}
            disabled={clients.length === 0}
            onClick={() => setIsOpportunityComposerOpen(true)}
            type="button"
          >
            Add opportunity
          </button>
        </div>
        {isOpportunityComposerOpen ? (
          <form className={styles.recordForm} onSubmit={handleOpportunitySubmit}>
            <div className={styles.formHeading}>
              <strong>New opportunity</strong>
              <button
                onClick={() => setIsOpportunityComposerOpen(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
            <label>
              <span>Client</span>
              <select
                defaultValue={selectedClientId ?? clients[0]?.id}
                name="clientId"
                required
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="open" name="status">
                {(
                  Object.keys(
                    websitesOpportunityStatusLabels,
                  ) as WebsitesOpportunityStatus[]
                ).map((status) => (
                  <option key={status} value={status}>
                    {websitesOpportunityStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.wideField}>
              <span>Interest</span>
              <input maxLength={240} name="interest" required />
            </label>
            <label className={styles.wideField}>
              <span>Notes · optional</span>
              <textarea maxLength={2000} name="notes" rows={2} />
            </label>
            <button
              className={styles.primaryButton}
              disabled={pendingAction !== null}
              type="submit"
            >
              {pendingAction === "opportunity-save"
                ? "Saving…"
                : "Save opportunity"}
            </button>
          </form>
        ) : null}
        {openOpportunities.length === 0 ? (
          <p className={styles.stageEmpty}>No open opportunities.</p>
        ) : (
          <ul className={styles.recordList}>
            {openOpportunities.map((opportunity) => {
              const client = clients.find(
                (item) => item.id === opportunity.clientId,
              );
              return (
                <li key={opportunity.id}>
                  <strong>{opportunity.interest}</strong>
                  <p>{client?.name ?? "Unknown client"}</p>
                  <div className={styles.recordActions}>
                    <button
                      disabled={pendingAction !== null}
                      onClick={() =>
                        void updateOpportunityStatus(opportunity, "won")
                      }
                      type="button"
                    >
                      Won
                    </button>
                    <button
                      disabled={pendingAction !== null}
                      onClick={() =>
                        void updateOpportunityStatus(opportunity, "parked")
                      }
                      type="button"
                    >
                      Park
                    </button>
                    <button
                      disabled={pendingAction !== null}
                      onClick={() =>
                        void updateOpportunityStatus(opportunity, "lost")
                      }
                      type="button"
                    >
                      Lost
                    </button>
                    <button
                      onClick={() => void handleRemoveOpportunity(opportunity)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </details>

      {selectedClient === null ? null : (
        <article className={styles.clientCard}>
          <header className={styles.sectionHeading}>
            <div>
              <span>Client card</span>
              <h3>{selectedClient.name}</h3>
            </div>
            <div className={styles.recordActions}>
              <button
                onClick={() => {
                  setEditingClientId(selectedClient.id);
                  setIsClientComposerOpen(true);
                }}
                type="button"
              >
                Edit
              </button>
              <button
                onClick={() => void handleRemoveClient(selectedClient)}
                type="button"
              >
                Remove
              </button>
            </div>
          </header>
          <p>
            {websitesClientStatusLabels[selectedClient.status]}
            {selectedClient.company.length > 0
              ? ` · ${selectedClient.company}`
              : ""}
          </p>
          {selectedClient.contact.length > 0 ? (
            <p>{selectedClient.contact}</p>
          ) : null}
          {selectedClient.notes.length > 0 ? (
            <p>{selectedClient.notes}</p>
          ) : null}

          <h4>Opportunities</h4>
          {relatedOpportunities.length === 0 ? (
            <p className={styles.stageEmpty}>None yet.</p>
          ) : (
            <ul className={styles.recordList}>
              {relatedOpportunities.map((opportunity) => (
                <li key={opportunity.id}>
                  <strong>{opportunity.interest}</strong>
                  <p>
                    {websitesOpportunityStatusLabels[opportunity.status]}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <h4>Projects</h4>
          {relatedProjects.length === 0 ? (
            <p className={styles.stageEmpty}>None yet.</p>
          ) : (
            <ul className={styles.recordList}>
              {relatedProjects.map((project) => (
                <li key={project.id}>
                  <strong>{project.name}</strong>
                  <p>{websitesProductionStageLabels[project.stage]}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      <p aria-live="polite" className={styles.feedback}>
        {feedback}
      </p>
    </section>
  );
}
