"use client";
import { useState } from "react";

const NAV = [
  { icon: "dashboard", label: "Dashboard",   href: "#" },
  { icon: "sitemap",   label: "Family tree",  href: "#" },
  { icon: "target",    label: "Goals",        href: "#" },
  { icon: "school",    label: "Learn",        href: "#" },
  { icon: "message-circle", label: "Ask Samaira", href: "#", active: true },
];

const FAMILY = [
  { initials: "AA", name: "You (Aarav)",  self: true  },
  { initials: "PR", name: "Priya",        self: false },
  { initials: "M",  name: "Mom",          self: false },
  { initials: "R",  name: "Riya · 10y",   self: false },
];

export default function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
  const [active, setActive] = useState("Ask Samaira");

  return (
    <aside style={{
      width: "var(--sidebar-w)",
      background: "var(--brand-deep)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 18px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "-0.3px",
        }}>Octaraa</span>
        {onMobileClose && (
          <button onClick={onMobileClose} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            cursor: "pointer", fontSize: 20, lineHeight: 1,
          }} aria-label="Close menu">×</button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: "10px 10px 0" }} aria-label="Main navigation">
        {NAV.map((item) => {
          const isActive = active === item.label;
          return (
            <a key={item.label} href={item.href}
              onClick={(e) => { e.preventDefault(); setActive(item.label); }}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                fontSize: 13.5,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                textDecoration: "none",
                marginBottom: 2,
                transition: "background var(--transition), color var(--transition)",
              }}
            >
              <i className={`ti ti-${item.icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Family tree — the signature visual element */}
      <div style={{ padding: "18px 10px 0 18px", flex: 1 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
          paddingLeft: 2,
        }}>Your family</p>

        <div style={{ position: "relative" }}>
          {/* Vertical connector line — the signature element */}
          <svg
            aria-hidden="true"
            style={{ position: "absolute", left: 10, top: 11, width: 16, height: FAMILY.length * 36 - 18, pointerEvents: "none" }}
          >
            <line x1="1" y1="0" x2="1" y2={FAMILY.length * 36 - 18}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {FAMILY.map((_, i) => (
              <line key={i} x1="1" y1={i * 36 + 11} x2="10" y2={i * 36 + 11}
                stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            ))}
          </svg>

          <ul style={{ listStyle: "none", paddingLeft: 22 }}>
            {FAMILY.map((m) => (
              <li key={m.name} style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginBottom: 8,
                cursor: "pointer",
              }}>
                <span style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: m.self ? "var(--brand-mid)" : "rgba(255,255,255,0.12)",
                  border: m.self ? "none" : "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#fff",
                  flexShrink: 0,
                }}>{m.initials}</span>
                <span style={{
                  fontSize: 12.5,
                  color: m.self ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>{m.name}</span>
              </li>
            ))}
            <li style={{ paddingLeft: 2 }}>
              <button style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "1px dashed rgba(255,255,255,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px",
                color: "rgba(255,255,255,0.35)",
                fontSize: 12,
                cursor: "pointer",
                width: "100%",
              }}>
                <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
                Add member
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom profile */}
      <div style={{
        padding: "14px 14px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--brand-mid)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          color: "#fff",
          flexShrink: 0,
        }}>AA</span>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>Aarav Agarwal</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.3 }}>Free plan</p>
        </div>
        <i className="ti ti-settings" style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", cursor: "pointer" }} aria-label="Settings" />
      </div>
    </aside>
  );
}
