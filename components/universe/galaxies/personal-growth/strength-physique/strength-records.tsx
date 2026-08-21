"use client";

import { useState, type FormEvent } from "react";

import { strengthLiftIds, strengthLiftLabels } from "./strength-physique-plan";
import { getLocalDateValue } from "./strength-physique-progress";
import type {
  BodyWeightEntry,
  NewBodyWeightEntry,
  NewStrengthPersonalRecord,
  StrengthLiftObservation,
  StrengthPersonalRecord,
} from "./strength-physique-record";

type StrengthRecordsProps = Readonly<{
  bodyWeightEntries: readonly BodyWeightEntry[];
  liftHistory: readonly StrengthLiftObservation[];
  onAddBodyWeight: (input: NewBodyWeightEntry) => Promise<void>;
  onRemoveBodyWeight: (entryId: string) => Promise<void>;
  onUpdatePersonalRecord: (input: NewStrengthPersonalRecord) => Promise<void>;
  personalRecords: readonly StrengthPersonalRecord[];
}>;

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function StrengthRecords({
  bodyWeightEntries,
  liftHistory,
  onAddBodyWeight,
  onRemoveBodyWeight,
  onUpdatePersonalRecord,
  personalRecords,
}: StrengthRecordsProps) {
  const [isSavingRecords, setIsSavingRecords] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [feedback, setFeedback] = useState("");
  const today = getLocalDateValue(new Date());

  const handleRecordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSavingRecords) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const updates = strengthLiftIds.flatMap((liftId) => {
      const weightKg = Number(data.get(`${liftId}-weight`));
      const achievedOn = String(data.get(`${liftId}-date`) ?? "");

      return weightKg > 0 && achievedOn.length > 0
        ? [{ achievedOn, liftId, weightKg }]
        : [];
    });

    if (updates.length === 0) {
      setFeedback("Enter at least one personal record to save.");
      return;
    }

    setIsSavingRecords(true);
    setFeedback("");

    try {
      await Promise.all(updates.map(onUpdatePersonalRecord));
      setFeedback("Personal records updated.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Personal records could not be saved.",
      );
    } finally {
      setIsSavingRecords(false);
    }
  };

  const handleWeightSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSavingWeight) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const input: NewBodyWeightEntry = {
      measuredOn: String(data.get("measuredOn")),
      weightKg: Number(data.get("weightKg")),
    };

    setIsSavingWeight(true);
    setFeedback("");

    try {
      await onAddBodyWeight(input);
      form.reset();
      setFeedback("Body weight logged.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Body weight could not be saved.",
      );
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleRemoveWeight = async (entryId: string) => {
    if (!window.confirm("Remove this body weight entry?")) {
      return;
    }

    setFeedback("");

    try {
      await onRemoveBodyWeight(entryId);
      setFeedback("Body weight entry removed.");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Body weight entry could not be removed.",
      );
    }
  };

  return (
    <section
      aria-labelledby="strength-records-title"
      className="strength-tracker__section strength-records"
    >
      <header className="strength-tracker__section-heading">
        <div>
          <span>Markers</span>
          <strong id="strength-records-title">Records & body</strong>
        </div>
      </header>

      <form className="strength-records__lifts" onSubmit={handleRecordSubmit}>
        {strengthLiftIds.map((liftId) => {
          const record = personalRecords.find((item) => item.liftId === liftId);

          return (
            <fieldset key={`${liftId}-${record?.updatedAt ?? "empty"}`}>
              <legend>{strengthLiftLabels[liftId]}</legend>
              <label>
                <span>Best kg</span>
                <input
                  defaultValue={record?.weightKg}
                  inputMode="decimal"
                  max="1000"
                  min="0.1"
                  name={`${liftId}-weight`}
                  placeholder="—"
                  step="0.1"
                  type="number"
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  defaultValue={record?.achievedOn ?? today}
                  max={today}
                  name={`${liftId}-date`}
                  type="date"
                />
              </label>
            </fieldset>
          );
        })}
        <button disabled={isSavingRecords} type="submit">
          {isSavingRecords ? "Saving" : "Save records"}
        </button>
      </form>

      {liftHistory.length > 0 ? (
        <div className="strength-records__lift-history">
          <strong>Strength trajectory</strong>
          <ul>
            {strengthLiftIds.map((liftId) => {
              const history = liftHistory
                .filter((entry) => entry.liftId === liftId)
                .slice(0, 3);

              if (history.length === 0) {
                return null;
              }

              const [latest, previous] = history;

              if (latest === undefined) {
                return null;
              }

              const change =
                previous === undefined
                  ? null
                  : latest.weightKg - previous.weightKg;

              return (
                <li key={liftId}>
                  <span>{strengthLiftLabels[liftId]}</span>
                  <strong>{latest.weightKg.toFixed(1)} kg</strong>
                  <small>
                    {change === null
                      ? "First observation"
                      : `${change >= 0 ? "+" : ""}${change.toFixed(1)} kg from prior`}
                  </small>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <form className="strength-records__weight" onSubmit={handleWeightSubmit}>
        <strong>Body weight</strong>
        <label>
          <span>Weight kg</span>
          <input
            inputMode="decimal"
            max="500"
            min="20"
            name="weightKg"
            required
            step="0.1"
            type="number"
          />
        </label>
        <label>
          <span>Date</span>
          <input
            defaultValue={today}
            max={today}
            name="measuredOn"
            required
            type="date"
          />
        </label>
        <button disabled={isSavingWeight} type="submit">
          {isSavingWeight ? "Saving" : "Log weight"}
        </button>
      </form>

      {bodyWeightEntries.length > 0 ? (
        <ul
          className="strength-records__history"
          aria-label="Recent body weight"
        >
          {bodyWeightEntries.slice(0, 4).map((entry) => (
            <li key={entry.id}>
              <span>{formatEntryDate(entry.measuredOn)}</span>
              <strong>{entry.weightKg.toFixed(1)} kg</strong>
              <button
                aria-label={`Remove ${entry.weightKg.toFixed(1)} kilogram entry from ${formatEntryDate(entry.measuredOn)}`}
                onClick={() => void handleRemoveWeight(entry.id)}
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p aria-live="polite" className="strength-tracker__feedback">
        {feedback}
      </p>
    </section>
  );
}
