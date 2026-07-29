"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type SourceUrlUIPart, type UIMessage } from "ai";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  jarvisModes,
  type JarvisMode,
  type JarvisNavigationContext,
  type JarvisThread,
} from "@/lib/jarvis";

import styles from "./jarvis.module.css";
import { JarvisVoiceSession } from "./jarvis-voice-session";

const modeLabels: Record<JarvisMode, string> = {
  quick: "Quick",
  analyze: "Analyze",
  "deep-review": "Deep review",
};

type JarvisConversationProps = Readonly<{
  context: JarvisNavigationContext;
  onThreadUpdated: () => void;
  thread: JarvisThread;
}>;

function getSources(message: UIMessage) {
  const sources = message.parts.filter(
    (part): part is SourceUrlUIPart => part.type === "source-url",
  );
  return sources.filter(
    (source, index) =>
      sources.findIndex((candidate) => candidate.url === source.url) === index,
  );
}

function hasToolActivity(message: UIMessage) {
  return message.parts.some((part) => part.type.startsWith("tool-"));
}

function sourceLabel(source: SourceUrlUIPart) {
  if (source.title) return source.title;

  try {
    return new URL(source.url).hostname;
  } catch {
    return "Source";
  }
}

export function JarvisConversation({
  context,
  onThreadUpdated,
  thread,
}: JarvisConversationProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(thread.mode);
  const messageListRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/jarvis/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            context,
            id,
            message: messages.at(-1),
            mode,
          },
        }),
      }),
    [context, mode],
  );
  const { error, messages, sendMessage, setMessages, status, stop } =
    useChat<UIMessage>({
      id: thread.id,
      messages: thread.messages,
      onFinish: onThreadUpdated,
      throttle: 40,
      transport,
    });
  const isBusy = status === "streaming" || status === "submitted";

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    messageList.scrollTo({
      behavior: "smooth",
      top: messageList.scrollHeight,
    });
  }, [messages, status]);

  const changeMode = async (nextMode: JarvisMode) => {
    setMode(nextMode);
    await fetch(`/api/jarvis/threads/${thread.id}`, {
      body: JSON.stringify({ mode: nextMode }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    onThreadUpdated();
  };

  const submitMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    void sendMessage({ text });
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className={styles.conversation}>
      <div className={styles.modeBar} aria-label="Jarvis response depth">
        {jarvisModes.map((modeId) => (
          <button
            aria-pressed={mode === modeId}
            className={styles.modeButton}
            disabled={isBusy}
            key={modeId}
            onClick={() => void changeMode(modeId)}
            type="button"
          >
            {modeLabels[modeId]}
          </button>
        ))}
      </div>

      <div
        aria-live="polite"
        aria-relevant="additions text"
        className={styles.messages}
        ref={messageListRef}
      >
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <span aria-hidden="true" className={styles.emptyMark}>
              J
            </span>
            <h2>How can I help?</h2>
            <p>
              Ask a quick question, think through a decision, or review your
              synchronized Mission Control records.
            </p>
          </div>
        ) : null}

        {messages.map((message) => {
          const sources = getSources(message);
          return (
            <article
              className={styles.message}
              data-role={message.role}
              key={message.id}
            >
              <span className={styles.messageAuthor}>
                {message.role === "user" ? "You" : "Jarvis"}
              </span>
              <div className={styles.messageBody}>
                {message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <p key={`${message.id}-text-${index}`}>{part.text}</p>
                  ) : null,
                )}
                {hasToolActivity(message) &&
                !message.parts.some((part) => part.type === "text") ? (
                  <p className={styles.toolStatus}>
                    Reviewing trusted context…
                  </p>
                ) : null}
              </div>
              {sources.length > 0 ? (
                <div className={styles.sources}>
                  <span>Sources</span>
                  {sources.map((source) => (
                    <a
                      href={source.url}
                      key={source.sourceId}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {sourceLabel(source)}
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}

        {status === "submitted" ? (
          <div className={styles.thinking}>
            <span />
            <span />
            <span />
            <span className="sr-only">Jarvis is thinking</span>
          </div>
        ) : null}
      </div>

      {error ? <p className={styles.errorText}>{error.message}</p> : null}

      <form className={styles.composer} onSubmit={submitMessage}>
        <textarea
          aria-label="Message Jarvis"
          disabled={isBusy}
          maxLength={8_000}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Ask Jarvis"
          rows={1}
          value={input}
        />
        <div className={styles.composerActions}>
          <JarvisVoiceSession
            onMessagesSaved={(nextMessages) => {
              setMessages(nextMessages);
              onThreadUpdated();
            }}
            threadId={thread.id}
          />
          {isBusy ? (
            <button
              aria-label="Stop response"
              className={styles.sendButton}
              onClick={() => void stop()}
              type="button"
            >
              <span className={styles.stopMark} />
            </button>
          ) : (
            <button
              aria-label="Send message"
              className={styles.sendButton}
              disabled={input.trim().length === 0}
              type="submit"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m5 12 7-7 7 7M12 5v14" />
              </svg>
            </button>
          )}
        </div>
      </form>
      <p className={styles.disclaimer}>
        Jarvis can make mistakes. Verify consequential decisions.
      </p>
    </div>
  );
}
