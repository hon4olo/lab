# Snack Lab Testing Strategy v0.1

## Principles

Validate the behavior changed, at risk-proportionate scope. Domain rules are deterministic and
fast; browser, visual, performance, and platform checks cover integration risks. Never substitute a
successful build for an actual browser check.

## Commands

```bash
npm run typecheck
npm test
npm run build
npm run test:browser
```

`npm run check` runs typecheck, unit tests, and production build. Browser/visual/performance checks
remain explicit because they require a running server and viewport/device context.

## Domain tests

Vitest runs plain TypeScript tests for:

- transformation eligibility, ranking, stable tie-breaks, and unlock/customer constraints;
- ORDER/COOK/CHAOS scoring and entertainment outcomes for mistakes;
- economy sources/sinks, reward caps, upgrades, and unlock logic;
- FoodInstance state transitions and station command results;
- save validation and every sequential migration from retained historical fixtures.

Domain tests inject elapsed grill time and use no Phaser scene or browser object. Current coverage
includes the base burger and post-assembly Extra Spicy modifier, perfect and burned cooking, missing
ingredients, deterministic Flaming Business Cat resolution, ORDER/COOK/CHAOS scoring, payment, and
stable production asset references. Campaign/save tests cover V1 → V2 migration, valid save loading,
corrupt-save fallback, staging/backup recovery, safe active-order restart, completed-shift restore,
first discovery idempotency, duplicate settlement prevention, wallet persistence, and replay. Content
registry tests cover duplicate IDs, broken references, recipe/order mismatches, prep requirements,
customer compatibility, and unapproved assets. Patience tests cover expiry, pause/resume, and
continuing an order after the timer reaches zero.

## Browser checks

The automated Playwright smoke suite runs the complete authored order in Chromium at all required
viewports:

| Profile | Viewport | Purpose |
|---|---:|---|
| Small portrait | 360×640 | minimum touch composition and safe spacing |
| Landscape mobile | 844×390 | rotation and compact-height behavior |
| 720p desktop | 1280×720 | desktop composition |
| Large desktop | 1440×900 | wider desktop composition |

At each viewport it uses real pointer clicks to select ingredients, prepare the patty, stop a
perfect-state patty, assemble the burger, add Extra Spicy, serve, wait through
transformation/payment, reload the completed shift, and replay it. It asserts ORDER 100 and CHAOS
140, a non-burned perfect cook state, one unique payment per run, balance equal to the persisted
payment result after reload, first-time transformation discovery, localized shift completion, no
failed asset requests, HTTP errors, page errors, console errors, document overflow, or repeated
first-load asset requests. Replay must not request textures again. The deterministic domain test
asserts the exact ideal-stop result ORDER 100 / COOK 100 / CHAOS 140 = 55 coins.

Pointer/touch equivalence, resize/orientation without reload, audio unlock, keyboard behavior, and
visual screenshot review remain separate follow-up checks.

## Visual regression

Capture stable screenshots from named scenarios rather than arbitrary manual play. Initial target
states are boot/shell, mobile layout, basic order, active station, burned order, first
transformation, high Chaos score, shift result, and upgrade screen. Store viewport, scenario seed,
locale, reduced-motion setting, and content version with each baseline.

Visual review checks clipping, overlap, hierarchy, face/food readability, incorrect asset variants,
safe areas, localization overflow, and animation settle frames. Pixel-diff thresholds supplement,
but do not replace, human review for particle/animation variability.

## Performance

Measure production builds on representative mobile and desktop hardware. Record startup-to-
interactive, JS bundle transfer/parse, asset transfer/texture memory, average and p95 frame time,
long tasks, draw calls where available, and memory after repeated shifts. Use named worst-case
scenarios and compare the same device/build before and after optimization.

Initial intent is 60 FPS on modern targets with graceful 30 FPS on lower-end hardware; numerical
budgets become enforceable after the first complete production flow provides representative assets
and effects. Profile before pooling, batching, or other optimization work.

## Save and migration

Keep fixture saves from every shipped schema. The current suite tests V1 → V2 migration, valid save
round-trip, unknown future version rejection, malformed primary fallback to a valid backup or
default, interrupted staging recovery, stale completion reconciliation, and active-order restart.
Cloud conflict policy is not implemented because no cloud storage adapter exists.

## Platform tests (when adapters are implemented)

Run provider contract tests plus draft/sandbox integration checks for:

- SDK init success, timeout, unavailable SDK, and partial capabilities;
- game-ready exactly when interaction is possible;
- gameplay start/stop, menu, tab visibility, pause/resume, and repeated lifecycle events;
- interstitial/rewarded open, close, fail, interruption, and confirmed reward callback;
- save-before-ad and audio/input restoration after ads;
- locale/device reporting, storage quotas/conflicts, auth cancellation, and offline fallback.

Current scaffold intentionally uses only the local provider and does not load a portal SDK.

## DEV diagnostics and scenarios

Development builds expose a read-only `window.SNACK_LAB.getSnapshot()` and named deterministic
scenario registry. `npm run build` verifies that bridge/asset-QA markers are absent from production
JavaScript. The browser test suite uses the bridge only for diagnostics, never as gameplay authority.

Initial scenario names: `basic-order`, `perfect-grill`, `burned-order`, `first-transformation`,
`high-chaos`, `shift-end`, `mobile-layout`, and `rewarded-interruption`.

## Milestone exit report

Every milestone records exact commands and results, tested browser/viewports, screenshots reviewed,
console/network findings, measured performance where representative, and any skipped check with a
reason. A claim appears only if the check actually ran.

## First-session baseline — 2026-09-15

- `npm run check`: passed typecheck, 43 domain/content tests across 10 files, production build, and
  the production-bundle DEV-tooling guard.
- `npm run test:browser`: passed 4/4 complete order → Flaming reaction → payment → reload → replay
  runs at 360×640, 844×390, 1280×720, and 1440×900. No failed requests, HTTP errors, uncaught page
  errors, console errors, or document overflow were observed.
- Production JavaScript: 1,458,061 bytes (1,458.06 kB); Vite reports 381.16 kB gzip. It remains a
  single chunk above Vite's 500 kB warning threshold.
- First-session preload requests all 38 production-approved PNGs: 6,292,360 bytes total on disk
  (6.00 MiB), plus the manifest. The browser suite observed 39 unique asset/manifest requests on
  first load, no duplicate texture requests, and no new asset requests during replay.
