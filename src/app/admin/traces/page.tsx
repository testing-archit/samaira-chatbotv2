'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Summary {
  total_turns: number;
  avg_latency_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  circuit_breaker_count: number;
  curated_hit_count: number;
}

interface ToolStat {
  tool_name: string;
  call_count: number;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
}

interface RecentTurn {
  trace_id: string;
  user_id: string;
  session_id: string;
  total_latency_ms: number;
  steps: number;
  total_tokens: number;
  estimated_cost_usd: number;
  tools_called: { step: number; tool: string; latency_ms: number }[];
  created_at: string;
}

interface CircuitBreaker {
  trace_id: string;
  step: string;
  tools_this_turn: string[];
  created_at: string;
}

interface ToolError {
  trace_id: string;
  tool: string;
  error: string;
  created_at: string;
}

interface DashboardData {
  summary: Summary;
  toolStats: ToolStat[];
  recentTurns: RecentTurn[];
  recentBreakers: CircuitBreaker[];
  recentErrors: ToolError[];
  range: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const C = {
  bg:        '#0a0a0f',
  surface:   'rgba(255,255,255,0.03)',
  border:    'rgba(255,255,255,0.08)',
  text:      '#e2e8f0',
  muted:     'rgba(255,255,255,0.4)',
  indigo:    '#6366f1',
  purple:    '#8b5cf6',
  emerald:   '#10b981',
  amber:     '#f59e0b',
  red:       '#ef4444',
  cyan:      '#06b6d4',
};

function fmt(n: number | string | undefined, decimals = 0) {
  const num = Number(n ?? 0);
  return isNaN(num) ? '—' : num.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

/* ─── Sub-components ────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '20px 22px',
      flex: 1,
      minWidth: 160,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle, ${accent ?? C.indigo}22, transparent 70%)`, borderRadius: '0 14px 0 100%' }} />
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ color: C.text, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string | number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h2 style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h2>
      {badge !== undefined && (
        <span style={{ background: 'rgba(99,102,241,0.15)', color: C.indigo, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────────── */
export default function AdminTracesPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTurn, setExpandedTurn] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async (r: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/traces?range=${r}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (!res.ok) throw new Error('Failed to load traces');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(range); }, [range, load]);

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  const maxToolCalls = data?.toolStats[0]?.call_count ?? 1;

  const TOOL_COLORS: Record<string, string> = {
    financial_calculator: C.indigo,
    reconcile_plan:       C.purple,
    search_octaraa_knowledge: C.cyan,
    search_finance_education: '#3b82f6',
    request_callback:     C.amber,
    update_profile:       C.emerald,
    generate_strategy:    '#ec4899',
    compare_competitor:   '#f97316',
    export_plan:          '#84cc16',
    get_profile:          '#94a3b8',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif", color: C.text }}>
      {/* Top nav */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Samaira Admin</span>
          <span style={{ color: C.muted, fontSize: 13 }}>/ Observability</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Range selector */}
          {(['1h','24h','7d','30d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: range === r ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: range === r ? C.indigo : C.muted,
              transition: 'all 0.15s',
            }}>{r}</button>
          ))}
          <button onClick={() => load(range)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontSize: 12 }}>
            ↻ Refresh
          </button>
          <button onClick={logout} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid rgba(239,68,68,0.3)`, background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 10, padding: '12px 16px', color: '#f87171', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign: 'center', color: C.muted, paddingTop: 80, fontSize: 14 }}>Loading traces…</div>
        )}

        {data && (
          <>
            {/* ── Stats row ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard icon="💬" label="Total Turns" value={fmt(data.summary.total_turns)} sub={`in last ${range}`} accent={C.indigo} />
              <StatCard icon="⚡" label="Avg Latency" value={`${fmt(data.summary.avg_latency_ms)}ms`} sub="per turn" accent={C.cyan} />
              <StatCard icon="🪙" label="Total Tokens" value={fmt(data.summary.total_tokens)} sub="prompt + completion" accent={C.purple} />
              <StatCard icon="💰" label="Est. Cost" value={`$${Number(data.summary.total_cost_usd ?? 0).toFixed(4)}`} sub="at $0.50 / 1M tokens" accent={C.emerald} />
              <StatCard icon="⚡" label="Circuit Breaker" value={fmt(data.summary.circuit_breaker_count)} sub="reconcile_plan misses" accent={C.red} />
              <StatCard icon="⚡" label="Curated Hits" value={fmt(data.summary.curated_hit_count)} sub="fast-path matches" accent={C.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
              {/* ── Tool usage ──────────────────────────────────────── */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px' }}>
                <SectionHeader title="Tool Usage" badge={data.toolStats.length} />
                {data.toolStats.length === 0
                  ? <p style={{ color: C.muted, fontSize: 13 }}>No tool calls in this range yet.</p>
                  : data.toolStats.map((t) => (
                    <div key={t.tool_name} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.tool_name}</span>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <span style={{ fontSize: 11, color: C.muted }}>{fmt(t.avg_latency_ms)}ms avg</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: TOOL_COLORS[t.tool_name] ?? C.indigo }}>{fmt(t.call_count)} calls</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(Number(t.call_count) / maxToolCalls) * 100}%`,
                          background: `linear-gradient(90deg, ${TOOL_COLORS[t.tool_name] ?? C.indigo}, ${TOOL_COLORS[t.tool_name] ?? C.purple}88)`,
                          borderRadius: 4,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* ── Circuit breaker + Errors ─────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px', flex: 1 }}>
                  <SectionHeader title="⚡ Circuit Breaker Fires" badge={data.recentBreakers.length} />
                  {data.recentBreakers.length === 0
                    ? <p style={{ color: C.muted, fontSize: 12 }}>None 🎉</p>
                    : data.recentBreakers.slice(0, 6).map((b, i) => (
                      <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < 5 ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>Step {b.step}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>{timeAgo(b.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          Tools: {(b.tools_this_turn ?? []).join(', ') || '—'}
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px', flex: 1 }}>
                  <SectionHeader title="🔴 Tool Errors" badge={data.recentErrors.length} />
                  {data.recentErrors.length === 0
                    ? <p style={{ color: C.muted, fontSize: 12 }}>None 🎉</p>
                    : data.recentErrors.slice(0, 5).map((e, i) => (
                      <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>{e.tool}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>{timeAgo(e.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2, wordBreak: 'break-all' }}>
                          {e.error?.substring(0, 80)}{(e.error?.length ?? 0) > 80 ? '…' : ''}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* ── Recent turns table ──────────────────────────────────── */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionHeader title="Recent Turns" badge={data.recentTurns.length} />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['Time', 'Trace ID', 'User', 'Steps', 'Tools Used', 'Tokens', 'Cost', 'Latency'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.muted, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTurns.map((turn) => {
                      const isExpanded = expandedTurn === turn.trace_id;
                      const toolNames = (turn.tools_called ?? []).map((t: any) => t.tool);
                      return (
                        <React.Fragment key={turn.trace_id}>
                          <tr
                            onClick={() => setExpandedTurn(isExpanded ? null : turn.trace_id)}
                            style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '11px 14px', color: C.muted, whiteSpace: 'nowrap' }}>{timeAgo(turn.created_at)}</td>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: C.indigo, fontSize: 10 }}>{turn.trace_id?.substring(0, 8)}…</td>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: C.muted, fontSize: 10 }}>{turn.user_id?.substring(0, 10)}…</td>
                            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                              <span style={{ background: 'rgba(99,102,241,0.12)', color: C.indigo, borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>{turn.steps}</span>
                            </td>
                            <td style={{ padding: '11px 14px', maxWidth: 220 }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {toolNames.slice(0, 4).map((t: string, i: number) => (
                                  <span key={i} style={{ background: `${TOOL_COLORS[t] ?? C.indigo}18`, color: TOOL_COLORS[t] ?? C.indigo, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{t.replace('_', '\u200b_')}</span>
                                ))}
                                {toolNames.length > 4 && <span style={{ color: C.muted, fontSize: 10 }}>+{toolNames.length - 4}</span>}
                              </div>
                            </td>
                            <td style={{ padding: '11px 14px', color: C.muted }}>{fmt(turn.total_tokens)}</td>
                            <td style={{ padding: '11px 14px', color: C.emerald, fontWeight: 600 }}>${Number(turn.estimated_cost_usd ?? 0).toFixed(5)}</td>
                            <td style={{ padding: '11px 14px', color: Number(turn.total_latency_ms) > 5000 ? C.amber : C.muted }}>
                              {fmt(turn.total_latency_ms)}ms
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${turn.trace_id}-exp`} style={{ background: 'rgba(99,102,241,0.04)' }}>
                              <td colSpan={8} style={{ padding: '12px 22px' }}>
                                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tool call breakdown</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {(turn.tools_called ?? []).map((tc: any, i: number) => (
                                    <div key={i} style={{ background: `${TOOL_COLORS[tc.tool] ?? C.indigo}12`, border: `1px solid ${TOOL_COLORS[tc.tool] ?? C.indigo}30`, borderRadius: 6, padding: '5px 10px' }}>
                                      <div style={{ color: TOOL_COLORS[tc.tool] ?? C.indigo, fontWeight: 700, fontSize: 11 }}>Step {tc.step}: {tc.tool}</div>
                                      <div style={{ color: C.muted, fontSize: 10 }}>{tc.latency_ms}ms</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ marginTop: 8, fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                                  trace_id: {turn.trace_id} · session: {turn.session_id}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {data.recentTurns.length === 0 && (
                  <div style={{ textAlign: 'center', color: C.muted, padding: '40px 0', fontSize: 13 }}>
                    No turns recorded yet. Start chatting to generate traces.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
