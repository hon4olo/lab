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
npm run dev
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
stable production asset references.

## Browser checks

For each production flow milestone, verify startup and first interaction in a real browser with
console and failed-resource inspection. Required viewport matrix:

| Profile | Viewport | Purpose |
|---|---:|---|
| Small portrait | 360×640 | minimum touch composition and safe spacing |
| Modern portrait | 390×844 | primary mobile layout |
| Landscape mobile | 844×390 | rotation and compact-height behavior |
| Tablet | 768×1024 | intermediate composition |
| Desktop | 1440×900 | multi-column composition and canvas bounds |

The first order milestone also validates 1280×720 and completes the Business Cat order at
360×640, 844×390, 1280×720, and 1440×900. The tested input path uses Phaser pointer events for
base ingredient slots, the Prep Board, Grill, assembly, the Extra Spicy modifier, and serving.

Checks include pointer/touch equivalence, resize/orientation without reload, safe-area behavior,
visibility pause/resume, audio unlock, keyboard focus for DOM controls, and no console errors or
broken asset requests.

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

Keep fixture saves from every shipped schema. For each release, test new save round-trip, old →
current migration chain, unknown future version rejection, malformed/truncated primary fallback,
removed content ID reconciliation, local fallback, and cloud conflict policy when platform storage
exists.

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
scenario registry. Production builds must not expose the bridge. The browser test suite should
assert both conditions and use snapshots only as diagnostics, never as gameplay authority.

Initial scenario names: `basic-order`, `perfect-grill`, `burned-order`, `first-transformation`,
`high-chaos`, `shift-end`, `mobile-layout`, and `rewarded-interruption`.

## Milestone exit report

Every milestone records exact commands and results, tested browser/viewports, screenshots reviewed,
console/network findings, measured performance where representative, and any skipped check with a
reason. A claim appears only if the check actually ran.
