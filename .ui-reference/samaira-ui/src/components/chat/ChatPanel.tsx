"use client";
import { useState, useRef, useEffect } from "react";
import { MessageBubble, TypingIndicator, type Message } from "./MessageBubble";
import Composer from "./Composer";
import ComparisonCard from "../cards/ComparisonCard";
import ConsentCard from "../cards/ConsentCard";

const QUICK_REPLIES = [
  "FD or mutual fund?",
  "How safe is my data?",
  "What is the Family Tree?",
  "Help me plan for retirement",
];

const GROWW_ROWS = [
  { dimension: "Family / household view", octaraa: "✓ Family Tree",      competitor: "Individual only", octaraaBetter: true },
  { dimension: "Goal-based family planning", octaraa: "✓ Yes",           competitor: "Limited",         octaraaBetter: true },
  { dimension: "Gamified learning",        octaraa: "✓ Yes",              competitor: "—",               octaraaBetter: true },
  { dimension: "Direct stocks / broking",  octaraa: "—",                  competitor: "✓ Strong",        octaraaBetter: false, comingSoon: true },
];

const SEED_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi there — I'm Samaira, Octaraa's AI assistant. I'm not a human advisor, so I'll always be clear about what's educational guidance vs. actual advice. How can I help your family today?",
  },
];

function useMockStream(onDone: (msg: Message) => void) {
  const [isStreaming, setIsStreaming] = useState(false);

  const streamReply = (userMsg: string) => {
    setIsStreaming(true);

    let reply: Message;
    const lower = userMsg.toLowerCase();

    if (lower.includes("groww") || lower.includes("better than") || lower.includes("compar")) {
      reply = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Groww is a strong platform for solo DIY investing. Octaraa is built for the whole family. Here's an honest side-by-side:",
        sources: ["Octaraa · competitor_matrix", "as of Jun 2026"],
        card: <ComparisonCard competitor="Groww" rows={GROWW_ROWS} asOf="Jun 2026" />,
      };
    } else if (lower.includes("family") && (lower.includes("plan") || lower.includes("goal") || lower.includes("college"))) {
      reply = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'd love to help build a family plan. I'll need to ask a few questions about your income and goals — everything is encrypted and this is educational guidance only.",
        card: <ConsentCard onAccept={() => console.log("consent given")} onDecline={() => console.log("declined")} />,
      };
    } else if (lower.includes("fd") || lower.includes("fixed deposit") || lower.includes("mutual fund")) {
      reply = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Great question. FDs and mutual funds suit different goals:\n\n• FDs: capital safety, guaranteed rate (3–7.5% typical), fully taxable at your slab, ideal for ≤3 years or emergency funds.\n\n• Mutual funds: market-linked, no return guarantee, but equity funds have historically outpaced inflation over 7+ years. Taxed more favourably on long-term capital gains.\n\nFor a young family, FDs for the emergency fund + mutual funds for 5–15 year goals is a common split. Not a specific product recommendation — confirm with a SEBI RIA for your situation.",
        sources: ["Finance education · FD vs MF", "Finance education · tax 2024-25"],
      };
    } else if (lower.includes("family tree") || lower.includes("octaraa feature") || lower.includes("feature")) {
      reply = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Octaraa's core features:\n\n• Family Tree — manage spouse, parents and kids under one account, household-wide view.\n• Goal-based planning — set milestones (education, home, retirement) and track progress.\n• Gamified learning — quizzes, certifications and a leaderboard to build financial knowledge.\n• Ask Samaira AI — that's me — for instant, grounded answers.\n• Financial calculators — including a college-cost planner.\n\nSome asset classes and features are still coming soon on the platform.",
        sources: ["Octaraa · KB · features", "octaraa.com · Jun 2026"],
      };
    } else {
      reply = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I can help with Octaraa's features, comparisons with other platforms, personal-finance education (FDs, mutual funds, SIPs, tax), or building a family financial plan. What would you like to explore?",
      };
    }

    setTimeout(() => {
      setIsStreaming(false);
      onDone(reply);
    }, 1200);
  };

  return { isStreaming, streamReply };
}

export default function ChatPanel({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);

  const { isStreaming, streamReply } = useMockStream(addMessage);

  const handleSend = (text: string) => {
    addMessage({ id: Date.now().toString(), role: "user", content: text });
    streamReply(text);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <main style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      minWidth: 0,
      boxShadow: "var(--shadow-card)",
    }}>
      {/* Chat header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {onMenuOpen && (
          <button onClick={onMenuOpen} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Open menu">
            <i className="ti ti-menu-2" style={{ fontSize: 18, color: "var(--text-secondary)" }} aria-hidden="true" />
          </button>
        )}
        <span style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--brand-leaf)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 600,
          color: "#fff",
          flexShrink: 0,
        }} aria-hidden="true">S</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>Samaira</p>
          <p style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.2 }}>Octaraa wealth assistant</p>
        </div>
        <span style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 500,
          background: "var(--bg-hover)",
          color: "var(--text-secondary)",
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--border)",
        }}>
          <i className="ti ti-sparkles" style={{ fontSize: 12 }} aria-hidden="true" />
          AI assistant
        </span>
      </header>

      {/* Message list */}
      <div
        role="log"
        aria-label="Conversation with Samaira"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <span style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "var(--brand-leaf)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: "#fff", flexShrink: 0,
            }} aria-hidden="true">S</span>
            <div style={{
              background: "var(--brand-mint)",
              border: "1px solid rgba(15,110,86,0.12)",
              borderRadius: "4px 16px 16px 16px",
              padding: "6px 4px",
            }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <Composer
        onSend={handleSend}
        isStreaming={isStreaming}
        quickReplies={messages.length <= 1 ? QUICK_REPLIES : undefined}
      />
    </main>
  );
}
