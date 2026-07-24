import {
  missionOperatingStoreNames,
  openMissionControlDatabase,
  requestResult,
  transactionComplete,
} from "@/lib/mission-control-database";

import type {
  CycleEvidence,
  GrowthCycle,
  GrowthCycleStatus,
  MissionCapture,
  MissionExperiment,
  MissionExperimentConclusion,
  MissionIdentity,
  MissionIdentityUpdate,
  MissionOperatingData,
  NewGrowthCycle,
  NewMissionCapture,
  NewMissionExperiment,
  WeeklyReview,
  WeeklyReviewInput,
} from "./mission-operating-record";
import { getLocalDateKey } from "./mission-operating-record";

const defaultIdentity: MissionIdentity = {
  id: "primary",
  identityStatements: [
    "I build meaningful systems with discipline and curiosity.",
    "I train consistently and recover deliberately.",
    "I turn learning into useful action.",
    "I protect time for family and strong relationships.",
  ],
  name: "Daniel",
  northStar:
    "Become an exceptional entrepreneur while living a healthy, disciplined, and meaningful life.",
  recoveryMode: false,
  updatedAt: new Date(0).toISOString(),
  values: [
    "Discipline",
    "Continuous improvement",
    "Curiosity",
    "Health",
    "Leadership",
    "Family",
    "Freedom",
  ],
};

const defaultCycles: readonly GrowthCycle[] = [
  {
    areaId: "jiu-jitsu",
    createdAt: new Date(0).toISOString(),
    destinationId: "jiu-jitsu",
    id: "foundation-jiu-jitsu",
    identityStatement: "I am a technical, consistent martial artist.",
    minimumAction: "Attend training or review one technique with intention.",
    priority: 1,
    status: "active",
    title: "Deliberate Jiu-Jitsu practice",
    updatedAt: new Date(0).toISOString(),
    weeklyTarget: 3,
  },
  {
    areaId: "strength-physique",
    createdAt: new Date(0).toISOString(),
    destinationId: "strength-physique",
    id: "foundation-strength",
    identityStatement: "I train with discipline and recover with purpose.",
    minimumAction: "Complete the planned session or deliberate recovery.",
    priority: 2,
    status: "active",
    title: "Build strength consistently",
    updatedAt: new Date(0).toISOString(),
    weeklyTarget: 6,
  },
  {
    areaId: "reading",
    createdAt: new Date(0).toISOString(),
    destinationId: "reading",
    id: "foundation-reading",
    identityStatement: "I am a curious learner who captures useful ideas.",
    minimumAction: "Read and capture one idea worth remembering.",
    priority: 3,
    status: "active",
    title: "Read with intention",
    updatedAt: new Date(0).toISOString(),
    weeklyTarget: 5,
  },
];

type MissionCaptureStatus = MissionCapture["status"];

async function initializeMissionOperatingData(database: IDBDatabase) {
  const identityStoreName = missionOperatingStoreNames.identity;
  const cycleStoreName = missionOperatingStoreNames.growthCycles;
  const transaction = database.transaction(
    [identityStoreName, cycleStoreName],
    "readwrite",
  );
  const identityStore = transaction.objectStore(identityStoreName);
  const existingIdentity = await requestResult(
    identityStore.get(defaultIdentity.id) as IDBRequest<
      MissionIdentity | undefined
    >,
  );

  if (existingIdentity === undefined) {
    const initializedAt = new Date().toISOString();
    identityStore.put({ ...defaultIdentity, updatedAt: initializedAt });

    for (const cycle of defaultCycles) {
      transaction.objectStore(cycleStoreName).put({
        ...cycle,
        createdAt: initializedAt,
        updatedAt: initializedAt,
      });
    }
  }

  await transactionComplete(transaction);
}

