# Snack Lab — Architecture

## Stack

- Phaser 4.2.1
- TypeScript 7.0.2
- Vite 8.3.0
- Vitest 5.0.0
- Playwright 1.62.1

No React/Vue runtime, no backend, no portal SDK in core gameplay.

## Ownership model

### Plain TypeScript domain

Authoritative state/rules live outside Phaser:

- campaign/session progression;
- shifts/order sequencing;
- economy/payment idempotency;
- saves/migrations;
- content registries/validation;
- customers/patience;
- ingredient selection/content;
- Prep/Grill rules;
- **spatial food assembly**;
- scoring;
- transformations/discoveries.

### Phaser presentation

Phaser owns:

- scene/workstation rendering;
- responsive layout;
- pointer/touch mapping;
- drag visuals;
- tweens/effects/audio;
- texture loading;
- station HUD/navigation.

Phaser objects never become authoritative food/order/save state.

## Runtime hierarchy

```text
CampaignSession
  └─ ShiftController / ShiftSession
       └─ OrderSession
            ├─ CustomerPatienceSession
            ├─ PrepBoardSession
            ├─ GrillSession
            ├─ AssemblySession   ← hands-on Build Station target
            ├─ scoring
            └─ transformation resolver
```

`EconomySession` owns wallet state outside an individual order. Payment transactions use stable
identities so reload/replay cannot award the same settlement twice.

## Station presentation architecture

Player-facing work is separated into distinct station workspaces:

```text
Order → Prep → Grill → Build → Serve / Reaction → Results
```

The existing `OrderScene` may remain a coordinator during the migration, but it must delegate each
workspace to focused presenters/modules. Do not let one scene class accumulate all station input,
layout, rendering, scoring, and content logic.

Recommended direction:

```text
OrderScene
  ├─ OrderStationPresenter
  ├─ PrepStationPresenter
  ├─ GrillStationPresenter
  ├─ BuildStationPresenter
  ├─ ServeStationPresenter
  └─ ResultsPresenter
```

Shared HUD/ticket/station navigation can be composed separately.

## Spatial assembly domain

`src/game/assembly/` contains renderer-independent assembly primitives.

`AssemblyDefinition` authors the recipe workspace contract:

- placement mode: `layer`, `piece`, `sauce`;
- minimum/maximum counts;
- ideal horizontal target;
- tolerance;
- repeated-piece/sauce spread;
- rotation permission;
- authored visual scale.

`AssemblySession` records normalized 0..1 coordinates and sequence. It never stores Phaser pixels.

`FoodAssemblySnapshot` contains placed components and sauce strokes. `FoodInstance.assembly` is the
authoritative place for a completed spatial build.

`evaluateAssembly()` currently produces deterministic completeness/layer-order/centering/distribution
metrics. These are deliberately not yet wired to payment while the legacy slice migrates.

## Input boundary

Presentation converts pointer/touch into semantic commands such as:

- pick ingredient;
- place/move/remove component;
- begin/continue/end sauce stroke;
- place cookable on grill slot;
- perform flip/stir/cut action;
- remove cookable from station.

Domain code receives normalized workspace coordinates and elapsed time, not DOM/Phaser input objects.

Touch visuals may be offset above the finger, but the intended drop coordinate is preserved.

## Recipe / order content

Recipe definitions own:

- base/available ingredients;
- canonical ingredient order;
- prep/grill requirements;
- grill timings/state art;
- optional spatial `assembly` definition.

Orders own:

- required/optional/forbidden request subsets;
- optional variations/modifiers;
- payment/tip/Chaos target;
- customer-facing instructions/reaction sequence.

Avoid duplicating recipes for every order variation.

## Transformations

Transformation resolver input is `FoodInstance + CustomerInstance + live ProgressionContext`.
Definitions remain data-driven; no giant customer/recipe branch tree.

Appearance modes may be full swap or approved overlays. Presentation must reject/avoid known broken
asset composites rather than forcing them.

## Save architecture

Versioned save state includes wallet, campaign progress, completed shifts, unlocks, discoveries,
applied payment IDs, and relevant settings/collection state.

Save repositories use safe staging/backup behavior. Unsettled mid-order restore currently restarts the
active order from its safe entry boundary; exact grill/assembly resume is not required yet.

If spatial mid-order restore is added later, serialize normalized domain snapshots only.

## Asset loading

The manifest remains the stable texture/source contract. Full manifest/content validation may run at
startup/test time, while runtime loading resolves only shared assets plus current shift content.

New dedicated station screens must use production-approved station assets. Do not silently fall back
to programmer art when an asset is missing.

See `ASSET_BATCH_03_REQUIREMENTS.md`.

## Platform boundary

Portal SDKs are capabilities behind `PlatformService`/adapters. Core gameplay must not import
YaGames or other portal SDK globals.

Expected future capabilities:

- init/gameReady;
- gameplayStart/gameplayStop;
- interstitial/rewarded ads;
- storage/player;
- leaderboards;
- purchases;
- language/device/platform data;
- analytics hooks.

## Module-size rule

Hand-maintained runtime files should ordinarily stay below ~300 lines. Split by cohesive behavior,
not arbitrary line chunks. Generated files may be larger only when genuinely generated.

## Migration policy

The first vertical slice still uses legacy automatic assembly in `OrderSession.assemble()` /
`assembleFood()`. Keep it working until the hands-on Build Station path is complete, but do not add
new features that depend on automatic assembly.

Migration order:

1. assembly domain/contracts — in progress;
2. production station assets;
3. BuildStation presenter/input;
4. Grill direct manipulation;
5. spatial scoring integration;
6. remove legacy player-facing automatic assembly.
