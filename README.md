# MealPrep

Weekly meal plan generator POC — Expo / React Native.
Blackboard Mobile Software Engineer take-home.

## Stack

- **Expo SDK 54** + Expo Router (TypeScript strict)
- **NativeWind** (Tailwind for RN) — design tokens mapped from Figma
- **Zustand** — flow state (budget, dietary needs, nutritional goals)
- **Reanimated + Gesture Handler** — animations and custom slider
- **OpenAI structured outputs** — LLM meal-plan workflow (client-side POC)

## Architecture

Custom-hook–driven, atomic UI: screens are thin composition layers;
all business logic lives in typed hooks (`hooks/`) and modules (`lib/`).

```
app/          # Expo Router screens (presentation only)
components/
  ui/         # atomic, reusable UI primitives
  screens/    # screen-specific composed components
hooks/        # business logic hooks
lib/          # catalog, filters, llm, theme (design tokens)
state/        # Zustand flow store
data/         # product_catalog_en.json (3,295 Esselunga products)
assets/fonts/ # Promo font family
```

## Setup

Requires [Bun](https://bun.sh) (`~/.bun/bin` on PATH).

```bash
bun install
cp .env.example .env   # add your OpenAI key
bunx expo start --ios  # or: bunx expo start --android
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) — e.g.
`feat: add budget slider`, `fix: …`, `chore: …`, `docs: …`.

## Notes

- `.env` and the take-home resources folder are gitignored: the brief PDF
  contains an API key and must never be committed.
- Product data: OpenFoodFacts (Esselunga scrape), enriched with prices.
