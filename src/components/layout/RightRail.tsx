"use client";
import { useEffect, useState } from "react";
import { fetchProfileData } from "../../app/actions";
import { Profile } from "../../lib/strategy";

function AllocationBar({ equity, debt, gold }: { equity: number; debt: number; gold: number }) {
  return (
    <div>
      <div style={{
        height: 8,
        borderRadius: "var(--radius-full)",
        overflow: "hidden",
        display: "flex",
        background: "var(--bg-hover)",
      }}>
        <div style={{ width: `${equity}%`, background: "var(--brand-leaf)" }} title={`Equity ${equity}%`} />
        <div style={{ width: `${debt}%`, background: "var(--brand-mint2)" }} title={`Debt ${debt}%`} />
        <div style={{ width: `${gold}%`, background: "#EF9F27" }} title={`Gold ${gold}%`} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
        {[
          { label: `Equity ${equity}%`, color: "var(--brand-leaf)" },
          { label: `Debt ${debt}%`,     color: "var(--brand-mint2)" },
          { label: `Gold ${gold}%`,     color: "#EF9F27" },
        ].map((s) => (
          <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function GapRow({ icon, label, value, warn }: { icon: string; label: string; value: string; warn?: boolean }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12.5,
      padding: "6px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
        {label}
      </span>
      <span style={{ color: warn ? "#A16207" : "var(--success-text)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function RightRail({ profile }: { profile: any }) {
  const [data, setData] = useState<Profile | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetchProfileData(profile.id).then(res => {
      if (res) setData(res);
    });
    
    // Auto-refresh interval to catch profile updates made by the AI
    const interval = setInterval(() => {
      fetchProfileData(profile.id).then(res => {
        if (res) setData(res);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  if (!data) return (
    <aside style={{ width: "var(--rail-w)", flexShrink: 0, padding: "14px 0", color: "var(--text-secondary)", fontSize: 13, textAlign: "center" }}>
      Loading profile...
    </aside>
  );

  return (
    <aside style={{
      width: "var(--rail-w)",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      overflowY: "auto",
      padding: "14px 0 20px",
    }}>
      {/* Family snapshot */}
      <section aria-labelledby="snapshot-heading" style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "14px",
        boxShadow: "var(--shadow-card)",
      }}>
        <h2 id="snapshot-heading" style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {profile?.name}'s snapshot
        </h2>

        <GapRow icon="umbrella"
          label="Emergency fund"
          value={`${data.emergency_fund_months || 0}/6 mo`}
          warn={(data.emergency_fund_months || 0) < 6} />
        <GapRow icon="shield"
          label="Term cover"
          value={data.term_cover ? `₹${data.term_cover}Cr` : `Needed`}
          warn={!data.has_term_insurance} />
        <GapRow icon="heart"
          label="Health cover"
          value={data.has_health_insurance ? "Active" : "Not set"}
          warn={!data.has_health_insurance} />

        {data.risk_appetite && (
          <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "12px 0 6px", fontWeight: 500, textTransform: "capitalize" }}>
            Risk Appetite · {data.risk_appetite}
          </p>
        )}
        <AllocationBar equity={data.risk_appetite === 'high' ? 70 : 50} debt={data.risk_appetite === 'high' ? 20 : 40} gold={10} />

        {data.goals && data.goals.length > 0 && data.goals.map((g: any, i: number) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 12,
          }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{g.name}</span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>
              ₹{((g.target_amount || 0) / 1000).toFixed(0)}k
            </span>
          </div>
        ))}

        {/* Human handoff CTA */}
        <button style={{
          marginTop: 20,
          width: "100%",
          padding: "9px 12px",
          background: "var(--brand-leaf)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-md)",
          fontSize: 12.5,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          transition: "background var(--transition)",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-deep)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--brand-leaf)")}
        >
          <i className="ti ti-headset" style={{ fontSize: 14 }} aria-hidden="true" />
          Talk to an expert
        </button>
      </section>

      {/* Sources */}
      <section aria-labelledby="sources-heading" style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "12px 14px",
        boxShadow: "var(--shadow-card)",
      }}>
        <h2 id="sources-heading" style={{
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-secondary)",
        }}>
          <i className="ti ti-books" style={{ fontSize: 14 }} aria-hidden="true" />
          Grounded sources
        </h2>
        <ul style={{ listStyle: "none" }}>
          {["Octaraa · Family Tree", "Octaraa · Goal planning"].map((s) => (
            <li key={s} style={{
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: "var(--text-tertiary)",
              padding: "3px 0",
              borderBottom: "1px solid var(--border)",
              lineHeight: 1.5,
            }}>{s}</li>
          ))}
        </ul>
        <p style={{
          fontSize: 10,
          color: "var(--text-tertiary)",
          marginTop: 8,
          fontFamily: "'DM Mono', monospace",
        }}>no memory-only claims</p>
      </section>
    </aside>
  );
}
