"use client";

/* ─── Typing indicator ─── */
export function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--brand-mint2)",
          display: "inline-block",
          animation: `blink 1.2s ease ${i * 0.2}s infinite`,
        }} aria-hidden="true" />
      ))}
      <span className="sr-only">Samaira is typing</span>
    </div>
  );
}

/* ─── Source citation pill ─── */
export function CitationPill({ source }: { source: string }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontFamily: "'DM Mono', monospace",
      background: "var(--brand-mint)",
      color: "var(--brand-leaf)",
      padding: "2px 8px",
      borderRadius: "var(--radius-full)",
      marginTop: 5,
      marginRight: 4,
    }}>
      <i className="ti ti-link" style={{ fontSize: 10 }} aria-hidden="true" />
      {source}
    </span>
  );
}

/* ─── Quick-reply chips ─── */
export function QuickReplies({ options, onSelect }: { options: string[]; onSelect: (s: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", paddingLeft: 36 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{
            padding: "5px 12px",
            border: "1px solid var(--border-mid)",
            borderRadius: "var(--radius-full)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: 12.5,
            cursor: "pointer",
            transition: "border-color var(--transition), background var(--transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--brand-leaf)";
            e.currentTarget.style.color = "var(--brand-leaf)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-mid)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── Message bubble ─── */
export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: string[];
  card?: React.ReactNode;
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      gap: 4,
      animation: "fadeIn 150ms ease",
    }}>
      {!isUser && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "var(--brand-leaf)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            flexShrink: 0,
          }} aria-hidden="true">S</span>
        </div>
      )}

      <div style={{
        maxWidth: isUser ? "72%" : "84%",
        marginLeft: isUser ? "auto" : 34,
      }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
          background: isUser ? "var(--brand-leaf)" : "var(--brand-mint)",
          color: isUser ? "#fff" : "var(--text-primary)",
          fontSize: 14,
          lineHeight: 1.6,
          border: isUser ? "none" : "1px solid rgba(15,110,86,0.12)",
        }}>
          {message.content}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {message.sources.map((s) => <CitationPill key={s} source={s} />)}
          </div>
        )}

        {message.card && (
          <div style={{ marginTop: 8 }}>
            {message.card}
          </div>
        )}
      </div>
    </div>
  );
}
