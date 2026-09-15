# Snack Lab — Gameplay Rules

## Current first shift

The first authored shift contains two orders:

1. Business Cat — Hot Cheese Burger — Extra Spicy.
2. Picky Pigeon — Cheesy Street Hot Dog, with optional Glow Sauce.

After both customers are settled and leave, the shift-complete state appears. Replay preserves
persistent wallet/progression/discoveries and starts a new run with new payment transaction IDs.

## Canonical player-facing flow

```text
customer-entering
→ Order Station
→ Prep Station
→ Grill Station
→ Build Station
→ Serve / anticipation
→ reaction / optional transformation
→ payment / customer leaving
→ next order or Results
```

The exact domain phase names may retain legacy names while the migration is in progress, but the
player-facing experience must follow the separate workstation model in `STATION_GAMEPLAY.md`.

## Hands-on assembly

Build Station assembly is now spatial domain state, not a boolean.

`AssemblySession` records:

- layer/piece ingredient ID;
- normalized X/Y work-surface position;
- placement sequence;
- authored rotation/scale;
- sauce strokes as normalized point paths.

`RecipeDefinition.assembly` authors legal placement modes, count limits, center targets,
tolerances, and target spread. `FoodInstance.assembly` is the durable place for the completed build
snapshot.

`evaluateAssembly()` currently exposes deterministic metrics for completeness, layer order,
centering, distribution, and total spatial quality. These metrics are intentionally **not yet wired
into payment/scoring** so the existing tested payout baselines remain stable during the migration.

The old `assembleFood()` path still exists for the active vertical slice. It is legacy compatibility,
not the desired final interaction. New code must not deepen dependence on automatic assembly or
finished-food gameplay sprites.

## Burger authored assembly contract

Hot Cheese Burger currently authors:

- bottom bun — one layer;
- patty — one layer;
- cheese — one rotatable layer;
- red sauce — hands-on sauce strokes;
- Extra Spicy — optional individual pieces;
- top bun — one rotatable layer.

The eventual Build Station must render the actual placed components. The finished burger PNG remains
valid for compact result/collection use, not authoritative assembly.

## Hot-dog authored assembly contract

Cheesy Street Hot Dog currently authors:

- bun — one layer;
- sausage — one rotatable layer;
- cheese — one rotatable layer;
- pickle — piece placement;
- mustard — hands-on sauce strokes;
- Glow Sauce — optional hands-on sauce strokes.

## Grill

The grill remains renderer-independent. Phaser supplies elapsed time/input, while `GrillSession`
records deterministic cook state and quality.

Burger curve:

- raw before 1200 ms;
- cooked from 1200 ms;
- perfect from 2500 ms;
- ideal stop 3600 ms;
- burned from 6000 ms.

Hot-dog sausage curve:

- cooked at 1000 ms;
- perfect at 2200 ms;
- ideal stop 3200 ms;
- burned at 5200 ms.

The next station interaction migration will make the player drag food onto/off actual grill slots and
later perform authored actions such as flipping. The timing/state machine remains authoritative and
must not move into Phaser sprites.

## Prep

The current slice still has a minimal prep action for the burger patty / hot-dog sausage. The long-
term Prep Station is hands-on and recipe-specific: cutting, portioning, seasoning, mixing, or similar
actions. Do not add a generic one-click prep abstraction for future recipes.

## ORDER / COOK / CHAOS

### ORDER

Current production scoring still starts from ingredient/prep/assembled correctness using the shared
balance config. During spatial migration, preserve current payouts until spatial quality is formally
integrated.

Future ORDER scoring will combine:

- required / forbidden / extra ingredients;
- required prep;
- assembly completeness;
- layer order;
- centering;
- repeated-piece distribution;
- sauce distribution;
- recipe-specific presentation rules.

### COOK

COOK is the recorded cook quality from 0–100.

### CHAOS

CHAOS is intentional experimentation. It derives from authored ingredient/effect contributions and
may exceed 100%. Bad placement does not create CHAOS.

## Existing payout baselines

Until the spatial-scoring integration milestone explicitly changes balance tests:

- perfect Business Cat / Extra Spicy burger: **55 coins**;
- perfect base Picky Pigeon hot dog: **36 coins**;
- perfect Neon/Glow hot dog: **49 coins**.

These are regression baselines, not permanent economy promises.

## Transformations

Extra Spicy contributes HOT + FIRE and 70 Chaos. Flaming Business Cat is deterministic when its
authored requirements match.

Glow Sauce contributes GLOW + ELECTRIC and 100 Chaos. Neon Pigeon is deterministic when its authored
requirements match.

The old Batch 01 Flaming modular overlays are visually invalid because they contain duplicated/misaligned
character fragments. They must not be re-enabled. Until `customer.business-cat.flaming.full` is
approved, the current safe fallback is neutral Business Cat plus approved fire FX.

## Patience

Customer patience drains during appropriate active work phases, pauses while the page is hidden, and
never hard-fails an order at zero. Future balance may reduce tips/reaction quality without preventing
completion.

## Save / restore

Campaign/economy/progression saves remain versioned and renderer-independent. Applied payment IDs are
idempotent. Reloading during an unsettled order follows the documented safe-restart policy for that
order while preserving already-settled wallet/progression.

Spatial assembly is not yet included in mid-order restore because exact in-progress order restore is
not currently a product requirement. When that changes, save normalized assembly data, never Phaser
objects/pixels.

## Content model

Recipes define the base ingredient/station/assembly contract. Orders define customer-requested
required/optional/forbidden ingredients and optional variations/modifiers. Transformations are
resolved from FoodInstance/customer/progression content, not hardcoded recipe/customer branches.

## Current migration sequence

Before adding Customer #3:

1. spatial assembly domain — started;
2. dedicated station art from `ASSET_BATCH_03_REQUIREMENTS.md`;
3. direct-manipulation Build Station presenter;
4. drag-on/drag-off Grill presenter;
5. sauce gesture renderer using approved sauce stamp assets;
6. integrate assembly evaluation into ORDER scoring with new balance tests;
7. remove player-facing legacy automatic `assemble()` flow.
