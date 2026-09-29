"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
  type InterfaceSurfaceId,
} from "@/lib/interface-surface";
import { registerOpenWorkspace } from "@/lib/workspace-presence";

import styles from "./mission-workspace.module.css";

export type WorkspaceMetricTone = "alert" | "neutral" | "positive";

export type WorkspaceMetric = Readonly<{
  hint?: string;
  id: string;
  kind?: "number" | "text";
  label: string;
  tone?: WorkspaceMetricTone;
  value: ReactNode;
}>;

type MissionWorkspaceProps = Readonly<{
  /** Space-separated RGB channels, e.g. `"112 196 230"`. */
  accent: string;
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  eyebrow: string;
  isBusy?: boolean;
  isOpen: boolean;
  launcherDetail?: ReactNode;
  launcherLabel?: string;
  metrics?: readonly WorkspaceMetric[];
  onOpenChange: (isOpen: boolean) => void;
  placement?: "center" | "end" | "start";
  status: ReactNode;
  surfaceId: InterfaceSurfaceId;
  title: ReactNode;
}>;

const workspaceEase = [0.22, 1, 0.36, 1] as const;
const fullClip = "inset(0px 0px 0px 0px round 0px)";
const bloomClip = "inset(38% 30% 38% 30% round 28px)";

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement)
  );
}

function clipFromElement(element: HTMLElement | null) {
  if (element === null) return bloomClip;

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return bloomClip;

  const top = Math.max(0, rect.top);
  const left = Math.max(0, rect.left);
  const right = Math.max(0, window.innerWidth - rect.right);
  const bottom = Math.max(0, window.innerHeight - rect.bottom);

  return `inset(${top}px ${right}px ${bottom}px ${left}px round 18px)`;
}

