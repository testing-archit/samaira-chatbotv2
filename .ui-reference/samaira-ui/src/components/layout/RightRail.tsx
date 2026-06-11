"use client";

interface StrategyData {
  emergencyMonths: number;
  emergencyTarget: number;
  termCoverCr: number | null;
  termSuggestedCr: number;
  hasHealth: boolean;
  allocation: { equity: number; debt: number; gold: number };
  goals: { name: string; horizonYrs: number; monthlySip: number }[];
  sources: string[];
}

const DEMO: StrategyData = {
  emergencyMonths: 2,
  emergencyTarget: 6,
  termCoverCr: null,
  termSuggestedCr: 1.2,
  hasHealth: false,
  allocation: { equity: 65, debt: 25, gold: 10 },
  goals: [{ name: "Riya · college", horizonYrs: 12, monthlySip: 18000 }],
  sources: ["Octaraa · Family Tree", "Octaraa · Goal planning", "Finance education · goal SIP math"],
};

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

export default function RightRail({ data = DEMO }: { data?: StrategyData }) {
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
          Family snapshot
          <span style={{
            fontSize: 10.5,
            fontWeight: 400,
            color: "var(--text-tertiary)",
            background: "var(--bg-hover)",
            borderRadius: "var(--radius-full)",
            padding: "2px 7px",
          }}>illustrative</span>
        </h2>

        <GapRow icon="umbrella"
          label="Emergency fund"
          value={`${data.emergencyMonths}/${data.emergencyTarget} mo`}
          warn={data.emergencyMonths < data.emergencyTarget} />
        <GapRow icon="shield"
          label="Term cover"
          value={data.termCoverCr ? `₹${data.termCoverCr}Cr` : `₹${data.termSuggestedCr}Cr needed`}
          warn={!data.termCoverCr} />
        <GapRow icon="heart"
          label="Health cover"
          value={data.hasHealth ? "Active" : "Not set"}
          warn={!data.hasHealth} />

        <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "12px 0 6px", fontWeight: 500 }}>
          Mix · {data.goals[0]?.horizonYrs}yr · moderate
        </p>
        <AllocationBar {...data.allocation} />

        {data.goals.map((g) => (
          <div key={g.name} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 12,
          }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{g.name}</span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>
              ₹{(g.monthlySip / 1000).toFixed(0)}k
              <span style={{ fontSize: 10.5, color: "var(--text-tertiary)", fontWeight: 400 }}>/mo</span>
            </span>
          </div>
        ))}

        {/* Compliance disclaimer */}
        <div style={{
          marginTop: 12,
          padding: "8px 10px",
          background: "var(--warn-bg)",
          borderRadius: "var(--radius-sm)",
          fontSize: 10.5,
          color: "var(--warn-text)",
          lineHeight: 1.5,
        }}>
          Educational guidance, not investment advice. Category-level only. Based on your inputs and assumed returns.
        </div>

        {/* Human handoff CTA */}
        <button style={{
          marginTop: 10,
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
          {data.sources.map((s) => (
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