export async function listMissionOperatingData(): Promise<MissionOperatingData> {
  const database = await openMissionControlDatabase();

  try {
    await initializeMissionOperatingData(database);
    const storeNames = Object.values(missionOperatingStoreNames);
    const transaction = database.transaction(storeNames, "readonly");
    const [identity, cycles, evidence, captures, reviews, experiments] =
      await Promise.all([
        requestResult(
          transaction
            .objectStore(missionOperatingStoreNames.identity)
            .get("primary") as IDBRequest<MissionIdentity>,
        ),
        requestResult(
          transaction
            .objectStore(missionOperatingStoreNames.growthCycles)
            .getAll() as IDBRequest<GrowthCycle[]>,
        ),
        requestResult(
          transaction
            .objectStore(missionOperatingStoreNames.cycleEvidence)
            .getAll() as IDBRequest<CycleEvidence[]>,
        ),
        requestResult(
          transaction
            .objectStore(missionOperatingStoreNames.captures)
            .getAll() as IDBRequest<MissionCapture[]>,
        ),
        requestResult(
          transaction
            .objectStore(missionOperatingStoreNames.weeklyReviews)
            .getAll() as IDBRequest<WeeklyReview[]>,
        ),
        requestResult(
          transaction
            .objectStore(missionOperatingStoreNames.experiments)
            .getAll() as IDBRequest<MissionExperiment[]>,
        ),
      ]);

    return {
      captures: captures.toSorted((first, second) =>
        second.createdAt.localeCompare(first.createdAt),
      ),
      cycles: cycles.toSorted(
        (first, second) =>
          first.priority - second.priority ||
          first.createdAt.localeCompare(second.createdAt),
      ),
      evidence: evidence.toSorted((first, second) =>
        second.occurredOn.localeCompare(first.occurredOn),
      ),
      experiments: experiments.toSorted((first, second) =>
        second.updatedAt.localeCompare(first.updatedAt),
      ),
      identity,
      reviews: reviews.toSorted((first, second) =>
        second.weekStart.localeCompare(first.weekStart),
      ),
    };
  } finally {
    database.close();
  }
}

export async function updateMissionIdentity(input: MissionIdentityUpdate) {
  const name = input.name.trim();
  const northStar = input.northStar.trim();
  const values = input.values.map((value) => value.trim()).filter(Boolean);
  const identityStatements = input.identityStatements
    .map((statement) => statement.trim())
    .filter(Boolean);

  if (name.length === 0 || northStar.length === 0) {
    throw new Error("Name and north star are required.");
  }

  if (identityStatements.length === 0) {
    throw new Error("Add at least one identity statement.");
  }

  const identity: MissionIdentity = {
    id: "primary",
    identityStatements,
    name,
    northStar,
    recoveryMode: input.recoveryMode,
    updatedAt: new Date().toISOString(),
    values,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.identity,
      "readwrite",
    );
    transaction.objectStore(missionOperatingStoreNames.identity).put(identity);
    await transactionComplete(transaction);
    return identity;
  } finally {
    database.close();
  }
}

export async function saveGrowthCycle(input: NewGrowthCycle) {
  const title = input.title.trim();
  const identityStatement = input.identityStatement.trim();
  const minimumAction = input.minimumAction.trim();

  if (
    title.length === 0 ||
    identityStatement.length === 0 ||
    minimumAction.length === 0
  ) {
    throw new Error("Name the cycle, identity, and minimum action.");
  }

  if (
    !Number.isInteger(input.weeklyTarget) ||
    input.weeklyTarget < 1 ||
    input.weeklyTarget > 7
  ) {
    throw new Error("Weekly target must be between one and seven.");
  }

  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.growthCycles,
      "readwrite",
    );
    const store = transaction.objectStore(
      missionOperatingStoreNames.growthCycles,
    );
    const cycles = await requestResult(
      store.getAll() as IDBRequest<GrowthCycle[]>,
    );
    const activeCycles = cycles.filter((cycle) => cycle.status === "active");

    if (activeCycles.length >= 3) {
      throw new Error(
        "Current Vector is full. Pause a cycle before adding one.",
      );
    }

    const now = new Date().toISOString();
    const cycle: GrowthCycle = {
      ...input,
      createdAt: now,
      id: crypto.randomUUID(),
      identityStatement,
      minimumAction,
      priority: activeCycles.length + 1,
      status: "active",
      title,
      updatedAt: now,
    };
    store.add(cycle);
    await transactionComplete(transaction);
    return cycle;
  } finally {
    database.close();
  }
}

export async function updateGrowthCycleStatus(
  cycleId: string,
  status: GrowthCycleStatus,
) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.growthCycles,
      "readwrite",
    );
    const store = transaction.objectStore(
      missionOperatingStoreNames.growthCycles,
    );
    const [cycle, cycles] = await Promise.all([
      requestResult(store.get(cycleId) as IDBRequest<GrowthCycle | undefined>),
      requestResult(store.getAll() as IDBRequest<GrowthCycle[]>),
    ]);

    if (cycle === undefined) {
      throw new Error("This growth cycle is no longer available.");
    }

    if (
      status === "active" &&
      cycle.status !== "active" &&
      cycles.filter((candidate) => candidate.status === "active").length >= 3
    ) {
      throw new Error("Current Vector can hold only three active cycles.");
    }

    const updated: GrowthCycle = {
      ...cycle,
      priority:
        status === "active"
          ? cycles.filter((candidate) => candidate.status === "active").length +
            1
          : cycle.priority,
      status,
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    return updated;
  } finally {
    database.close();
  }
}