export function MissionWorkspace({
  accent,
  actions,
  children,
  description,
  eyebrow,
  isBusy = false,
  isOpen,
  launcherDetail,
  launcherLabel = "Open",
  metrics,
  onOpenChange,
  placement = "end",
  status,
  surfaceId,
  title,
}: MissionWorkspaceProps) {
  const titleId = useId();
  const panelId = useId();
  const shouldReduceMotion = useReducedMotion() === true;
  const launcherRef = useRef<HTMLDivElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [originClip, setOriginClip] = useState(bloomClip);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const open = useCallback(() => {
    setOriginClip(clipFromElement(launcherRef.current));
    onOpenChangeRef.current(true);
  }, []);

  const close = useCallback(() => {
    setOriginClip(clipFromElement(launcherRef.current));
    onOpenChangeRef.current(false);
    window.requestAnimationFrame(() => launchButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    activateInterfaceSurface(surfaceId);
    const release = registerOpenWorkspace();
    const frame = window.requestAnimationFrame(() =>
      panelRef.current?.focus({ preventScroll: true }),
    );

    return () => {
      window.cancelAnimationFrame(frame);
      release();
    };
  }, [isOpen, surfaceId]);

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((activeSurfaceId) => {
        if (activeSurfaceId !== surfaceId) onOpenChangeRef.current(false);
      }),
    [surfaceId],
  );

  useEffect(() => {
    if (isOpen) return;

    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "d" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.repeat ||
        isEditableTarget(event.target) ||
        document.querySelector("dialog[open]") !== null
      ) {
        return;
      }

      event.preventDefault();
      open();
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [isOpen, open]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        document.querySelector("dialog[open]") !== null
      ) {
        return;
      }

      event.preventDefault();
      if (isEditableTarget(event.target)) {
        (event.target as HTMLElement).blur();
        panelRef.current?.focus({ preventScroll: true });
        return;
      }

      close();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [close, isOpen]);

  const accentStyle = { "--ws-accent": accent } as CSSProperties;
  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.64, ease: workspaceEase };

  return (
    <>
      <motion.div
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? 8 : 0 }}
        className={styles.launcher}
        data-placement={placement}
        data-open={isOpen}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        ref={launcherRef}
        style={accentStyle}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.46, ease: workspaceEase }
        }
      >
        <span aria-hidden="true" className={styles.launcherOrb}>
          <i />
        </span>
        <div className={styles.launcherText}>
          <span>{eyebrow}</span>
          <strong>{status}</strong>
          {launcherDetail === undefined ? null : (
            <div className={styles.launcherDetail}>{launcherDetail}</div>
          )}
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          className={styles.launchButton}
          onClick={open}
          ref={launchButtonRef}
          tabIndex={isOpen ? -1 : 0}
          type="button"
        >
          <span>{launcherLabel}</span>
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" />
          </svg>
          <kbd aria-hidden="true">D</kbd>
        </button>
      </motion.div>

      <AnimatePresence custom={originClip}>
        {isOpen ? (
          <motion.section
            animate="open"
            aria-busy={isBusy}
            aria-labelledby={titleId}
            aria-modal="false"
            className={styles.workspace}
            custom={originClip}
            exit="closed"
            id={panelId}
            initial="closed"
            key="workspace"
            ref={panelRef}
            role="dialog"
            style={accentStyle}
            tabIndex={-1}
            transition={panelTransition}
            variants={{
              closed: (clip: string) => ({
                clipPath: clip,
                opacity: 0.4,
                transition: shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.44, ease: workspaceEase },
              }),
              open: { clipPath: fullClip, opacity: 1 },
            }}
          >
            <div aria-hidden="true" className={styles.atmosphere} />

            <header className={styles.bar}>
              <button
                aria-label="Minimize dashboard"
                className={styles.minimize}
                onClick={close}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path d="M10 3 5 8l5 5" />
                </svg>
                <span>Back</span>
                <kbd aria-hidden="true">Esc</kbd>
              </button>

              <div className={styles.identity}>
                <span aria-hidden="true" className={styles.identityOrb}>
                  <i />
                </span>
                <div>
                  <span className={styles.eyebrow}>{eyebrow}</span>
                  <h2 id={titleId}>{title}</h2>
                  {description === undefined ? null : (
                    <p className={styles.description}>{description}</p>
                  )}
                </div>
              </div>

              {actions === undefined ? null : (
                <div className={styles.actions}>{actions}</div>
              )}
            </header>

            {metrics === undefined || metrics.length === 0 ? null : (
              <motion.dl
                animate={{ opacity: 1, y: 0 }}
                className={styles.metrics}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { delay: 0.16, duration: 0.5, ease: workspaceEase }
                }
              >
                {metrics.map((metric) => (
                  <div
                    className={styles.metric}
                    data-kind={metric.kind ?? "number"}
                    data-tone={metric.tone ?? "neutral"}
                    key={metric.id}
                  >
                    <dt>{metric.label}</dt>
                    <dd>
                      <strong>{metric.value}</strong>
                      {metric.hint === undefined ? null : (
                        <small>{metric.hint}</small>
                      )}
                    </dd>
                  </div>
                ))}
              </motion.dl>
            )}

            <div className={styles.body}>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={styles.bodyInner}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { delay: 0.22, duration: 0.56, ease: workspaceEase }
                }
              >
                {children}
              </motion.div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function useArrivalWorkspace(isVisible: boolean) {
  const [isOpen, setIsOpen] = useState(isVisible);
  const [wasVisible, setWasVisible] = useState(isVisible);

  if (isVisible !== wasVisible) {
    setWasVisible(isVisible);
    if (isVisible) setIsOpen(true);
  }

  return [isOpen, setIsOpen] as const;
}

type WorkspaceGridProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function WorkspaceGrid({ children, className }: WorkspaceGridProps) {
  return (
    <div
      className={
        className === undefined ? styles.grid : `${styles.grid} ${className}`
      }
    >
      {children}
    </div>
  );
}

type WorkspaceSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

type WorkspaceColumnProps = Readonly<{
  children: ReactNode;
  span: WorkspaceSpan;
}>;

export function WorkspaceColumn({ children, span }: WorkspaceColumnProps) {
  return (
    <div className={styles.column} data-span={span}>
      {children}
    </div>
  );
}

type WorkspacePanelProps = Readonly<{
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  count?: ReactNode;
  eyebrow?: string;
  span?: WorkspaceSpan;
  title?: ReactNode;
}>;

export function WorkspacePanel({
  actions,
  children,
  className,
  count,
  eyebrow,
  span = 12,
  title,
}: WorkspacePanelProps) {
  const hasHeader =
    title !== undefined || eyebrow !== undefined || actions !== undefined;

  return (
    <section
      className={
        className === undefined ? styles.panel : `${styles.panel} ${className}`
      }
      data-span={span}
    >
      {hasHeader ? (
        <header className={styles.panelHeader}>
          <div>
            {eyebrow === undefined ? null : <span>{eyebrow}</span>}
            {title === undefined ? null : <h3>{title}</h3>}
          </div>
          {count === undefined && actions === undefined ? null : (
            <div className={styles.panelHeaderAside}>
              {count === undefined ? null : (
                <span className={styles.panelCount}>{count}</span>
              )}
              {actions}
            </div>
          )}
        </header>
      ) : null}
      {children}
    </section>
  );
}
