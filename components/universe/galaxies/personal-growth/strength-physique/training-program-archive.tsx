"use client";

import { useState } from "react";

import { archivedTrainingProgram } from "./archived-training-program";

const programRotations = [1, 2] as const;

type TrainingProgramArchiveProps = Readonly<{
  isVisible: boolean;
}>;

export function TrainingProgramArchive({
  isVisible,
}: TrainingProgramArchiveProps) {
  const [rotation, setRotation] = useState<1 | 2>(1);

  if (!isVisible) {
    return null;
  }

  const sessions = archivedTrainingProgram.sessions.filter(
    (session) => session.rotation === rotation,
  );

  return (
    <aside
      aria-label="Archived powerbuilding program"
      className="destination-panel destination-panel--workspace training-archive"
      data-open="true"
    >
      <header className="destination-panel__summary">
        <div>
          <span>Daniel&apos;s program · Archived</span>
          <strong>{archivedTrainingProgram.title}</strong>
          <p>Four weeks · Four-day split · Two rotations</p>
        </div>
      </header>

      <div className="destination-panel__body">
        <p className="destination-panel__intro">
          {archivedTrainingProgram.description}
        </p>

        <ul className="training-archive__progression">
          {archivedTrainingProgram.progression.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

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

        <div className="training-archive__sessions">
          {sessions.map((session, index) => (
            <details key={session.id} open={index === 0}>
              <summary>
                <span>Day {index + 1}</span>
                <strong>{session.name}</strong>
                <small>{session.exercises.length} movements</small>
              </summary>
              <ol>
                {session.exercises.map((exercise) => (
                  <li key={exercise}>{exercise}</li>
                ))}
              </ol>
            </details>
          ))}
        </div>

        <a
          className="destination-panel__link"
          href={archivedTrainingProgram.originalDocumentPath}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open original PDF
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </aside>
  );
}
