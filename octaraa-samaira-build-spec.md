# Octaraa "Samaira" — AI Wealth Assistant: Build Spec (v2, Gemini-only · scalable · grounded)

> Hand this entire file to Antigravity alongside `AGENTS.md`. The agent reads both, then turns this into its own `implementation_plan.md`. Section 14 is the phased milestone list — work one milestone at a time with plan-approval gates. This version is consistent with the placed `AGENTS.md` (Gemini-only, scalable) and grounded in the real https://octaraa.com product.

---

## 0. What you're building (one paragraph)

"Samaira" is Octaraa's in-product AI wealth assistant for young Indian families. It does four jobs: (1) **sells** Octaraa by answering product questions and handling objections, (2) **compares** Octaraa against Indian competitors on the axes where Octaraa actually differentiates, (3) **educates** on personal finance (FD vs mutual fund, SIP vs lumpsum, tax, insurance), and (4) **profiles** a family's situation through conversation and produces an **illustrative, category-level** strategy. It is RAG-grounded so it never invents Octaraa features or competitor facts, runs behind a compliance guardrail so it never gives regulated personalised advice or promises returns, and is architected to scale horizontally on free-tier infra that upgrades by plan, not by rewrite. Octaraa already markets "Ask Samaira AI" publicly — this is that assistant.

---

## 1. The compliance constraint that shapes the whole design (read first)

Non-negotiable architecture, not a footnote.

