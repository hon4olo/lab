# Batch 03 integration checkpoint

Date: 2026-09-15

The first-shift hands-on cooking path is now wired around production Batch 03 assets and spatial Build interaction.

Verified implementation state:

- dedicated Order / Prep / Grill / Build presentation assets are integrated;
- hands-on Prep and Grill are active for the first burger and hot-dog recipes;
- Build uses player-authored spatial ingredient placement and sauce strokes;
- player-facing one-click legacy assembly is no longer exposed when the production hands-on path is available;
- Flaming Business Cat uses the production full-swap transformation artwork;
- portrait Build shelf layout reserves space for every row so lower-row tools, including Glow Sauce, remain on-screen;
- browser QA geometry mirrors the production Build shelf layout.

The full CI workflow (`npm run check:ci`) remains the release gate for this checkpoint: typecheck, asset-manifest validation, unit/domain tests, production build verification, development browser tests, production browser tests, and visual-QA screenshot capture.

Relevant implementation commits on `main` immediately before this checkpoint include:

- `1228651` — retire player-facing legacy assembly fallback;
- `58f35ee` — lock spatial Build as the production path in presentation tests;
- `e135715` — keep the portrait Build shelf on-screen;
- `e797908` / `3153da0` — align browser QA geometry with the production Build shelf.
