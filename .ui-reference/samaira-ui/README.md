# Samaira UI — Octaraa AI wealth assistant frontend

Next.js 15 · TypeScript · App Router · No Tailwind (pure CSS-in-JS inline styles)

## Quick start

```bash
cd samaira-ui
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # verify before committing
```

## File structure

```
src/
  app/
    globals.css          ← design tokens, fonts, animations
    layout.tsx           ← root layout (Tabler icons CDN)
    page.tsx             ← responsive 3-column shell + mobile drawer
  components/
    layout/
      Sidebar.tsx        ← deep-forest sidebar, family tree connector (signature element)
      RightRail.tsx      ← family snapshot, strategy, grounded sources
    chat/
      ChatPanel.tsx      ← message list, scroll, streaming mock
      MessageBubble.tsx  ← bubbles, citation pills, quick-reply chips, typing indicator
      Composer.tsx       ← auto-resize textarea, streaming-aware send
    cards/
      ComparisonCard.tsx ← honest dated competitor comparison
      ConsentCard.tsx    ← DPDP consent + AI disclosure before profiling
```

## Wiring to the real API (replace the mock in ChatPanel.tsx)

Replace `useMockStream` with the Vercel AI SDK `useChat` hook:

```tsx
import { useChat } from "ai/react";

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: "/api/chat",   // your route handler
});
```

The `/api/chat` route handler should use `streamText` with your Gemini model,
your tool registry (search_octaraa_knowledge, compare_competitor, etc.),
and the guardrails wrapper.

## Rendering rich cards from tool results

In your route handler, emit a data annotation when a comparison or strategy
tool fires, and consume it in the UI:

```tsx
// Route: emit annotation
const result = await streamText({ ... });
// annotate stream with card data

// UI: read annotations
const { data } = useChat({ ... });
// render <ComparisonCard> or <ConsentCard> when annotation arrives
```

## Responsive breakpoints

| Width       | Layout                          |
|-------------|----------------------------------|
| ≥ 1024px    | Sidebar + Chat + Right Rail      |
| 860–1023px  | Sidebar + Chat (rail hidden)     |
| < 860px     | Chat only (sidebar in drawer)    |

## Design tokens (globals.css)

All colors live in CSS custom properties on `:root`.
Brand: `--brand-deep` `--brand-leaf` `--brand-mint`.
Never hardcode hex values in components — always use var().

## Compliance elements (do not remove)

- `ConsentCard` must appear before any `update_profile` call
- `ComparisonCard` footer must show `as of {date}`
- `Composer` footer text discloses AI assistant status
- `RightRail` strategy card must include disclaimer and human-handoff CTA
- First bot message must identify Samaira as an AI assistant
