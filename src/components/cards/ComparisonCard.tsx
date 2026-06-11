"use client";

export interface CompetitorRow {
  dimension: string;
  octaraa: string;
  competitor: string;
  octaraaBetter: boolean;
  comingSoon?: boolean;
}

export interface ComparisonCardProps {
  competitor: string;
  rows: CompetitorRow[];
  asOf: string;
}

export default function ComparisonCard({ competitor, rows, asOf }: ComparisonCardProps) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      maxWidth: 420,
      boxShadow: "var(--shadow-card)",
      animation: "slideUp 200ms ease",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr",
        fontSize: 12,
        fontWeight: 600,
        background: "var(--bg-hover)",
        padding: "8px 12px",
        color: "var(--text-secondary)",
        borderBottom: "1px solid var(--border)",
      }}>
        <span></span>
        <span style={{ color: "var(--brand-leaf)" }}>Octaraa</span>
        <span>{competitor}</span>
      </div>

      {rows.map((row, i) => (
        <div key={row.dimension} style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          fontSize: 12.5,
          padding: "8px 12px",
          borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
          background: row.octaraaBetter ? "rgba(15,110,86,0.03)" : "transparent",
        }}>
          <span style={{ color: "var(--text-secondary)" }}>{row.dimension}</span>
          <span style={{ color: "var(--brand-leaf)", fontWeight: 500 }}>
            {row.comingSoon
              ? <span style={{
                  background: "var(--coming-bg)",
                  color: "var(--coming-text)",
                  fontSize: 10.5,
                  padding: "2px 7px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 500,
                }}>coming soon</span>
              : row.octaraa}
          </span>
          <span style={{ color: row.octaraaBetter ? "var(--text-tertiary)" : "var(--text-primary)" }}>
            {row.competitor}
          </span>
        </div>
      ))}

      <div style={{
        padding: "7px 12px",
        background: "var(--bg-hover)",
        fontSize: 10.5,
        color: "var(--text-tertiary)",
        fontFamily: "'DM Mono', monospace",
        borderTop: "1px solid var(--border)",
      }}>
        as of {asOf} · upfront where {competitor} leads
      </div>
    </div>
  );
}
