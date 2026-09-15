# Snack Lab — Testing

## Commands

Fast project validation:

```bash
npm run check
```

Stable-checkpoint validation:

```bash
npm run check:ci
```

`check:ci` runs typecheck, asset validation, Vitest, production build/guard, development browser
flows, and production smoke coverage.

## Domain tests

Renderer-independent gameplay belongs under `tests/domain/`.

For hands-on assembly, cover:

- free placement at normalized coordinates;
- coordinate clamping/validation;
- movement/removal;
- per-ingredient count limits;
- layer ordering;
- repeated-piece distribution;
- sauce stroke storage;
- assembly completeness;
- deterministic assembly evaluation;
- eventual ORDER integration/payout regression.

Do not test Phaser pixels in domain tests.

## Browser viewport matrix

Minimum supported QA sizes:

- 360×640
- 844×390
- 1280×720
- 1440×900

Every major station/input refactor should exercise relevant portrait + landscape + desktop sizes.

## Station interaction QA

When the direct-manipulation station path is active, Playwright should validate semantic actions,
not only fixed pixel coordinates.

Required Build Station scenarios:

- drag a layer to center;
- drag a layer deliberately off-center;
- move an already placed component;
- remove/undo a component if supported;
- place multiple topping pieces at distinct positions;
- draw at least one sauce path;
- verify rendered FoodInstance matches domain assembly snapshot;
- touch/pointer mapping uses the same commands.

Required Grill scenarios:

- place cookable onto grill slot;
- cooking starts only when placed/activated according to authored rule;
- state changes are visible;
- remove at perfect state;
- burned state remains deterministic;
- later multi-slot behavior must not couple timers incorrectly.

## Visual QA

“No console errors” is not visual approval.

For station/presentation changes, capture representative screenshots:

- Order;
- Prep;
- Grill idle;
- Grill active/perfect;
- Build early;
- Build completed/variation;
- Serve;
- reaction/transformation;
- Results.

Inspect:

- hierarchy and scale;
- station separation;
- customer/prop overlap;
- order-ticket size;
- food readability;
- safe areas;
- portrait/landscape crop;
- blurred/upscaled art;
- broken transparent edges;
- transformed-character coherence.

CI may upload screenshot artifacts, but a human/model visual pass is still required for visual
milestones.

## Asset QA

Manifest tests must verify path/dimensions/status references. In-engine QA checks alpha, scale,
composition, and actual station usefulness.

Do not automatically approve an asset merely because it decodes and matches dimensions.

## Production smoke

Production smoke must run against built Vite output rather than the DEV bridge. Verify:

- app boots;
- canvas renders;
- manifest/current shift assets load;
- no failed HTTP requests;
- no uncaught errors;
- no document overflow;
- no DEV diagnostics leak into production.

## Motion / localization

Keep at least one normal-motion browser scenario (`prefers-reduced-motion: no-preference`) so tween
callbacks are exercised. Maintain reduced-motion coverage separately.

Keep RU layout coverage, especially 360×640, because translated text can expand significantly.

## Save / economy invariants

Regression coverage must preserve:

- payment transaction idempotency;
- wallet persistence;
- shift replay transaction uniqueness;
- transformation discovery idempotency;
- corrupted-save fallback;
- safe restart of unsettled orders.

If spatial mid-order restore is implemented later, test normalized assembly data round-trip and never
serialize Phaser objects.

## Current payout regression baselines

Until spatial ORDER scoring is intentionally integrated:

- Business Cat perfect Extra Spicy: 55 coins;
- Picky Pigeon perfect base hot dog: 36 coins;
- Picky Pigeon perfect Neon/Glow hot dog: 49 coins.

Any change must be intentional and documented.

## CI / Git checkpoints

GitHub Actions runs `npm run check:ci` on main/pull requests. Keep main usable after each pushed
checkpoint. If CI fails, inspect the concrete failing step/log; do not report success until the run
actually passes.
