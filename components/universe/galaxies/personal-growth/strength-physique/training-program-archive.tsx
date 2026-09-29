"use client";

import { useState } from "react";

import {
  MissionWorkspace,
  useArrivalWorkspace,
  WorkspaceGrid,
  WorkspacePanel,
} from "@/components/ui/mission-workspace";

import { archivedTrainingProgram } from "./archived-training-program";

const programRotations = [1, 2] as const;

type TrainingProgramArchiveProps = Readonly<{
  isVisible: boolean;
}>;

export function TrainingProgramArchive({
  isVisible,
}: TrainingProgramArchiveProps) {
  const [isOpen, setIsOpen] = useArrivalWorkspace(isVisible);
  const [rotation, setRotation] = useState<1 | 2>(1);

  if (!isVisible) {
    return null;
  }

  const sessions = archivedTrainingProgram.sessions.filter(
    (session) => session.rotation === rotation,
  );
  const movementCount = sessions.reduce(
    (total, session) => total + session.exercises.length,
    0,
  );

  return (
    <MissionWorkspace
      accent="214 186 132"
      actions={
        <a
          href={archivedTrainingProgram.originalDocumentPath}
          rel="noopener noreferrer"
          target="_blank"
        >
          Original PDF <span aria-hidden="true">↗</span>
        </a>
      }
      description={archivedTrainingProgram.description}
      eyebrow="Daniel's program · Archived"
      isOpen={isOpen}
      launcherLabel="Program"
      metrics={[
        { id: "length", label: "Length", value: "4 weeks" },
        { id: "split", label: "Split", value: "4 days" },
        { id: "rotation", label: "Rotation", value: `${rotation} of 2` },
        {
          hint: `across ${sessions.length} days`,
          id: "movements",
          label: "Movements",
          value: movementCount,
        },
      ]}
      onOpenChange={setIsOpen}
      status={archivedTrainingProgram.title}
      surfaceId="training-archive"
      title={archivedTrainingProgram.title}
    >
      <WorkspaceGrid className="training-archive">
        <WorkspacePanel
          actions={
            <div
              aria-label="Program rotation"
              className="training-archive__rotation"
              role="group"
            >
              {programRotations.map((value) => (
                <button
                  aria-pressed={rotation === value}
                  key={value}
                  onClick={() => setRotation(value)}
                  type="button"
                >
                  Rotation {value}
                </button>
              ))}
            </div>
          }
          eyebrow="Sessions"
          span={12}
          title="Weekly split"
        >
          <div className="training-archive__sessions">
            {sessions.map((session, index) => (
              <article key={session.id}>
                <header>
                  <span>Day {index + 1}</span>
                  <strong>{session.name}</strong>
                  <small>{session.exercises.length} movements</small>
                </header>
                <ol>
                  {session.exercises.map((exercise) => (
                    <li key={exercise}>{exercise}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel eyebrow="Method" span={12} title="Progression">
          <ul className="training-archive__progression">
            {archivedTrainingProgram.progression.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </WorkspacePanel>
      </WorkspaceGrid>
    </MissionWorkspace>
  );
}
