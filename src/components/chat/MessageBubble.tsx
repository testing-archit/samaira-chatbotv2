"use client";
import { Loader2, Check } from "lucide-react";
import dynamic from 'next/dynamic';

const MarkdownRenderer = dynamic(() => import('../../app/markdown-renderer'), {
  ssr: false,
  loading: () => <span style={{color: "var(--text-secondary)"}}>Rendering...</span>
});

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

const toolLabels: Record<string, string> = {
  search_octaraa_knowledge: '🔍 Searching Octaraa knowledge...',
  search_finance_education: '📚 Searching finance education...',
  compare_competitor: '⚔️ Comparing platforms...',
  request_profiling_consent: '🔐 Securing consent...',
  get_profile: '👤 Reading profile...',
  update_profile: '📝 Updating profile...',
  generate_strategy: '📊 Generating strategy...',
  financial_calculator: '🧮 Calculating...',
};

const toolLabelsDone: Record<string, string> = {
  search_octaraa_knowledge: '✓ Searched Octaraa knowledge',
  search_finance_education: '✓ Searched finance education',
  compare_competitor: '✓ Analyzed competitor',
  request_profiling_consent: '✓ Secured consent',
  get_profile: '✓ Read profile',
  update_profile: '✓ Updated profile',
  generate_strategy: '✓ Generated personalized strategy',
  financial_calculator: '✓ Calculated mathematically',
};

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolInvocations?: Array<{ toolCallId: string; toolName: string; args: any }>;
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
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}>
        {/* Tool Invocations */}
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {message.toolInvocations
              .filter((tool) => tool.toolName !== 'update_profile' || Object.keys(tool.args || {}).length > 0)
              .map((tool, idx) => (
              <div key={idx} style={{
                fontSize: "11.5px",
                color: "var(--brand-leaf)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontStyle: "italic",
                opacity: message.content ? 0.7 : 1,
                background: "var(--brand-mint)",
                padding: "4px 8px",
                borderRadius: "var(--radius-full)",
                alignSelf: "flex-start",
                border: "1px solid rgba(15,110,86,0.12)"
              }}>
                {message.content ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <Loader2 size={12} className="spinning" />
                )}
                <span>
                  {message.content 
                    ? (toolLabelsDone[tool?.toolName] || `✓ Used ${tool?.toolName}`)
                    : (toolLabels[tool?.toolName] || `⚙️ Running ${tool?.toolName}...`)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <div style={{
            padding: "10px 14px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
            background: isUser ? "var(--brand-leaf)" : "var(--brand-mint)",
            color: isUser ? "#fff" : "var(--text-primary)",
            fontSize: 14,
            lineHeight: 1.6,
            border: isUser ? "none" : "1px solid rgba(15,110,86,0.12)",
          }}>
            {isUser ? (
              message.content
            ) : (
              <div className="markdown-body">
                <MarkdownRenderer content={message.content} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
