"use client";
import { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import Composer from "./Composer";

export default function ChatPanel({ 
  messages, 
  isStreaming, 
  onSend, 
  onMenuOpen,
  profile
}: { 
  messages: any[], 
  isStreaming: boolean, 
  onSend: (text: string) => void, 
  onMenuOpen?: () => void,
  profile: any
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

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
          <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>Samaira for {profile?.name}</p>
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
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
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
              <span style={{ padding: "0 8px", color: "var(--brand-deep)", fontSize: "12px" }}>...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <Composer
        onSend={onSend}
        isStreaming={isStreaming}
      />
    </main>
  );
}
