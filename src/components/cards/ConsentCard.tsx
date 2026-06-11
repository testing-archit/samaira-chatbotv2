"use client";

interface ConsentCardProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentCard({ onAccept, onDecline }: ConsentCardProps) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "16px",
      maxWidth: 380,
      boxShadow: "var(--shadow-card)",
      animation: "slideUp 200ms ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-md)",
          background: "var(--brand-mint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <i className="ti ti-lock" style={{ fontSize: 16, color: "var(--brand-leaf)" }} aria-hidden="true" />
        </div>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>A few questions first</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
            I'll ask about your finances to build a plan.
          </p>
        </div>
      </div>

      <ul style={{ listStyle: "none", marginBottom: 14 }}>
        {[
          { icon: "shield-lock", text: "Your answers are encrypted at rest" },
          { icon: "eye-off",     text: "Never sold or shared with third parties" },
          { icon: "alert-circle", text: "This is educational guidance, not investment advice" },
          { icon: "user-circle", text: "Talking to Samaira AI, not a human advisor" },
        ].map((item) => (
          <li key={item.text} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            fontSize: 12.5,
            color: "var(--text-secondary)",
            padding: "4px 0",
          }}>
            <i className={`ti ti-${item.icon}`} style={{ fontSize: 14, color: "var(--brand-leaf)", marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
            {item.text}
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onAccept}
          style={{
            flex: 1,
            padding: "9px 14px",
            background: "var(--brand-leaf)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background var(--transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-deep)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--brand-leaf)")}
        >
          Continue
        </button>
        <button
          onClick={onDecline}
          style={{
            flex: 1,
            padding: "9px 14px",
            background: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-mid)",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 400,
            cursor: "pointer",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
