# Snack Lab — Project Instructions

## Product source of truth

This repository contains **Snack Lab**, a commercial browser HTML5 cooking / restaurant-management
game. It is not an MVP, prototype, or disposable demo.

Primary target: Yandex Games. Secondary targets include CrazyGames, Playgama-compatible portals,
GameDistribution, Y8, GamePix, and other suitable HTML5 portals. A future iOS wrapper is allowed,
but do not rewrite the game around a native engine without an explicit product decision.

Read the smallest relevant set of project docs before changing behavior:

- `docs/GAME_DESIGN.md` — product fantasy, progression, content scale, retention goals
- `docs/STATION_GAMEPLAY.md` — canonical hands-on station flow and interaction rules
- `docs/GAMEPLAY.md` — current implemented gameplay rules and scoring
- `docs/ARCHITECTURE.md` — technical ownership and boundaries
- `docs/ART_DIRECTION.md` — visual direction and presentation constraints
- `docs/ASSET_PIPELINE.md` — asset QA and manifest rules
- `docs/ASSET_BATCH_03_REQUIREMENTS.md` — artwork needed for the next station rebuild
- `docs/TESTING.md` — required automated/browser validation

Explicit user decisions override older docs. When docs disagree, update the stale documentation in the
same task rather than silently implementing contradictory behavior.

## Core gameplay direction — non-negotiable

Snack Lab is now a **hands-on station game**. The structural inspiration is classic restaurant games
with separate workstations, but do not copy third-party IP, characters, artwork, layouts, or branding.

The player-facing flow is:

`Order → Prep → Grill → Build → Serve / Reaction → Results`

Each workstation is a real screen/workspace with its own composition and purpose. Do not simulate a
station by placing another large sprite over the restaurant lobby.

The player prepares food manually:

- ingredients are picked up and positioned by pointer/touch;
- cooked items are placed on/removing from actual station work areas;
- Build Station components retain spatial position, order, and rotation where authored;
- piece toppings can be distributed individually;
- sauces are applied as gestures/strokes, not as a one-click boolean;
- a finished-food PNG is never the authoritative gameplay assembly;
- ORDER scoring may use spatial assembly quality; COOK remains cooking quality; CHAOS represents
  authored experimental ingredients/combinations, not deliberately sloppy placement.

Never collapse hands-on gameplay back into `select ingredients → press Assemble → show finished PNG`.
Legacy code may exist during migration, but new work must move toward the spatial model.

## Visual asset rule

**No player-visible placeholders.** Do not add colored rectangles, circles, emoji, generic icons,
checkerboards, generated labels, temporary SVG art, or fake station backgrounds to make a screen look
complete.

If required production art does not exist:

1. implement/test renderer-independent domain logic and typed presentation contracts;
2. document the exact missing asset contract;
3. keep the incomplete player-facing feature disabled or on the existing approved path;
4. wait for approved production artwork.

Existing approved art may be reused only when it actually fits the intended station composition.
Technical manifest approval does not override obvious visual/art-direction defects.

## Engineering principles

- Authoritative gameplay/domain state is plain TypeScript and Phaser-independent.
- Phaser owns rendering, input plumbing, tweens, audio/effects, and station presentation.
- Scenes coordinate; domain sessions/controllers implement rules.
- Platform SDK integrations never leak into gameplay.
- Prefer deterministic, testable systems and typed authored content.
- Keep hand-maintained runtime files ordinarily below ~300 lines.
- Split by cohesive responsibility; do not create giant scenes, `GameManager`, `Utils`, or manual
  mega-catalogs.
- Preserve stable IDs for saves/content/assets.
- Do not add a backend or new production dependency without a concrete need.

## Station / assembly architecture

Spatial food assembly belongs in the domain. Store normalized work-surface coordinates rather than
Phaser pixels. `AssemblySession`/assembly definitions own placement events and sauce strokes; a
presenter maps them to the current viewport and approved art.

Recipe content should author:

- legal ingredients;
- assembly placement modes (`layer`, `piece`, `sauce`);
- count limits;
- target center/spread/tolerances;
- cooking/station requirements.

Input code must support mouse and touch from the same semantic actions. Avoid fragile raw pixel logic
inside domain state.

## Platform boundary

Gameplay must not directly depend on YaGames, PokiSDK, CrazyGames SDK, GameDistribution SDK,
Playgama Bridge, or other portal SDK implementations. Use capability-based platform adapters for
initialization, game-ready/gameplay start-stop, ads, rewarded ads, storage, player, leaderboards,
purchases, language/device data, and analytics hooks.

For external SDKs and portal policies, current official documentation is the source of truth.

## Browser targets and performance

Validate at minimum:

- 360×640
- 844×390
- 1280×720
- 1440×900

Support pointer/touch, responsive resizing, safe areas, visibility changes, and reduced motion.
Browser performance is a product requirement: control startup bytes, duplicate texture requests,
per-frame allocations, and asset bundle scope. Do not optimize away gameplay clarity.

## Testing and visual QA

For domain changes, add focused Vitest coverage. For station/input/presentation work, run actual
Chromium/Playwright flows and inspect captured screenshots. Automated tests must not treat “no
console error” as visual approval.

For hands-on assembly, cover at least:

- free placement and movement;
- layer order;
- piece distribution;
- sauce paths;
- touch/pointer mapping;
- portrait + landscape layout;
- save/replay/payment invariants;
- existing transformation/scoring regressions.

DEV-only diagnostics are allowed; production builds must not expose debug bridges.

## Agent skills

Use project skill `.agents/skills/snack-lab-production/SKILL.md` for substantial Snack Lab feature
work. Compose it with `game-ui-ux`, `input-systems`, `game-feel`, `create-game-assets`,
`performance-optimization`, `save-systems`, and portal-specific skills only when relevant.
Do not load the whole skill catalog.

## Git workflow

After a meaningful stable milestone or before a risky refactor:

- run the relevant checks;
- commit with a narrow message;
- push to `origin/main` when the user has authorized direct repository work;
- keep main usable after each checkpoint;
- never force-push.

## Definition of done

A feature is not done merely because it compiles. Inspect relevant docs, implement within ownership
boundaries, run appropriate tests, inspect rendered behavior for visual work, fix regressions, update
stale documentation, and report only validation that actually ran.
