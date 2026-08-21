import {
  openMissionControlDatabase,
  requestResult,
  transactionComplete,
  websitesProductionStoreNames,
} from "@/lib/mission-control-database";
import {
  queueMissionRecordDelete,
  queueMissionRecordUpsert,
} from "@/lib/mission-record-sync";

import { forgePlanets } from "./firmus-planets";
import type {
  ForgePlanetId,
  NewWebsitesClient,
  NewWebsitesOpportunity,
  NewWebsitesProject,
  WebsitesClient,
  WebsitesClientUpdate,
  WebsitesOpportunity,
  WebsitesOpportunityUpdate,
  WebsitesProductionData,
  WebsitesProject,
  WebsitesProjectUpdate,
} from "./websites-production-record";
import { isWebsitesProductionStage } from "./websites-production-record";

const knownPlanetIds = new Set(forgePlanets.map((planet) => planet.id));

function assertKnownPlanetId(forgePlanetId: ForgePlanetId | null) {
  if (forgePlanetId === null) {
    return;
  }

  if (!knownPlanetIds.has(forgePlanetId)) {
    throw new Error(
      "Link only an existing Forge planet, or clear the planet link.",
    );
  }
}

export async function listWebsitesProductionData(): Promise<WebsitesProductionData> {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      Object.values(websitesProductionStoreNames),
      "readonly",
    );
    const [clients, opportunities, projects] = await Promise.all([
      requestResult(
        transaction
          .objectStore(websitesProductionStoreNames.clients)
          .getAll() as IDBRequest<WebsitesClient[]>,
      ),
      requestResult(
        transaction
          .objectStore(websitesProductionStoreNames.opportunities)
          .getAll() as IDBRequest<WebsitesOpportunity[]>,
      ),
      requestResult(
        transaction
          .objectStore(websitesProductionStoreNames.projects)
          .getAll() as IDBRequest<WebsitesProject[]>,
      ),
    ]);

    return {
      clients: clients.toSorted((first, second) =>
        first.name.localeCompare(second.name),
      ),
      opportunities: opportunities.toSorted((first, second) =>
        second.updatedAt.localeCompare(first.updatedAt),
      ),
      projects: projects.toSorted((first, second) =>
        second.updatedAt.localeCompare(first.updatedAt),
      ),
    };
  } finally {
    database.close();
  }
}

export async function saveWebsitesClient(input: NewWebsitesClient) {
  if (input.name.trim().length === 0) {
    throw new Error("Name the client.");
  }

  const now = new Date().toISOString();
  const client: WebsitesClient = {
    company: input.company.trim(),
    contact: input.contact.trim(),
    createdAt: now,
    id: crypto.randomUUID(),
    name: input.name.trim(),
    notes: input.notes.trim(),
    status: input.status,
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.clients,
      "readwrite",
    );
    transaction.objectStore(websitesProductionStoreNames.clients).add(client);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(
      websitesProductionStoreNames.clients,
      client,
    );
    return client;
  } finally {
    database.close();
  }
}

export async function updateWebsitesClient(input: WebsitesClientUpdate) {
  if (input.name.trim().length === 0) {
    throw new Error("Name the client.");
  }

  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.clients,
      "readwrite",
    );
    const store = transaction.objectStore(websitesProductionStoreNames.clients);
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<WebsitesClient | undefined>,
    );

    if (existing === undefined) {
      throw new Error("That client could not be found.");
    }

    const updated: WebsitesClient = {
      ...existing,
      company: input.company.trim(),
      contact: input.contact.trim(),
      name: input.name.trim(),
      notes: input.notes.trim(),
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(
      websitesProductionStoreNames.clients,
      updated,
    );
    return updated;
  } finally {
    database.close();
  }
}

export async function deleteWebsitesClient(id: string) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.clients,
      "readwrite",
    );
    transaction.objectStore(websitesProductionStoreNames.clients).delete(id);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(websitesProductionStoreNames.clients, id);
  } finally {
    database.close();
  }
}