- **SEBI (Investment Advisers) Regulations, 2013:** personalised investment advice *for consideration* requires SEBI RIA registration. If Octaraa is not an RIA, the bot must NOT recommend specific schemes/stocks — only **education** + **illustrative, category-level** allocation, with a disclaimer and human-advisor handoff.
- **No guaranteed / assured / risk-free / "beat the market" language**, ever. Strip it at the guardrail layer even if the model generates it.
- **Comparative claims must be factual + substantiated** (ASCI + comparative-advertising law). Every competitor fact comes from the structured matrix with an `as_of` date. No vibes, no disparagement.
- **DPDP Act, 2023:** family income, dependents, goals = sensitive personal data. Explicit consent before profiling, encryption at rest, data minimisation, deletion support, no raw financial PII in logs.
- **AI disclosure:** the first assistant message states Samaira is an AI assistant, not a human advisor. (Octaraa's own copy calls Samaira "unbiased" — note that "unbiased advice" is itself a regulated claim, so keep outputs educational and grounded.)

Implementation: one `lib/guardrails.ts` layer wraps every turn (input filter → generate → output filter). Hard dependency of every feature. Built in Milestone 1.

> **Confirm with Octaraa before/while building:** RIA, AMFI distributor (ARN), or neither? The public site shows no registration number, so default to the safe path. Config flag: `ADVICE_MODE = "educational" | "ria"`, default `educational`.

---

## 2. Capability breakdown (grounded in real features)

| # | Capability | How it's served | Key risk |
|---|------------|-----------------|----------|
| 1 | Knows every Octaraa feature | RAG over `octaraa` KB (seed file supplied) | Over-claiming `coming_soon` features → status flag + grounding |
| 2 | Knows competitors, argues Octaraa is better | `competitor_matrix` (dated facts) + narrative framing | False/disparaging claims → matrix is source of truth |
| 3 | Answers finance Q&A (FD vs MF etc.) | RAG over `finance_education` KB + reasoning | Bad advice → grounded + disclaimer |
| 4 | Persuades / handles objections | System prompt persona + objection playbook | Overpromising → guardrail filter |
| 5 | Profiles family + gives strategy | Slot-filling → rules engine → LLM narrative | SEBI breach → category-level only, `ADVICE_MODE` |

Real Octaraa features the bot must know (with status): **Family Tree** — unified multi-generation family account (live, core differentiator); **goal-based planning** for family milestones (live); **financial calculators** incl. college-cost (live); **gamified learning** — quizzes, certifications, leaderboard (live); **Ask Samaira AI** (live); **goal-based risk-aware portfolios / smart investing** (live — but confirm against the site's "some assets & features coming soon" note); **school/college workshops** (offline channel); **human experts** (handoff target). See the supplied `octaraa-kb-seed.md` for full grounded content + gaps.

---

## 3. Architecture overview

```
Browser (Next.js chat UI, streaming)
        │
        ▼
/api/chat  ──►  Agent orchestrator (Samaira persona + tool registry routing)
        │            ├── search_octaraa_knowledge()      ─┐
        │            ├── compare_competitor()             │  RAG / data tools
        │            ├── search_finance_education()        │  (registered in one place)
        │            ├── get_profile() / update_profile()  │
        │            └── generate_strategy()              ─┘
        │                       │
        │                       ▼
        │            Postgres + pgvector
        │            (profiles, sessions, messages,
        │             knowledge_chunks, competitor_matrix)
        │
        ├── lib/model.ts   (Gemini, provider-agnostic, per-task model, retry+backoff)
        └── lib/guardrails.ts  wraps INPUT and OUTPUT of every turn
              (SEBI filter · no-returns filter · grounding · PII handling)
```

Single orchestrating agent + tool registry — not a multi-agent swarm. The model's native tool-calling does routing; the system prompt holds persona + modes. Simpler, cheaper, easier to eval, and the right size here.

---

## 4. Tech stack (fixed)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15, App Router, TypeScript strict | Matches Octaraa's stack |
| Chat / streaming / tools | Vercel AI SDK v5 (`streamText` + `tools`) | Streaming + typed tool-calling, provider-agnostic |
| LLM (runtime) | **Gemini only**, via `lib/model.ts`. chat = Gemini 3 Flash (fallback 2.5 Flash); classifier = Flash-Lite; embeddings = Gemini embedding model | One API key covers chat + embeddings. Provider-agnostic so a fallback provider is a one-file change. |
| DB + vectors | Postgres + pgvector | One DB for relational + vector; scales by upgrading plan. HNSW index. |
| DB client | Pooled / serverless-friendly (postgres.js) in `lib/db.ts` | Serverless connection safety |
| Auth | Clerk or NextAuth | Session-scoped persistence |
| Validation | Zod | Tool args, profile schema, guardrail rules |
| Deploy | Vercel free Hobby | Native Next.js |

Free-tier note: Gemini free tier (~10–15 RPM, 1M-context, embeddings included) is fine for build + demo. Free-tier prompts may be used for training — so demo with **synthetic** profile data; production moves to paid tier / Vertex AI (excluded from training) for DPDP compliance.

---

## 5. Scalability requirements (acceptance criteria — enforce in every milestone)

1. **Stateless handlers.** No session/profile/conversation state in process memory; all state in Postgres keyed by `user_id`/`session_id`. Any instance serves any request.
2. **Pooled connections.** Pooled/serverless DB client; never one raw connection per request.
3. **Provider-agnostic model layer.** `lib/model.ts` exposes `chat()`, `classify()`, `embed()`; model per task, configurable by env. Adding a fallback provider = change this file only.
4. **Rate-limit resilience.** Every model call wrapped in retry + exponential backoff + jitter behind a concurrency limiter. All limits/top-k/timeouts from env, not literals. Degrade gracefully on exhaustion; never crash a turn.
5. **Caching.** Cache embeddings by content hash (never re-embed unchanged chunks); cache hot retrievals + competitor lookups; optional FAQ response cache. Minimise model calls.
6. **Ingestion decoupled from serving.** KB ingestion (fetch → clean → chunk → embed → upsert) is a standalone idempotent script (content-hash upserts), never on the request path.
7. **Modular tool registry + pluggable KBs.** Tools registered in one place; adding a capability or KB needs zero orchestrator changes.
8. **Streaming everywhere.** Frees connections, lowers perceived latency.
9. **Observability.** Structured PII-redacted logging; per-session token/cost metering; tracing; metrics for retrievals, tool calls, guardrail trips, rate-limit hits.
10. **Indexed hot paths + scoped queries.** Everything `user_id`/`session_id`-scoped; indexes on hot paths; paginated history; multi-tenant-ready schema.

---

## 6. Data model (Postgres)

```sql
users(id PK, created_at)                  -- mirror Clerk/NextAuth id

sessions(id PK, user_id FK, started_at, consent_profiling BOOL DEFAULT false)

messages(id PK, session_id FK, role, content, tool_calls JSONB, created_at)
-- index (session_id, created_at); paginate

user_profiles(
  user_id PK FK,
  dependents_count INT, earning_members INT,
  family_monthly_income_enc BYTEA,        -- encrypted
  monthly_surplus_enc BYTEA,              -- encrypted
  liabilities_enc BYTEA,                  -- encrypted
  emergency_fund_months INT,
  has_term_insurance BOOL, term_cover_enc BYTEA,
  has_health_insurance BOOL,
  risk_appetite TEXT, tax_regime TEXT, age INT,
  goals JSONB,                            -- [{name, target_amount, horizon_years}]
  updated_at
)

knowledge_chunks(
  id PK, kb TEXT,                          -- 'octaraa' | 'finance_education'
  content TEXT, content_hash TEXT UNIQUE,  -- idempotent ingest
  embedding vector(768),                   -- match Gemini embedding output dim (configurable)
  status TEXT DEFAULT 'live',              -- 'live' | 'coming_soon' | 'unconfirmed'  (octaraa KB)
  source_url TEXT, title TEXT, as_of DATE
)
-- HNSW index on embedding

competitor_matrix(
  id PK, competitor TEXT, dimension TEXT,
  value TEXT, octaraa_value TEXT, octaraa_advantage TEXT,
  source_url TEXT, as_of DATE
)
```

Vector dim must equal the Gemini embedding model's configured output dimensionality (e.g. 768). Financial fields encrypted app-layer (key in env/KMS) or pgcrypto; never written to `messages` or logs.

---

## 7. Knowledge layer (scalable RAG)

Three sources, two mechanisms.

**Vector KBs (`knowledge_chunks`)**
- `octaraa` — seeded from the supplied `octaraa-kb-seed.md` (real features, with `status` flags). The bot must present `coming_soon`/`unconfirmed` items as roadmap, not live. Ingestion can also scrape the rendered FAQ accordion (JS-loaded) to fill answers.
- `finance_education` — authored India-specific explainers: FD vs MF, debt vs equity funds, SIP vs lumpsum, ELSS & 80C, NPS, term vs ULIP, emergency fund, gold/SGB, old vs new tax regime, rule-of-72. Author these (don't scrape random blogs — accuracy matters).

**Structured matrix (`competitor_matrix`)** — facts about competitors live in a dated table, not prose, so comparisons stay accurate and ASCI-safe. The model only writes framing around returned rows. Octaraa's honest differentiators: **Family Tree / unified multi-generation account**, **goal-based family planning**, **gamified learning**. Compare on *those*, not on brokerage fees (where Groww/INDmoney lead). Competitors to seed: Groww, INDmoney, Zerodha Coin, ET Money, Kuvera, Paytm Money, Angel One, Dhan, smallcase; family-wealth-adjacent: Scripbox, Dezerv, Cube Wealth, 1 Finance.

Ingestion is a standalone idempotent script (content-hash upserts); embeddings + retrievals cached; HNSW index. None of this is on the request path.

---

## 8. Agent orchestration + tools

System prompt = the Samaira persona: identity, the four modes, voice (unbiased, education-first, family-first, plain-language, India context — matching Octaraa's public framing), hard rules (no guaranteed returns; no scheme-level advice unless `ADVICE_MODE=ria`; ground every product/competitor claim in tools; disclose AI; never present coming-soon features as live). Pass `ADVICE_MODE` + consent state into the prompt.

Tools (Zod-typed, registered in one registry):
```ts
search_octaraa_knowledge(query)         // top-k octaraa chunks (+ status, sources)
compare_competitor(competitor, dimension?) // dated matrix rows
search_finance_education(query)         // top-k finance chunks
get_profile() / update_profile(fields)  // update requires consent=true
request_profiling_consent()             // triggers consent UI
generate_strategy()                     // runs §10 engine on stored profile
```
Routing is implicit (model picks tools); the system prompt says when. Adding a tool/KB requires no orchestrator change.

---

## 9. Profiling module (conversational slot-filling)

Don't dump a form. On a strategy request → `request_profiling_consent()` → one-tap consent + AI-disclosure card. On consent, collect missing slots conversationally, calling `update_profile()` as you go; state persists in `user_profiles` (never memory). "Enough" = income + dependents + surplus + horizon/goals + risk. Then `generate_strategy()`. Handle refusals (proceed with stated assumptions), unrealistic numbers (sanity-check), consent withdrawal (stop + offer deletion).

Slots: dependents_count, earning_members, family_monthly_income, monthly_surplus, liabilities, emergency_fund_months, has_term_insurance/term_cover, has_health_insurance, risk_appetite, tax_regime, age, goals[].

---

## 10. Strategy engine (deterministic core + LLM narrative)

Deterministic backbone (rules, not the LLM):
1. **Emergency fund** = 6 × monthly expenses (expenses ≈ income − surplus); flag gap.
2. **Insurance gap:** term ≈ 10–15 × annual income; flag missing health cover (education, not a pitch).
3. **Investible surplus** = surplus after emergency-fund top-up.
4. **Allocation by horizon** (illustrative bands): <3y debt-heavy; 3–7y balanced; >7y equity-tilted, scaled by risk + age (equity cap ≈ min(100−age, risk_ceiling)).
5. **Goal bucketing:** each goal → horizon band + monthly SIP via future-value math, conservative real return, **assumptions shown**. (Octaraa's college-cost framing — education cost ~doubles every 8y — is a grounded hook here.)
6. **Tax note:** old vs new regime; 80C headroom (ELSS/NPS) only if old regime.

Category-level output (e.g. "large-cap/index equity, short-duration debt, gold"); names specific schemes only if `ADVICE_MODE=ria`. The LLM narrates the engine's output — never invents numbers — and always appends a disclaimer + human-advisor handoff CTA.

---

## 11. Persuasion / sales layer

Persona: Samaira — calm, competent, unbiased family-finance guide (matching Octaraa's public voice). Persuasion = honest objection-handling, not hype.
- **Objection playbook** from `octaraa` KB + `competitor_matrix`: "already use Groww/INDmoney" → surface the family-centric differentiators (Family Tree, goal-based family planning, gamified learning), dated. "Is it safe?" → grounded security facts (once supplied). "Too complex / I'm a beginner" → gamified learning + Samaira.
- **Comparisons** always call `compare_competitor()` and present `octaraa_advantage` rows honestly — including where a competitor leads. That builds trust and stays ASCI-safe.
- **Grounded hook:** the college-cost urgency (₹25L today → ~₹1cr in ~15y) routes users to Octaraa's calculator. Use to motivate planning — never as a returns promise.
- Hard rule (guardrail-enforced): no guaranteed/assured/"beat the market", no fabricated stats, no presenting coming-soon features as live.

---

## 12. Guardrails & compliance layer (build in Milestone 1)

`lib/guardrails.ts` — pure functions wrapping every turn.
- **Input filter:** out-of-scope detection (medical/legal beyond finance); in `educational` mode, steer personalised-advice asks to education + handoff.
- **Output filter:** block/replace guaranteed-return phrasing; downgrade scheme-level recs to category in `educational` mode; require a disclaimer on strategy-adjacent output; **grounding check** — product/competitor claims must trace to a tool result, and `coming_soon`/`unconfirmed` features must be framed as roadmap; otherwise replace with "I don't have that confirmed yet."
- **Data:** consent gate before profiling; encrypt financial fields; redact financial PII from logs; deletion endpoint.
- **Disclosure:** first assistant message identifies Samaira as an AI assistant.
- **Observability:** emit a metric on every guardrail trip.

---

## 13. Conversation flow examples (also your eval cases)

1. **Product:** "Can I track my whole family's investments in one place?" → `search_octaraa_knowledge("family tree unified account")` → grounded answer.
2. **Comparison:** "Why Octaraa over Groww?" → `compare_competitor("groww")` → dated rows on family-centric axes; honest about where Groww leads.
3. **Education:** "FD or mutual fund?" → `search_finance_education("FD vs mutual fund")` → trade-offs, no product rec, disclaimer.
4. **Profiling → strategy:** "Help me plan for my family." → consent → collect slots → `generate_strategy()` → emergency fund + insurance gap + category allocation + goal SIPs (assumptions shown) + disclaimer + handoff.
5. **Guardrail trip:** "Which fund gives guaranteed 15%?" → input filter → honest risk reframing, no promise.
6. **Coming-soon honesty:** user asks about an asset class flagged `coming_soon` → "that's on our roadmap," not "yes, available now."

Turn each into an automated eval (M5) for browser-screenshot verification.

---

## 14. Phased build plan (one milestone at a time; produce implementation_plan.md, wait for approval)

- **M0 — Scaffold:** Next.js 15 + TS, AI SDK, `lib/model.ts` (Gemini, provider-agnostic, per-task models, env-configured, retry+backoff+concurrency limiter), `lib/db.ts` (pooled Postgres+pgvector), env/config module, `ADVICE_MODE` flag, structured PII-redacted logger. Streaming chat at `/api/chat` with Samaira system prompt + AI disclosure. Stateless by construction.
- **M1 — Guardrails first:** `lib/guardrails.ts` input + output filters (banned-return phrasing, advice downgrade, disclaimer enforcement, grounding incl. status-aware framing), consent model, financial-field encryption, deletion endpoint, guardrail-trip metrics. Full unit tests. Nothing else merges until green.
- **M2 — Knowledge layer (scalable RAG):** schema + migrations, HNSW index. Decoupled idempotent ingestion for `octaraa` (from `octaraa-kb-seed.md` + rendered-FAQ scrape) and authored `finance_education`. Seeded dated `competitor_matrix`. Tools via registry. Embedding + retrieval caching. Grounding wired in.
- **M3 — Profiling + strategy:** `user_profiles` (encrypted fields), consent flow, slot-filling, deterministic `generate_strategy()` + narrative wrapper (no invented numbers). State persisted.
- **M4 — Persuasion polish:** objection playbook, comparison cards in chat, honest framing (incl. where competitors lead), persona tuning to Octaraa's voice.
- **M5 — Eval + verify + deploy:** automated eval suite (flows + adversarial guardrail prompts) as CI gate, browser-screenshot verification, deploy to Vercel.

---

## 15. Content status — what's supplied vs still needed

**Supplied:** `octaraa-kb-seed.md` (real features + positioning + FAQ questions, with status flags and gaps marked).

**Still needed from Octaraa (blocks accuracy):**
1. Regulatory status — RIA / AMFI distributor / neither → sets `ADVICE_MODE`. `[CRITICAL]`
2. Which asset classes/features are live vs "coming soon."
3. Data-security specifics (FAQ #8) — do not fabricate.
4. Full calculator list + full FAQ answers (or scrape rendered FAQ).
5. Any fees/charges (for honest competitor comparison).
6. Verified current competitor facts with `as_of` dates (this space changes fast).

---

## 16. Project rules

Canonical rules live in `AGENTS.md` (already in repo root) — Gemini-only, scalability rules, compliance rules, working method. This spec and `AGENTS.md` must stay consistent; if they ever conflict, `AGENTS.md` wins for rules and this spec wins for scope/architecture.

---

## 17. Stretch (mention in interview; don't necessarily build)

- Streaming citations UI (which KB chunk grounded each claim).
- Hindi/English code-switching — high value for the family audience.
- Per-goal "what-if" sliders in strategy output (interactive card) — shows product sense.
- Status-aware roadmap answers surfaced as a small "coming soon" badge in chat.
