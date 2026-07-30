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
  jarvisModeDescriptions,
  jarvisModeLabels,
  jarvisModes,
  type JarvisMode,
  type JarvisNavigationContext,
  type JarvisThread,
} from "@/lib/jarvis";

import styles from "./jarvis.module.css";
import { JarvisMarkdown } from "./jarvis-markdown";
import { cancelJarvisSpeech, speakAsJarvis } from "./jarvis-speech";
import { JarvisVoiceMode } from "./jarvis-voice-mode";

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

function getMessageText(message: UIMessage) {
  return message.parts
    .filter(
      (
        part,
      ): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
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
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldSpeakResponseRef = useRef(false);
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
  const { error, messages, sendMessage, status, stop } = useChat<UIMessage>({
    id: thread.id,
    messages: thread.messages,
    onFinish: onThreadUpdated,
    throttle: 40,
    transport,
  });
  const isBusy = status === "streaming" || status === "submitted";
  const voiceBusy = isBusy || isSpeaking;

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
    if (voiceSessionActive) {
      shouldSpeakResponseRef.current = true;
    }
    void sendMessage({ text });
  };

  const submitVoiceMessage = (transcript: string) => {
    if (!transcript.trim() || voiceBusy) return;
    shouldSpeakResponseRef.current = true;
    void sendMessage({ text: transcript.trim() });
  };

  useEffect(() => {
    if (status === "error") {
      shouldSpeakResponseRef.current = false;
      return;
    }
    if (status !== "ready" || !shouldSpeakResponseRef.current) return;
    const response = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    const responseText = response ? getMessageText(response) : "";

    shouldSpeakResponseRef.current = false;
    if (!responseText) return;

    speakAsJarvis(responseText, {
      onEnd: () => setIsSpeaking(false),
      onStart: () => setIsSpeaking(true),
    });
  }, [messages, status]);

  useEffect(
    () => () => {
      cancelJarvisSpeech();
    },
    [],
  );

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const closeVoiceMode = () => {
    setVoiceSessionActive(false);
    cancelJarvisSpeech();
    setIsSpeaking(false);
  };

  return (
    <div className={styles.conversation}>
      <div className={styles.modeBar} aria-label="Response depth">
        {jarvisModes.map((modeId) => (
          <button
            aria-pressed={mode === modeId}
            className={styles.modeButton}
            disabled={isBusy}
            key={modeId}
            onClick={() => void changeMode(modeId)}
            title={jarvisModeDescriptions[modeId]}
            type="button"
          >
            {jarvisModeLabels[modeId]}
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
            <h2>What are we working on?</h2>
            <p>
              Decisions, planning, study, training, or a clear read on your
              Mission Control records. Speak or type — I’ll stay precise.
            </p>
          </div>
        ) : null}

        {messages.map((message) => {
          const sources = getSources(message);
          const text = getMessageText(message);
          const waitingOnTools =
            hasToolActivity(message) && text.length === 0 && isBusy;
          const emptyFinished =
            message.role === "assistant" &&
            text.length === 0 &&
            !waitingOnTools &&
            status !== "streaming" &&
            status !== "submitted";

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
                {text.length > 0 ? <JarvisMarkdown text={text} /> : null}
                {waitingOnTools ? (
                  <p className={styles.toolStatus}>Reviewing records…</p>
                ) : null}
                {emptyFinished ? (
                  <p className={styles.messageEmpty}>
                    No reply came through. Ask again.
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
            <span className="sr-only">Working</span>
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
          placeholder="What do you need?"
          rows={1}
          value={input}
        />
        <div className={styles.composerActions}>
          <button
            aria-label="Start voice channel"
            className={styles.iconButton}
            disabled={isBusy && !voiceSessionActive}
            onClick={() => setVoiceSessionActive(true)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
              <path d="M5.5 11.5v.5a6.5 6.5 0 0 0 13 0v-.5M12 18.5V22M9 22h6" />
            </svg>
          </button>
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
        Verify consequential decisions against the source records.
      </p>

      <JarvisVoiceMode
        disabled={voiceBusy}
        isSpeaking={isSpeaking}
        onClose={closeVoiceMode}
        onTranscript={submitVoiceMessage}
        open={voiceSessionActive}
      />
    </div>
  );
}
