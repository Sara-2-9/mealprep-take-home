# AGENTS.md — MealPrep take-home

Guidance for any AI agent working on this project. Keep this file updated whenever
stack, structure, conventions, or project status change. The master plan with all
locked decisions lives in [`../PLAN.md`](../PLAN.md) — read it first.

## Project

Blackboard Mobile Software Engineer take-home: POC of the MealPrep core flow —
5 screens (Lander → Budget → Dietary needs → Nutritional goals → Weekly meal plan),
LLM-generated weekly meal plan from the Esselunga product catalog (3,295 items),
pixel-perfect implementation of the Figma file `6b7jS9TUz5qO7YAXvl98Pg`.

**Project language: English** — code, docs, commit messages, delivery docs.

## Repository layout

```
mealprep/                 # workspace root (NOT a git repo)
  PLAN.md                 # master action plan — decisions, phases, risks
  app/                    # ← the Expo app, git repo root (this file lives here)
  design/                 # one-shot Figma extraction (figma_full.json, frame_analysis.txt) — local only
  review/                 # device screenshots/recordings for pixel-perfect review — local only
  blackboard-mobile-engineer-take-home/  # original brief resources — NEVER commit (contains OpenAI key)
```

GitHub repo: https://github.com/Sara-2-9/mealprep-take-home (public).

## Stack & commands

- Expo SDK 57 + Expo Router, React Native 0.86, React 19, TypeScript strict
- Bun 1.4 as package manager/runtime — always `bun install`, never npm
- NativeWind v4 (Tailwind) for utilities; exact Figma px values via StyleSheet + tokens
- Reanimated 4 for animations, Gesture Handler for the budget slider, Zustand for flow state
- Run: `bunx expo start` (Expo Go on a physical iPhone 16 Pro is the reference target)
- Simulator: use the "iPhone 16 Pro" simulator (iOS 26.3) for local previews/screenshots

## Architecture rules (do not break these)

- `app/` — Expo Router screens: thin, presentation-only. No inline business logic.
- `components/ui/` — atomic, pure, props-driven components (`React.memo`, stable callbacks).
- `components/screens/` — screen-specific composed components.
- `hooks/` — all interaction/business logic as typed custom hooks.
- `lib/` — catalog query helpers, filter pipeline, LLM client/prompts/schema, theme tokens.
- `state/flowStore.ts` — Zustand flow store: `{ budget, dietaryNeeds, nutritionalGoals }`.
- `data/product_catalog_en.json` — 3,295-product catalog; index once, memoize filters.

## Design source of truth

- `lib/theme.ts` — layout tokens (canvas 393×852, spacing, sizes) extracted from Figma.
- `docs/design-reference.md` — palette, typography, per-screen specs, documented Figma gaps/improvisations.
- Figma extraction is **one-shot and local** (free-plan API budget); raw JSON is at
  `../design/figma_full.json`, outside the repo. Do not re-fetch unless a design changes.
- Pixel-perfect reviews: compare against device captures in `../review/`.

## Git & secrets

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, …) from day one.
- NEVER commit or push: `.env`, `blackboard-mobile-engineer-take-home/` (README.pdf
  exposes an OpenAI key), `design/`, `review/`, `*.fig`. Enforced via `.gitignore`.
- OpenAI key: `.env` / app config extra only; `.env.example` documents the shape.

## Current status (2026-09-05)

- ✅ Phase 0–2: scaffold, Figma tokens, screens 01–04 implemented and committed.
- 🔴 Known issue under investigation: on-device renders (see `../review/`) show
  `Pressable` container styles (backgrounds, fixed sizes, radii) not applied —
  CTA pills invisible, option cards collapsed, back-button circle missing.
  View/Text styles render correctly. Root cause not yet identified.
- ⬜ Phase 3 next: `lib/filters.ts`, `lib/llm/`, `hooks/useMealPlan.ts`, screen 05.
- ⬜ Phase 4: pixel-perfect polish, delivery doc, AI logs export, screen recording.
