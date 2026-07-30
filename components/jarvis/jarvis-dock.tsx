"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import type {
  JarvisMode,
  JarvisNavigationContext,
  JarvisThread,
  JarvisThreadSummary,
} from "@/lib/jarvis";
import {
  activateInterfaceSurface,
  subscribeToInterfaceSurfaces,
} from "@/lib/interface-surface";

import { useModifierKeyLabel } from "@/lib/modifier-key-label";

import { JarvisConversation } from "./jarvis-conversation";
import styles from "./jarvis.module.css";
import { cancelJarvisSpeech } from "./jarvis-speech";

type JarvisDockProps = Readonly<{
  context: JarvisNavigationContext;
}>;

function formatThreadDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function JarvisDock({ context }: JarvisDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [threads, setThreads] = useState<JarvisThreadSummary[]>([]);
  const [activeThread, setActiveThread] = useState<JarvisThread | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modifierKey = useModifierKeyLabel();

  const loadThreads = useCallback(async () => {
    const response = await fetch("/api/jarvis/threads", { cache: "no-store" });
    if (!response.ok) throw new Error("Jarvis history could not be loaded.");
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null) {
      throw new Error("Jarvis returned an invalid response.");
    }

    const candidate = payload as Readonly<{
      configured?: unknown;
      threads?: unknown;
    }>;
    const configured = candidate.configured === true;
    setIsConfigured(configured);
    const nextThreads = Array.isArray(candidate.threads)
      ? (candidate.threads as JarvisThreadSummary[])
      : [];
    setThreads(nextThreads);
    return { configured, threads: nextThreads };
  }, []);

  const createThread = useCallback(
    async (mode: JarvisMode = "quick") => {
      const response = await fetch("/api/jarvis/threads", {
        body: JSON.stringify({ mode }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok)
        throw new Error("Jarvis could not start a conversation.");
      const payload: unknown = await response.json();
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("thread" in payload)
      ) {
        throw new Error("Jarvis returned an invalid conversation.");
      }

      const thread = (payload as Readonly<{ thread: JarvisThread }>).thread;
      setActiveThread(thread);
      setShowHistory(false);
      await loadThreads();
      return thread;
    },
    [loadThreads],
  );

  const selectThread = useCallback(async (threadId: string) => {
    const response = await fetch(`/api/jarvis/threads/${threadId}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Conversation could not be opened.");
    const payload: unknown = await response.json();
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("thread" in payload)
    ) {
      throw new Error("Jarvis returned an invalid conversation.");
    }

    setActiveThread((payload as Readonly<{ thread: JarvisThread }>).thread);
    setShowHistory(false);
  }, []);

  const prepareJarvis = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await loadThreads();
      if (!result.configured) return;
      const currentId = activeThread?.id;
      const preferred = currentId
        ? result.threads.find((thread) => thread.id === currentId)
        : result.threads[0];
      if (preferred) await selectThread(preferred.id);
      else await createThread();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Jarvis is unavailable.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeThread, createThread, loadThreads, selectThread]);

  const openJarvis = useCallback(() => {
    activateInterfaceSurface("jarvis");
    setIsOpen(true);
    void prepareJarvis();
  }, [prepareJarvis]);

  const closeJarvis = useCallback(() => {
    setIsOpen(false);
    setShowHistory(false);
    cancelJarvisSpeech();
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }, []);

  useEffect(
    () =>
      subscribeToInterfaceSurfaces((surfaceId) => {
        if (surfaceId === "jarvis") return;
        setIsOpen(false);
        setShowHistory(false);
        cancelJarvisSpeech();
      }),
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
  }, [isOpen]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        if (isOpen) closeJarvis();
        else openJarvis();
      } else if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeJarvis();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [closeJarvis, isOpen, openJarvis]);

  const archiveActiveThread = async () => {
    if (!activeThread) return;
    await fetch(`/api/jarvis/threads/${activeThread.id}`, { method: "DELETE" });
    setActiveThread(null);
    const result = await loadThreads();
    const next = result.threads.find((thread) => thread.id !== activeThread.id);
    if (next) await selectThread(next.id);
    else await createThread();
  };

  const panel =
    isOpen && hasMounted
      ? createPortal(
          <aside
            aria-label="Jarvis assistant"
            aria-modal="true"
            className={styles.panel}
            ref={panelRef}
            role="dialog"
          >
            <header className={styles.header}>
              <div className={styles.identity}>
                <span aria-hidden="true" className={styles.identityMark}>
                  J
                </span>
                <div>
                  <strong>Jarvis</strong>
                  <span>At your service</span>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  aria-expanded={showHistory}
                  aria-label="Conversation history"
                  className={styles.iconButton}
                  onClick={() => setShowHistory((current) => !current)}
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" />
                  </svg>
                </button>
                <button
                  aria-label="New conversation"
                  className={styles.iconButton}
                  onClick={() =>
                    void createThread(activeThread?.mode ?? "quick")
                  }
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button
                  aria-label="Close Jarvis"
                  className={styles.iconButton}
                  onClick={closeJarvis}
                  ref={closeButtonRef}
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </header>

            {showHistory ? (
              <div className={styles.historyPanel}>
                <div className={styles.historyHeading}>
                  <strong>Conversations</strong>
                  {activeThread ? (
                    <button
                      onClick={() => void archiveActiveThread()}
                      type="button"
                    >
                      Archive current
                    </button>
                  ) : null}
                </div>
                <div className={styles.threadList}>
                  {threads.map((thread) => (
                    <button
                      aria-current={activeThread?.id === thread.id}
                      key={thread.id}
                      onClick={() => void selectThread(thread.id)}
                      type="button"
                    >
                      <span>{thread.title}</span>
                      <small>
                        {formatThreadDate(thread.updatedAt)} ·{" "}
                        {thread.messageCount}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={styles.panelBody}>
              {isLoading ? (
                <div className={styles.loadingState}>
                  <span aria-hidden="true" />
                  Connecting Jarvis
                </div>
              ) : !isConfigured ? (
                <div className={styles.unavailableState}>
                  <strong>Jarvis is awaiting connection</strong>
                  <p>
                    Mission Control could not reach its synchronized records.
                  </p>
                </div>
              ) : errorMessage ? (
                <div className={styles.unavailableState}>
                  <strong>Jarvis is temporarily unavailable</strong>
                  <p>{errorMessage}</p>
                  <button onClick={() => void prepareJarvis()} type="button">
                    Try again
                  </button>
                </div>
              ) : activeThread ? (
                <JarvisConversation
                  context={context}
                  key={activeThread.id}
                  onThreadUpdated={() => void loadThreads()}
                  thread={activeThread}
                />
              ) : null}
            </div>
          </aside>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Open Jarvis. Ask anything or start a voice session."
        className={`${styles.launcher} jarvis-dock-launcher`}
        onClick={openJarvis}
        ref={launcherRef}
        title="Ask Jarvis anything"
        type="button"
      >
        <span aria-hidden="true" className={styles.launcherCore}>
          J
        </span>
        <span>Jarvis</span>
        <kbd>
          {modifierKey}
          {modifierKey === "⌘" ? " " : "+"}J
        </kbd>
      </button>

      {panel}
    </>
  );
}