export async function toggleTodayCycleEvidence(cycleId: string) {
  const occurredOn = getLocalDateKey();
  const id = `${cycleId}:${occurredOn}`;
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.cycleEvidence,
      "readwrite",
    );
    const store = transaction.objectStore(
      missionOperatingStoreNames.cycleEvidence,
    );
    const existing = await requestResult(
      store.get(id) as IDBRequest<CycleEvidence | undefined>,
    );

    if (existing === undefined) {
      const evidence: CycleEvidence = {
        createdAt: new Date().toISOString(),
        cycleId,
        id,
        occurredOn,
      };
      store.add(evidence);
      await transactionComplete(transaction);
      return evidence;
    }

    store.delete(id);
    await transactionComplete(transaction);
    return null;
  } finally {
    database.close();
  }
}

export async function saveMissionCapture(input: NewMissionCapture) {
  const content = input.content.trim();

  if (content.length === 0) {
    throw new Error("Capture something before saving.");
  }

  const now = new Date().toISOString();
  const capture: MissionCapture = {
    ...input,
    content,
    createdAt: now,
    id: crypto.randomUUID(),
    status: "inbox",
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.captures,
      "readwrite",
    );
    transaction.objectStore(missionOperatingStoreNames.captures).add(capture);
    await transactionComplete(transaction);
    return capture;
  } finally {
    database.close();
  }
}

export async function updateMissionCaptureStatus(
  captureId: string,
  status: MissionCaptureStatus,
) {
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.captures,
      "readwrite",
    );
    const store = transaction.objectStore(missionOperatingStoreNames.captures);
    const capture = await requestResult(
      store.get(captureId) as IDBRequest<MissionCapture | undefined>,
    );

    if (capture === undefined) {
      throw new Error("This capture is no longer available.");
    }

    const updated: MissionCapture = {
      ...capture,
      status,
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    return updated;
  } finally {
    database.close();
  }
}

export async function saveWeeklyReview(input: WeeklyReviewInput) {
  const now = new Date().toISOString();
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.weeklyReviews,
      "readwrite",
    );
    const store = transaction.objectStore(
      missionOperatingStoreNames.weeklyReviews,
    );
    const existing = await requestResult(
      store.get(input.weekStart) as IDBRequest<WeeklyReview | undefined>,
    );
    const review: WeeklyReview = {
      adjustment: input.adjustment.trim(),
      createdAt: existing?.createdAt ?? now,
      friction: input.friction.trim(),
      neglected: input.neglected.trim(),
      nextFocus: input.nextFocus.trim(),
      proudOf: input.proudOf.trim(),
      updatedAt: now,
      weekStart: input.weekStart,
    };
    store.put(review);
    await transactionComplete(transaction);
    return review;
  } finally {
    database.close();
  }
}

export async function saveMissionExperiment(input: NewMissionExperiment) {
  const title = input.title.trim();
  const hypothesis = input.hypothesis.trim();
  const protocol = input.protocol.trim();
  const signal = input.signal.trim();

  if (
    title.length === 0 ||
    hypothesis.length === 0 ||
    protocol.length === 0 ||
    signal.length === 0
  ) {
    throw new Error("Define the experiment, hypothesis, change, and signal.");
  }

  const now = new Date().toISOString();
  const experiment: MissionExperiment = {
    areaId: input.areaId,
    createdAt: now,
    decision: null,
    hypothesis,
    id: crypto.randomUUID(),
    observation: "",
    protocol,
    signal,
    status: "active",
    title,
    updatedAt: now,
  };
  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.experiments,
      "readwrite",
    );
    transaction
      .objectStore(missionOperatingStoreNames.experiments)
      .add(experiment);
    await transactionComplete(transaction);
    return experiment;
  } finally {
    database.close();
  }
}

export async function concludeMissionExperiment(
  input: MissionExperimentConclusion,
) {
  const observation = input.observation.trim();

  if (observation.length === 0) {
    throw new Error("Record what happened before concluding the experiment.");
  }

  const database = await openMissionControlDatabase();

  try {
    const transaction = database.transaction(
      missionOperatingStoreNames.experiments,
      "readwrite",
    );
    const store = transaction.objectStore(
      missionOperatingStoreNames.experiments,
    );
    const experiment = await requestResult(
      store.get(input.id) as IDBRequest<MissionExperiment | undefined>,
    );

    if (experiment === undefined) {
      throw new Error("This experiment is no longer available.");
    }

    const updated: MissionExperiment = {
      ...experiment,
      decision: input.decision,
      observation,
      status: "completed",
      updatedAt: new Date().toISOString(),
    };
    store.put(updated);
    await transactionComplete(transaction);
    return updated;
  } finally {
    database.close();
  }
}
