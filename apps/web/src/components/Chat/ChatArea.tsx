'use client';

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import { moodColors, Mood } from "@/lib/mood";
import { useAppStore } from "@/store/useAppStore";

type SpeechRecognitionCtor = new () => SpeechRecognition;
type SpeechRecognitionResultEvent = Event & {
  results: {
    0: {
      0: {
        transcript: string;
      };
    };
  };
};

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const assistantFallback =
  "Nenu ikkade unna. Konchem slow ga cheppu, manam kalisi sort cheddam.";

const moodFromReply = (mood: unknown): Mood =>
  typeof mood === "string" && mood in moodColors ? (mood as Mood) : "neutral";

export function ChatArea() {
  const {
    messages,
    addMessage,
    setMood,
    setHasStartedConversation,
    ui,
    setUiFlag,
    hydrateUiDefaults,
    mood,
  } = useAppStore();
  const [input, setInput] = useState("");
  const sendingRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceHandledRef = useRef(false);

  const hasMessages = messages.length > 0;
  const auraTone = moodColors[mood];

  useEffect(() => {
    hydrateUiDefaults();
  }, [hydrateUiDefaults]);

  const handleSend = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text) return;
    if (sendingRef.current) return;

    sendingRef.current = true;
    setHasStartedConversation(true);

    addMessage({
      role: "user",
      text,
      timestamp: Date.now(),
    });

    setInput("");
    setUiFlag("isThinking", true);

    try {
      const historyPayload = [
        ...messages.slice(-10).map((msg) => ({ role: msg.role, text: msg.text })),
        { role: "user" as const, text },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyPayload }),
      });

      const data = (await res.json()) as { reply?: string; mood?: Mood };
      const assistantText = data.reply?.trim() || assistantFallback;
      const inferredMood = moodFromReply(data.mood);

      addMessage({
        role: "assistant",
        text: assistantText,
        mood: inferredMood,
        timestamp: Date.now(),
      });

      setMood(inferredMood);
    } catch {
      addMessage({
        role: "assistant",
        text: assistantFallback,
        mood: "neutral",
        timestamp: Date.now(),
      });
      setMood("neutral");
    } finally {
      setUiFlag("isThinking", false);
      sendingRef.current = false;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceInput = () => {
    if (ui.isListening) return;

    const SpeechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechApi) {
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new SpeechApi();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    voiceHandledRef.current = false;
    setUiFlag("isListening", true);

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      if (voiceHandledRef.current) return;
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      voiceHandledRef.current = true;
      handleSend(transcript);
    };

    recognition.onerror = () => {
      setUiFlag("isListening", false);
    };

    recognition.onend = () => {
      setUiFlag("isListening", false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const renderTyping = () => (
    <div className="aura-message aura-message-assistant aura-typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
      <p>Aura is thinking...</p>
    </div>
  );

  const renderWelcome = () => (
    <div className="aura-welcome">
      <h1>Hello, I&apos;m Aura.</h1>
      <p>your personal companion...</p>
    </div>
  );

  const messageList = () => (
    <div className="aura-messages">
      {messages.map((msg) => (
        <article
          className={`aura-message ${msg.role === "user" ? "aura-message-user" : "aura-message-assistant"}`}
          key={msg.id}
          style={msg.role === "assistant" ? { borderColor: `${auraTone}44` } : undefined}
        >
          <span className="aura-message-role">{msg.role === "user" ? "You" : "Aura"}</span>
          <p>{msg.text}</p>
        </article>
      ))}
      {ui.isThinking ? renderTyping() : null}
    </div>
  );

  const onSendClick = () => {
    void handleSend();
  };

  return (
    <section className="aura-shell">
      <div className="aura-chat-stage">{hasMessages ? messageList() : renderWelcome()}</div>

      <div className="aura-input-wrap">
        <div className="aura-input-pill">
          <button
            aria-label="Start voice input"
            className={`aura-icon-btn ${ui.isListening ? "is-active" : ""}`}
            onClick={startVoiceInput}
            type="button"
          >
            <Mic size={18} />
          </button>

          <textarea
            className="aura-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts..."
            rows={1}
          />

          <button aria-label="Send message" className="aura-send-btn" onClick={onSendClick} type="button">
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}