"use client";
import { useEffect, useState } from "react";
import { fetchProfileData, editProfileData } from "../../app/actions";
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

function ProfileEditModal({ profile, initialData, onClose, onSave }: { profile: any, initialData: Profile | null, onClose: () => void, onSave: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "var(--bg-card)", padding: 24, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "var(--shadow-float)", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Edit {profile.name}'s Profile</h3>
        <form action={async (fd) => { await editProfileData(profile.id, fd); onSave(); onClose(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Emergency Fund (Months)</label>
            <input type="number" name="emergency_fund_months" defaultValue={initialData?.emergency_fund_months || ''} placeholder="e.g. 6" style={{ padding: "8px 12px", border: "1px solid var(--border-mid)", borderRadius: 8, background: "var(--bg-input)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Term Insurance Cover (Cr)</label>
            <input type="number" step="0.1" name="term_cover" defaultValue={initialData?.term_cover || ''} placeholder="e.g. 1.5" style={{ padding: "8px 12px", border: "1px solid var(--border-mid)", borderRadius: 8, background: "var(--bg-input)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Health Insurance</label>
            <select name="has_health_insurance" defaultValue={initialData?.has_health_insurance === true ? 'true' : (initialData?.has_health_insurance === false ? 'false' : '')} style={{ padding: "8px 12px", border: "1px solid var(--border-mid)", borderRadius: 8, background: "var(--bg-input)" }}>
              <option value="">Not set</option>
              <option value="true">Yes, Active</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Risk Appetite</label>
            <select name="risk_appetite" defaultValue={initialData?.risk_appetite || ''} style={{ padding: "8px 12px", border: "1px solid var(--border-mid)", borderRadius: 8, background: "var(--bg-input)" }}>
              <option value="">Not set</option>
              <option value="low">Low (Conservative)</option>
              <option value="medium">Medium (Moderate)</option>
              <option value="high">High (Aggressive)</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-mid)", background: "transparent", cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, background: "var(--brand-leaf)", color: "#fff", border: "none", cursor: "pointer" }}>Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RightRail({ profile }: { profile: any }) {
  const [data, setData] = useState<Profile | null>(null);
  const [showEdit, setShowEdit] = useState(false);

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
          value={data.emergency_fund_months !== undefined && data.emergency_fund_months !== null ? `${data.emergency_fund_months} mo` : "Not set"}
          warn={data.emergency_fund_months === undefined || data.emergency_fund_months === null || data.emergency_fund_months < 6} />
        <GapRow icon="shield"
          label="Term cover"
          value={data.term_cover ? `₹${data.term_cover}Cr` : (data.has_term_insurance === false ? "None" : "Not set")}
          warn={!data.has_term_insurance} />
        <GapRow icon="heart"
          label="Health cover"
          value={data.has_health_insurance === true ? "Active" : (data.has_health_insurance === false ? "None" : "Not set")}
          warn={!data.has_health_insurance} />

        {data.risk_appetite ? (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "12px 0 6px", fontWeight: 500, textTransform: "capitalize" }}>
              Risk Appetite · {data.risk_appetite}
            </p>
            <AllocationBar equity={data.risk_appetite === 'high' ? 70 : (data.risk_appetite === 'medium' ? 50 : 30)} debt={data.risk_appetite === 'high' ? 20 : (data.risk_appetite === 'medium' ? 40 : 60)} gold={10} />
          </>
        ) : (
          <p style={{ fontSize: 11.5, color: "var(--warn-text)", margin: "12px 0 6px", fontWeight: 500 }}>
            Risk profile not set yet
          </p>
        )}

        {data.goals && data.goals.length > 0 ? data.goals.map((g: any, i: number) => (
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
        )) : (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>
            No goals planned yet
          </div>
        )}

        <button onClick={() => setShowEdit(true)} style={{
          marginTop: 20, width: "100%", padding: "8px", background: "transparent",
          color: "var(--brand-leaf)", border: "1px solid var(--brand-leaf)", borderRadius: "var(--radius-md)",
          fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}>
          <i className="ti ti-edit" /> Manually Edit Profile
        </button>

      </section>

      {showEdit && (
        <ProfileEditModal 
          profile={profile} 
          initialData={data} 
          onClose={() => setShowEdit(false)} 
          onSave={() => fetchProfileData(profile.id).then(res => { if(res) setData(res); })}
        />
      )}
    </aside>
  );
}
