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
      background: "var(--bg-page)", // changed to blend with page
      overflow: "hidden",
      minWidth: 0,
      position: "relative",
    }}>
      {/* Chat header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onMenuOpen && (
            <button className="mobile-menu-btn" onClick={onMenuOpen} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Open menu">
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
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>Samaira</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.2 }}>Planning for {profile?.name} {profile?.relation && `(${profile.relation})`}</p>
          </div>
        </div>
      </header>

      {/* Message list */}
      <div
        role="log"
        aria-label="Conversation with Samaira"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px 120px", // extra padding at bottom for floating composer
          display: "flex",
          flexDirection: "column",
          gap: 32, // More breathing room between messages
          alignItems: "center", // center children
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id} style={{ width: "100%", maxWidth: 800 }}>
            <MessageBubble message={msg} />
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div style={{ width: "100%", maxWidth: 800 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--brand-leaf)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0,
              }} aria-hidden="true">S</span>
              <div style={{ paddingTop: 8 }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "20px" }}>...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating Composer container */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px 24px",
        background: "linear-gradient(to top, var(--bg-page) 60%, transparent)",
        pointerEvents: "none", // let clicks pass through the gradient
      }}>
        <div style={{ width: "100%", maxWidth: 800, pointerEvents: "auto" }}>
          <Composer
            onSend={onSend}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </main>
  );
}
