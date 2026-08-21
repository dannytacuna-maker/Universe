"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { subscribeToMissionDataChanges } from "@/lib/mission-record-sync";

import type {
  NewWebsitesClient,
  NewWebsitesOpportunity,
  NewWebsitesProject,
  WebsitesClientUpdate,
  WebsitesOpportunityUpdate,
  WebsitesProductionData,
  WebsitesProjectUpdate,
} from "./websites-production-record";
import {
  deleteWebsitesClient,
  deleteWebsitesOpportunity,
  deleteWebsitesProject,
  listWebsitesProductionData,
  saveWebsitesClient,
  saveWebsitesOpportunity,
  saveWebsitesProject,
  updateWebsitesClient,
  updateWebsitesOpportunity,
  updateWebsitesProject,
} from "./websites-production-repository";
import { deriveWebsitesProductionPulse } from "./websites-production-summary";

const emptyData: WebsitesProductionData = {
  clients: [],
  opportunities: [],
  projects: [],
};

export type WebsitesProductionCenterController = ReturnType<
  typeof useWebsitesProductionCenter
>;

export function useWebsitesProductionCenter() {
  const [data, setData] = useState<WebsitesProductionData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const load = () =>
      listWebsitesProductionData().then((stored) => {
        if (isCurrent) {
          setData(stored);
          setStorageError(null);
        }
      });

    void load()
      .catch((error: unknown) => {
        if (isCurrent) {
          setStorageError(
            error instanceof Error
              ? error.message
              : "Production center records could not be opened.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    const unsubscribe = subscribeToMissionDataChanges(() => void load());

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  const pulse = useMemo(() => deriveWebsitesProductionPulse(data), [data]);

  const addClient = useCallback(async (input: NewWebsitesClient) => {
    const client = await saveWebsitesClient(input);
    setData((current) => ({
      ...current,
      clients: [...current.clients, client].toSorted((first, second) =>
        first.name.localeCompare(second.name),
      ),
    }));
    return client;
  }, []);

  const editClient = useCallback(async (input: WebsitesClientUpdate) => {
    const updated = await updateWebsitesClient(input);
    setData((current) => ({
      ...current,
      clients: current.clients
        .map((client) => (client.id === updated.id ? updated : client))
        .toSorted((first, second) => first.name.localeCompare(second.name)),
    }));
  }, []);

  const removeClient = useCallback(async (id: string) => {
    await deleteWebsitesClient(id);
    setData((current) => ({
      ...current,
      clients: current.clients.filter((client) => client.id !== id),
    }));
  }, []);

  const addOpportunity = useCallback(async (input: NewWebsitesOpportunity) => {
    const opportunity = await saveWebsitesOpportunity(input);
    setData((current) => ({
      ...current,
      opportunities: [opportunity, ...current.opportunities],
    }));
  }, []);

  const editOpportunity = useCallback(
    async (input: WebsitesOpportunityUpdate) => {
      const updated = await updateWebsitesOpportunity(input);
      setData((current) => ({
        ...current,
        opportunities: current.opportunities.map((opportunity) =>
          opportunity.id === updated.id ? updated : opportunity,
        ),
      }));
    },
    [],
  );

  const removeOpportunity = useCallback(async (id: string) => {
    await deleteWebsitesOpportunity(id);
    setData((current) => ({
      ...current,
      opportunities: current.opportunities.filter(
        (opportunity) => opportunity.id !== id,
      ),
    }));
  }, []);

  const addProject = useCallback(async (input: NewWebsitesProject) => {
    const project = await saveWebsitesProject(input);
    setData((current) => ({
      ...current,
      projects: [project, ...current.projects],
    }));
  }, []);

  const editProject = useCallback(async (input: WebsitesProjectUpdate) => {
    const updated = await updateWebsitesProject(input);
    setData((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === updated.id ? updated : project,
      ),
    }));
  }, []);

  const removeProject = useCallback(async (id: string) => {
    await deleteWebsitesProject(id);
    setData((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.id !== id),
    }));
  }, []);

  return {
    ...data,
    addClient,
    addOpportunity,
    addProject,
    editClient,
    editOpportunity,
    editProject,
    isLoading,
    pulse,
    removeClient,
    removeOpportunity,
    removeProject,
    storageError,
  };
}
