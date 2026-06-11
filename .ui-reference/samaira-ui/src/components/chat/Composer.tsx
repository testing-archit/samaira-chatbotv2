"use client";
import { useState, useRef, useEffect } from "react";

interface ComposerProps {
  onSend: (text: string) => void;
  isStreaming?: boolean;
  quickReplies?: string[];
}

export default function Composer({ onSend, isStreaming, quickReplies }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [value]);

  return (
    <div style={{ padding: "10px 14px 14px" }}>
      {/* Quick replies */}
      {quickReplies && quickReplies.length > 0 && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 9 }}>
          {quickReplies.map((q) => (
            <button key={q} onClick={() => { onSend(q); }}
              style={{
                padding: "5px 12px",
                border: "1px solid var(--border-mid)",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                fontSize: 12.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >{q}</button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        background: "var(--bg-input)",
        border: "1px solid var(--border-mid)",
        borderRadius: "var(--radius-xl)",
        padding: "6px 6px 6px 16px",
        transition: "border-color var(--transition)",
      }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand-leaf)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-mid)")}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Samaira…"
          rows={1}
          disabled={isStreaming}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            resize: "none",
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: "inherit",
            color: "var(--text-primary)",
            padding: "3px 0",
            minHeight: 24,
            maxHeight: 140,
          }}
        />

        <button
          onClick={submit}
          disabled={!value.trim() || isStreaming}
          aria-label={isStreaming ? "Samaira is responding" : "Send message"}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: value.trim() && !isStreaming ? "var(--brand-leaf)" : "var(--bg-hover)",
            color: value.trim() && !isStreaming ? "#fff" : "var(--text-tertiary)",
            border: "none",
            cursor: value.trim() && !isStreaming ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background var(--transition), color var(--transition)",
          }}
        >
          {isStreaming
            ? <i className="ti ti-square-rounded" style={{ fontSize: 14 }} aria-hidden="true" />
            : <i className="ti ti-arrow-up" style={{ fontSize: 14 }} aria-hidden="true" />}
        </button>
      </div>

      <p style={{ fontSize: 10.5, color: "var(--text-tertiary)", textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>
        Samaira is an AI assistant · not a human advisor · always verify with a SEBI-registered professional
      </p>
    </div>
  );
}
