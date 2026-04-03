"use client";

import { parseChartBlocks, type ParsedSegment } from "@/lib/parseChartBlocks";
import { FrappeChart } from "./FrappeChart";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="animate-fade-in-up flex justify-end mb-6">
        <div className="max-w-[75%]">
          <div className="bg-[#1c1917] text-white px-5 py-3 rounded-[2px]">
            <p className="text-sm font-light leading-relaxed">{content}</p>
          </div>
          <div className="flex justify-end mt-1.5">
            <span className="text-[9px] uppercase tracking-widest text-black/30 font-medium">
              You
            </span>
          </div>
        </div>
      </div>
    );
  }

  const segments = parseChartBlocks(content);

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
      <div className="pl-8 max-w-full">
        {segments.map((segment: ParsedSegment, index: number) => (
          <div key={index} className="mb-4">
            {segment.type === "text" ? (
              <TextBlock content={segment.content} />
            ) : segment.chartConfig ? (
              <FrappeChart config={segment.chartConfig} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TextBlock({ content }: { content: string }) {
  // Simple markdown-like rendering
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Heading
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="font-serif text-base font-light text-black/90 mt-4 mb-1"
            >
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="font-serif text-lg font-light text-black/90 mt-4 mb-1"
            >
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="font-serif text-xl font-light text-black/90 mt-4 mb-1"
            >
              {trimmed.slice(2)}
            </h1>
          );
        }

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-black/20 mt-1.5 text-[6px]">●</span>
              <p className="text-black/70 font-light leading-relaxed text-sm flex-1">
                {renderInlineFormatting(trimmed.slice(2))}
              </p>
            </div>
          );
        }

        // Numbered list
        const numberedMatch = trimmed.match(/^(\d+)\.\s/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-[10px] text-black/30 font-medium mt-0.5 min-w-[16px]">
                {numberedMatch[1]}.
              </span>
              <p className="text-black/70 font-light leading-relaxed text-sm flex-1">
                {renderInlineFormatting(trimmed.slice(numberedMatch[0].length))}
              </p>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-black/70 font-light leading-relaxed text-sm">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-black/80">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((codePart, j) => {
      if (codePart.startsWith("`") && codePart.endsWith("`")) {
        return (
          <code
            key={`${i}-${j}`}
            className="bg-black/5 px-1.5 py-0.5 rounded-[1px] text-[12px] font-mono text-black/60"
          >
            {codePart.slice(1, -1)}
          </code>
        );
      }
      return <span key={`${i}-${j}`}>{codePart}</span>;
    });
  });
}
