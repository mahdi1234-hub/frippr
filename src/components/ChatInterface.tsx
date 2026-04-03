"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Show me a bar chart of quarterly revenue for 2024",
  "Create a pie chart of market share by company",
  "Visualize monthly website traffic as an area chart",
  "Compare sales vs expenses in a mixed chart",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="border-b border-black/10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#1c1917] flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-lg font-light tracking-tight text-[#1c1917]">
                Frippr
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium hidden sm:inline">
            AI Chart Intelligence
          </span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={sendMessage} />
        ) : (
          <div>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <LoadingIndicator />
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-black/10 px-6 py-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="border border-black/10 rounded-[2px] bg-white focus-within:border-black/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the chart you'd like to create..."
              rows={1}
              disabled={isLoading}
              className="w-full px-5 py-3.5 pr-14 bg-transparent text-sm font-light text-[#1c1917] placeholder:text-black/30 focus:outline-none resize-none disabled:opacity-50"
              style={{ minHeight: "48px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "48px";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#1c1917] rounded-[2px] text-white disabled:opacity-20 transition-opacity hover:opacity-80"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] uppercase tracking-widest text-black/25 font-medium">
            Powered by Cerebras + Frappe Charts
          </span>
          <span className="text-[9px] uppercase tracking-widest text-black/25 font-medium hidden sm:inline">
            Shift + Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
      {/* Hero */}
      <div className="mb-10">
        <div className="w-12 h-12 rounded-full bg-[#1c1917] flex items-center justify-center mx-auto mb-6">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-light text-[#1c1917] mb-3">
          Data, visualized with clarity
        </h2>
        <p className="text-black/50 font-light text-sm leading-relaxed max-w-md mx-auto">
          Describe the data story you want to tell. Frippr will craft the
          perfect chart for your narrative — bar, line, area, pie, heatmap, and
          more.
        </p>
      </div>

      {/* Micro Principles */}
      <div className="border-t border-black/10 py-5 mb-8 flex flex-col sm:flex-row gap-3 sm:gap-10 items-center">
        <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium">
          Intelligent charting
        </span>
        <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium">
          Context-aware rendering
        </span>
        <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium">
          Enterprise ready
        </span>
      </div>

      {/* Suggestions */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="group text-left px-5 py-4 border border-black/10 rounded-[2px] hover:border-black/25 transition-all duration-300 bg-white"
          >
            <p className="text-sm font-light text-black/60 group-hover:text-black/80 transition-colors leading-relaxed">
              {suggestion}
            </p>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="mt-8">
        <a
          href="#"
          className="inline-block text-[10px] uppercase tracking-widest border-b border-black/15 pb-1 text-black/30 hover:text-black/60 hover:border-black/40 transition-colors font-medium"
        >
          Supports all Frappe Charts types
        </a>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="animate-fade-in-up mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-5 h-5 rounded-full bg-[#1c1917] flex items-center justify-center">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-black/40 font-medium">
          Frippr
        </span>
      </div>
      <div className="pl-8">
        <div className="flex gap-1.5 items-center py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black/20 animate-pulse" />
          <div
            className="w-1.5 h-1.5 rounded-full bg-black/20 animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-black/20 animate-pulse"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