export async function saveWebsitesOpportunity(input: NewWebsitesOpportunity) {
  if (input.clientId.trim().length === 0) {
    throw new Error("Attach the opportunity to a client.");
  }

  if (input.interest.trim().length === 0) {
    throw new Error("Describe the interest.");
  }

  const now = new Date().toISOString();
  const opportunity: WebsitesOpportunity = {
    clientId: input.clientId,
    createdAt: now,
    id: crypto.randomUUID(),
    interest: input.interest.trim(),
    notes: input.notes.trim(),
    status: input.status,
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.opportunities,
      "readwrite",
    );
    transaction
      .objectStore(websitesProductionStoreNames.opportunities)
      .add(opportunity);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(
      websitesProductionStoreNames.opportunities,
      opportunity,
    );
    return opportunity;
  } finally {
    database.close();
  }
}

export async function updateWebsitesOpportunity(
  input: WebsitesOpportunityUpdate,
) {
  if (input.interest.trim().length === 0) {
    throw new Error("Describe the interest.");
  }

  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.opportunities,
      "readwrite",
    );
    const store = transaction.objectStore(
      websitesProductionStoreNames.opportunities,
    );
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<WebsitesOpportunity | undefined>,
    );

    if (existing === undefined) {
      throw new Error("That opportunity could not be found.");
    }

    const updated: WebsitesOpportunity = {
      ...existing,
      clientId: input.clientId,
      interest: input.interest.trim(),
      notes: input.notes.trim(),
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(
      websitesProductionStoreNames.opportunities,
      updated,
    );
    return updated;
  } finally {
    database.close();
  }
}

export async function deleteWebsitesOpportunity(id: string) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.opportunities,
      "readwrite",
    );
    transaction
      .objectStore(websitesProductionStoreNames.opportunities)
      .delete(id);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(
      websitesProductionStoreNames.opportunities,
      id,
    );
  } finally {
    database.close();
  }
}

function normalizeProjectInput(input: NewWebsitesProject) {
  if (input.clientId.trim().length === 0) {
    throw new Error("Attach the project to a client.");
  }

  if (input.name.trim().length === 0) {
    throw new Error("Name the project.");
  }

  if (!isWebsitesProductionStage(input.stage)) {
    throw new Error("Choose a valid production stage.");
  }

  assertKnownPlanetId(input.forgePlanetId);

  return {
    clientId: input.clientId,
    forgePlanetId: input.forgePlanetId,
    name: input.name.trim(),
    nextAction: input.nextAction.trim(),
    notes: input.notes.trim(),
    stage: input.stage,
  };
}

export async function saveWebsitesProject(input: NewWebsitesProject) {
  const normalized = normalizeProjectInput(input);
  const now = new Date().toISOString();
  const project: WebsitesProject = {
    ...normalized,
    createdAt: now,
    id: crypto.randomUUID(),
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.projects,
      "readwrite",
    );
    transaction.objectStore(websitesProductionStoreNames.projects).add(project);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(
      websitesProductionStoreNames.projects,
      project,
    );
    return project;
  } finally {
    database.close();
  }
}

export async function updateWebsitesProject(input: WebsitesProjectUpdate) {
  const normalized = normalizeProjectInput(input);
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.projects,
      "readwrite",
    );
    const store = transaction.objectStore(
      websitesProductionStoreNames.projects,
    );
    const existing = await requestResult(
      store.get(input.id) as IDBRequest<WebsitesProject | undefined>,
    );

    if (existing === undefined) {
      throw new Error("That project could not be found.");
    }

    const updated: WebsitesProject = {
      ...existing,
      ...normalized,
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    await queueMissionRecordUpsert(
      websitesProductionStoreNames.projects,
      updated,
    );
    return updated;
  } finally {
    database.close();
  }
}

export async function deleteWebsitesProject(id: string) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      websitesProductionStoreNames.projects,
      "readwrite",
    );
    transaction.objectStore(websitesProductionStoreNames.projects).delete(id);
    await transactionComplete(transaction);
    await queueMissionRecordDelete(websitesProductionStoreNames.projects, id);
  } finally {
    database.close();
  }
}
