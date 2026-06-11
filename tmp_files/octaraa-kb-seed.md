# Octaraa knowledge base — seed content (`octaraa` KB)

Source: https://octaraa.com/ (home + FAQ), fetched 2026-06-11. This is the grounding corpus for Samaira's product knowledge. Ingest into the `octaraa` KB in Milestone 2.

Rules for whoever maintains this file:
- Every entry has a `status` (`live` | `coming_soon` | `unconfirmed`). The bot must NOT present `coming_soon`/`unconfirmed` items as available today.
- Do not add features that aren't on the site or confirmed by Octaraa. Mark anything uncertain `unconfirmed` and leave a `[CONFIRM]` note.
- Stamp `as_of` when you edit. Re-scrape when the site changes.

---

## Brand & positioning

- **Tagline:** "Building Family Wealth Simplified."
- **Headline promise:** "Helping young families plan their financial future."
- **Core message:** "More than returns — it's financial freedom for your family." Octaraa empowers young families to plan, invest, and achieve family financial goals easily, on the belief that investing gives families the freedom to make better choices today and in future.
- **Target user:** young families in India.
- **Voice:** empowering, education-first, simplified/jargon-free, long-term ("built for long-term wealth creation, not short-term noise").
- **Contact:** connect@octaraa.com · +91 9667708843 (9 AM–8 PM) · WhatsApp same number. Socials: YouTube @Octaraa_Wealth, LinkedIn /company/octaraa, Instagram @octaraa_wealth, Facebook. Has a published Privacy Policy.

> Samaira persona note: Octaraa already markets "Ask Samaira AI" as giving "instant, unbiased answers and insights." Samaira's persona MUST match this public voice — unbiased, educational, family-first, plain-language. Don't drift from it.

---

## Features

### Family Tree — family-centric wealth management
- **status:** live (core differentiator)
- Manage your entire family's investments — spouse, parents, children — from a single, unified account. This unified multi-generation household view is Octaraa's primary differentiator vs individual-investor-first platforms.

### Financial calculators
- **status:** live
- AI-powered tools and calculators to plan family goals with confidence. Includes a College Cost calculator (https://octaraa.com/resources/college-cost). Full calculator list: https://octaraa.com/resources. `[CONFIRM full list of calculators]`

### Gamified learning
- **status:** live
- Build financial knowledge through interactive quizzes, certifications, and a competitive leaderboard.

### Ask Samaira AI
- **status:** live
- The in-product AI assistant. Handles everything from portfolio queries to financial concepts, giving instant, unbiased answers and insights. (This is the feature being extended in this project.)

### Goal-based planning
- **status:** live
- Plan for real-life family milestones (e.g. child's education) with personalised, long-term-oriented goals.

### Goal-based, risk-aware portfolios ("smart investing")
- **status:** live `[CONFIRM whether investing is fully live given the site's "coming soon" note]`
- Goal-based, risk-aware portfolios built for long-term wealth creation rather than short-term trading.

### Workshops at schools & colleges
- **status:** live (offline acquisition channel, not an app feature)
- Octaraa runs financial-education workshops at schools and colleges.

### Human experts
- **status:** live
- Users can speak to an Octaraa expert for guidance (Contact page). Samaira should hand off to a human expert for anything advice-grade or out of scope.

> **Platform-wide caveat (must respect in answers):** the site states "Some financial assets & features are coming soon on the platform." Treat the full asset menu as partially `coming_soon`. `[CONFIRM with Octaraa exactly which asset classes/features are live vs coming soon.]`

---

## How Octaraa works (onboarding flow)

1. **Onboard young families** — bring the whole family onto one platform: create the family tree, complete KYC, manage everything in one place.
2. **Learn & grow with Samaira AI** — instant, easy-to-understand answers to financial questions, building knowledge and confidence over time.
3. **Goal-based planning** — personalised goals for family milestones, designed for long-term outcomes.
4. **Start smart investing** — goal-based, risk-aware portfolios for long-term wealth creation.

---

## Persuasion hooks (grounded — safe to use)

- **Education-cost urgency (from their own calculator):** the cost of a child's education roughly doubles every ~8 years; a degree costing ₹25 lakh today could cost nearly ₹1 crore in ~15 years (Octaraa cites an Economic Times figure of ~10%/year education inflation). Route users to the College Cost calculator. Use this to motivate goal-based planning — never as a returns promise.

---

## FAQ (questions are live on site; answers below need completion)

The public FAQ lists these 10 questions; answers load via JS and were not captured in a static fetch. Fill each from Octaraa or by scraping the rendered accordion during ingestion. Provisional answers grounded in homepage copy are marked; `[GET ANSWER]` means do not guess.

1. **What is Octaraa and how does it help families?** — Provisional: a platform helping young Indian families plan, invest, and reach family financial goals via a unified family account, goal-based planning, calculators, gamified learning, and Samaira AI.
2. **How is Octaraa different from other financial platforms?** — Provisional: family-centric (Family Tree / unified multi-generation account) and education-first, vs individual-investor-first platforms. `[GET FULL ANSWER]`
3. **Can I manage my entire family's finances on Octaraa?** — Provisional: yes, via Family Tree (spouse, parents, children) in one account.
4. **Is Octaraa suitable for young families in India?** — Provisional: yes, that's the core target user.
5. **What features does Octaraa offer?** — See Features section above.
6. **How does Octaraa's AI (Samaira AI) help users?** — Provisional: instant, unbiased answers on portfolio queries and financial concepts.
7. **Are Octaraa's financial calculators useful for planning?** — Provisional: yes, AI-powered goal-planning tools incl. college cost. `[GET ANSWER]`
8. **Is my data secure on Octaraa?** — `[GET ANSWER — security specifics; do not fabricate]`
9. **Do I need financial knowledge to use Octaraa?** — Provisional: no; gamified learning + Samaira build knowledge over time.
10. **How can Octaraa help me achieve my family's financial goals?** — Provisional: goal-based planning + risk-aware portfolios + education + family view.

---

## Gaps to collect from Octaraa (blocks accurate answers)

- Regulatory status: SEBI RIA? AMFI distributor (ARN)? Neither yet? → sets `ADVICE_MODE`. `[CRITICAL]`
- Which asset classes/features are live vs "coming soon."
- Data-security specifics (for FAQ #8).
- Full calculator list and full FAQ answers.
- Any fees/charges (needed for honest competitor comparison).
- Account/KYC details, NRI support (relevant to family use-cases).
