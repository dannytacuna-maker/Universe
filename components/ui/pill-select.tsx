"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import styles from "./pill-select.module.css";

export type PillSelectOption = Readonly<{
  label: string;
  value: string;
}>;

type PillSelectProps = Readonly<{
  className?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  onChange?: (value: string) => void;
  options: readonly PillSelectOption[];
  value: string;
}>;

export function PillSelect({
  className,
  disabled = false,
  label,
  name,
  onChange,
  options,
  value,
}: PillSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected =
    options.find((option) => option.value === value) ?? options[0] ?? null;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const choose = (next: string) => {
    onChange?.(next);
    setOpen(false);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-open={open ? "true" : undefined}
      ref={rootRef}
    >
      {label ? <span className={styles.label}>{label}</span> : null}
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.trigger}
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        type="button"
      >
        <span className={styles.value}>{selected?.label ?? "Select"}</span>
        <span aria-hidden="true" className={styles.chevron}>
          <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
            <path
              d="M3.5 5.25 7 8.75l3.5-3.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <ul
          className={styles.menu}
          id={listId}
          role="listbox"
          aria-label={label ?? "Options"}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  aria-selected={isSelected}
                  className={styles.option}
                  data-selected={isSelected ? "true" : undefined}
                  onClick={() => choose(option.value)}
                  role="option"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={styles.dot}
                    data-selected={isSelected ? "true" : undefined}
                  />
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
