# Design Reference — MealPrep Figma extraction

Source: Figma file `6b7jS9TUz5qO7YAXvl98Pg` ("mealprep_design"), extracted 2026-09-05
via Figma REST API with personal access token (1 `GET file` call + 1 `GET file images`
call — free-plan Tier 1 budget is ~6–20 calls/month, so extraction is one-shot and local).

Canvas: **393 × 852** (iPhone 14/15/16). All fonts **Promo weight 400** unless noted.
Raw file JSON: `../design/figma_full.json` (kept outside the repo).

## Palette

| Token | Value | Usage |
|---|---|---|
| `cream` | `#FDFFFB` | Background of screens 01–04 |
| `primary` | `#34C759` | CTA buttons, progress bar fill, screen 05 background |
| `surface` | `#F2F2F7` | Option cards, disabled button, slider track, back-button circle, skeleton bars |
| `ink` | `#1A1A1A` | Big budget value |
| `label` | `rgba(60,60,67,0.6)` | Secondary labels ("per week", meta text, "Est. cost") |
| `label-disabled` | `rgba(60,60,67,0.18)` | Disabled CTA text |
| black | `#000000` | Primary text |

## Typography (Promo)

| Element | Size | Line height | Extra |
|---|---|---|---|
| Logo "MealPrep" | 48 | 66.8 | |
| Screen 05 title "Bon appetit!" | 40 | 55.6 | white, centered |
| Section titles ("What's your budget?"…) | 32 | 44.5 | |
| Budget value "€82" | 96 | 133.5 | `ink`, centered |
| Day title "Monday", "€80" | 24 | 33.4/33.5 | |
| CTA label, "per week" | 20 | 27.8/28 | ls 0.4 on CTA |
| Option labels, "Est. cost" | 16 | 22.4 | |
| Day cells, "Ingredients"/"Recipe" heads | 14 | 19.6/19.5 | |
| Meta (time/servings/price) | 12 | 16.9 | `label` color |

## Shared layout

- Screen padding: **20 px** sides → content width **353 px**.
- Header block at **y=82**: back button 28×28 (surface circle, chevron-left stroke 1.67 black) + progress bar 315×20 (surface pill; green fill with white inner bar 6 px high, 12 px inset). Title at **y=130**, 32/44.5.
- CTA button: 353×72, pill radius 99, **y=723** (bottom margin 57). Default: `primary` bg, white text. Disabled: `surface` bg, `label-disabled` text.
- Progress per step: Budget 25 %, Dietary 50 %, Nutritional 75 % (LoadingBar component variants; inner white bar width = fill − 24).

## Screen notes

- **01 Lander** — bg `cream`; logo 48 at y=82; hero image 200×200 at (97,312) — asset `assets/images/lander-hero.png`; 7 floating emojis (40 px, positions in raw JSON — free to restyle/animate); CTA "Create your meal plan".
- **02 Budget Selection** — title "What's your budget?"; "per week" (20 px, `label`) centered under the value; big value 96 px; **slider is only a placeholder** (track 345×16 `surface` pill at y=512, thumb 64×64 `surface` circle) — we implement a custom slider €25–150, step €5.
- **03 Dietary Needs** — grid 2×3 of cards 168.5×104, r=20, gap 16, starting y=254: **None · 🥕 Veggie · 🌱 Vegan · 🐟 Pescatarian · 🌾 Gluten free · 🥛 Dairy free**. CTA starts **disabled** (surface bg).
- **04 Nutritional Goals** — same grid: **None · 🥩 High protein · 🍯 Low sugar · 🫑 Low fat · 🍝 Low carbs · 🧂 Low salt**. CTA starts disabled.
- **05 Weekly meal plan** — bg `primary`; "Bon appetit!" white 40 px; cost card 353×72 white r=16 ("Est. cost" + "€80 / week"); day selector row 7 cells 47×40 r=12 gap 4 (active = black bg white text, inactive = white bg, surface 1 px border); white content card 337×546 r=… padding 24, gap 28: day name 24 px, meal title 16 px, meta row (clock 25 min · user 2 servings · cash €4.18/serving, 12 px `label`), "Ingredients" and "Recipe" sections with skeleton bars 289×16 `surface` pill (content free — our design). Side cards peeking left/right → horizontal pager.

## Components (frame 1:6)

- **Button**: variants Default / Disabled (specs above).
- **LoadingBar**: variants 25 % / 50 % / 75 %.
- **Icon**: 28×28 circle button, chevron-left 20×20 stroke 1.67.

## Missing / improvised (documented for delivery)

1. Budget slider functional design (fill, thumb with value, haptics) — placeholder only in Figma.
2. Lander hero/emoji animation.
3. Meal plan card inner content (ingredients + recipe lists are skeleton bars in Figma).
4. Selected state of option cards (not in Figma) — we define it.
