# Snack Lab Architecture v0.1

## Decision

Use **Phaser 4 + TypeScript + Vite** for the browser runtime.

| Option | Strengths | Cost for Snack Lab | Decision |
|---|---|---|---|
| Phaser + TypeScript + Vite | Integrated scenes, loader, sprites, tweens, particles, unified pointer input, scale manager, audio, mature 2D workflow | Engine boundary must be kept out of domain state | Selected |
| PixiJS + TypeScript + Vite | Excellent renderer, asset cache, scene graph, ticker, WebGL/WebGPU options | More custom work for scenes, interaction conventions, audio, game lifecycle, and station orchestration | Viable renderer, weaker overall fit |
| Vanilla TypeScript + Canvas | Maximum control and smallest conceptual dependency surface | We would own batching, asset lifecycle, animation/tween/particle systems, scene stack, hit testing, and extensive tooling | Rejected for production cost/risk |

Phaser has the clearest advantage for this sprite-heavy, multi-scene, interaction-heavy 2D game.
Vite supplies a fast TypeScript development server and static production build. React/Vue are not
used in the runtime; the DOM shell is plain TypeScript and CSS. No backend is added.

## Architectural rules

1. Plain TypeScript owns authoritative gameplay state and deterministic rules.
2. Phaser owns rendering, scene lifecycle, animation, particles, audio playback, and pointer input
   plumbing; no Phaser object is serialized or treated as domain truth.
3. Scenes coordinate controllers and presenters. Station mechanics never live inside `ShiftScene`.
4. Authored content is validated data addressed by stable IDs and localization/asset keys.
5. Platform SDKs, storage, analytics, and ads are adapters behind capability boundaries.
6. Hand-maintained runtime files normally stay under ~300 lines and split by responsibility before
   they become monoliths.
7. Player-facing art enters through the production asset manifest; technical shell UI does not
   impersonate unfinished gameplay.

## Runtime layers

```text
DOM shell / responsive UI / accessibility
                  ↕ events + view models
Phaser scenes / presenters / sprites / effects / audio
                  ↕ commands + immutable snapshots
Plain TypeScript domain / content / state machines
                  ↕ serializable schemas
Save, analytics, and capability-based platform services
```

Domain events are the seam for UI, feedback, audio, analytics, and rendering. Presentation may
finish late or be skipped without changing the authoritative result. Input is normalized into
named actions/gestures before reaching station logic.

## Source layout

```text
src/
  app/                     composition root and lifecycle
    scenes/                Boot, Preload, first-order coordinator; later shift/meta scenes
  game/
    orders/                order state, requirements, scoring inputs
    ingredients/           typed tags and definitions
    recipes/               authored recipe contracts and matching
    cooking/               FoodInstance, cook states, station contracts
    customers/             customer runtime state and preferences
    campaign/              renderer-independent chapter/session ownership
    transformations/       data-driven resolver and definitions
    economy/               sources, sinks, prices, rewards
    progression/           unlock rules and campaign state
    shifts/                shift orchestration and state
    events/                typed domain event contracts
  presentation/
    characters/ food/ stations/ effects/ ui/
  content/
    chapters/ customers/ ingredients/ recipes/ transformations/
    orders/ shifts/ upgrades/ decorations/ events/
  audio/                   bus IDs, cues, playback adapters
  platform/
    providers/             local, Yandex, Playgama, portal-specific adapters
  save/
    migrations/            immutable vN → vN+1 migrations
  localization/locales/    locale dictionaries
  analytics/               event port and providers
  config/                  environment and viewport configuration
  dev/                     DEV-only bridge and deterministic scenarios
tests/
  domain/ browser/ visual/ performance/
public/assets/manifest.json
```

The requested top-level groups remain, with `app/scenes` nested under the composition layer and
presentation kept separate from domain features. This makes ownership explicit while avoiding an
extra engine-specific mirror tree.

## Application and scene lifecycle

- `main.ts` creates the application composition root.
- `BootScene` performs synchronous engine setup and immediately starts preload.
- `PreloadScene` validates typed content references against the full asset manifest, then resolves
  the retained texture bundle for the active authored shift and loads it once by stable ID. It does
  not reload textures while that shift advances between order slots.
- The application composition root restores a `CampaignSession` and injects it into `OrderScene`.
  The campaign owns chapter/shift progress, the runtime economy, unlock context, and discovered
  transformations. It creates a `ShiftController`, which composes `ShiftSession`, the current plain
  TypeScript `OrderSession`, authored order/customer content, progression context, balance
  configuration, and the external `EconomySession`. The scene coordinates the sequence and focused
  Phaser presenters; it does not construct authored customer values or own gameplay rules.

The initial production slice is documented in `GAMEPLAY.md`. The current authored first shift
contains two authored order slots (Business Cat and Picky Pigeon) and finishes after both. Each
slot is resolved through the same controller/content boundary, so a later order can be added to a
shift definition without putting customer or recipe rules in the scene.

Both DOM and canvas fill the available safe viewport. Portrait and landscape/desktop select
different layout compositions through CSS/container sizing, not a stretched fixed screenshot.
Phaser uses resize scaling, a transparent canvas, and device-pixel-ratio-aware rendering bounded by
a configurable resolution cap.

## Domain state

`CampaignSession` is the renderer-independent session boundary above shifts. It owns chapter ID,
completed and active shifts, run identity, wallet/progression snapshots, and discovered
transformations. `CampaignContent` injects registries and a shift-controller factory; content
expansion does not require the Phaser scene to construct a customer, recipe, or order.

`src/content/registries.ts` exposes typed registries for customers, ingredients, recipes, orders,
shifts, chapters, and transformations. Recipe content separates base ingredients from its full
allowed contract. An order declares required, optional, and forbidden ingredients plus an optional
authored variation with zero or more modifiers; `OrderContent` resolves the exact selectable pool.
`validateSnackLabContent` checks duplicate IDs, authored references, recipe-contract membership,
canonical ingredient order, customer compatibility, prep/grill requirements, and approved manifest
asset IDs. Preload runs this full validation before the player enters the order.

`FoodInstance` is plain serializable data containing ordered ingredient IDs, cook states, station
history, quality, tags, Chaos score, mistakes, and visual variant. Definitions are immutable;
instances hold runtime state.

The first `OrderSession` composes focused domain systems for ingredient selection, prep, grilling,
assembly, scoring, payment transaction creation, and customer lifecycle. It never owns player coins.
`EconomySession` applies payment transactions once, owns the runtime wallet balance, and exposes a
plain snapshot suitable for the save boundary. `ShiftSession` owns the authored order sequence,
active index, completed slots, phase, and shift earnings; `ShiftController` coordinates those
systems and creates the next order session from content. It reads a live, read-only
`ProgressionContextProvider` as each session is created, so an unlock earned after one order can be
used by the next order in the same shift. `OrderSnapshot` is a cloned, renderer-free view of one
order. Grill timing and state artwork are authored on recipe/order data, so the same grill session
supports the burger patty and hot-dog sausage without a recipe-specific branch.

`CustomerDefinition` content stores authored customer type, variant, `basePatienceMs`, display key,
appearance asset IDs, and optional reaction head swaps. `CustomerPatienceSession` is a reusable
plain-TypeScript timer: it pauses with platform visibility, resumes without charging hidden time,
and clamps at zero without ending or failing an order. The Phaser presenter displays its current
ratio. The first shift is authored in `src/content/shifts/firstShift.ts` and contains exactly the
Business Cat burger slot followed by the Picky Pigeon hot-dog slot.

## Data-driven transformations

`TransformationResolver` filters incompatible definitions, verifies required/forbidden tags,
minimum Chaos, customer compatibility, and unlock requirements, then ranks candidates by priority,
preferred-tag matches, rarity weight, and stable ID tie-break. The resolver receives
`ProgressionContext` at the order boundary; it has no Phaser dependency. Random rarity selection, if
later approved, receives an injected seeded RNG so named scenarios and replays stay deterministic.

Shared scoring and payment tuning lives in typed `src/game/balance/BalanceConfig.ts`. Sessions
receive that configuration as data instead of embedding tuning constants in score and payment code.

Definitions carry appearance, reaction sequence, and optional effect asset IDs. The resolver never
creates art and never switches on individual transformation names. The first two authored results
are Flaming Business Cat (HOT + FIRE, Chaos ≥ 60) and Neon Pigeon (GLOW + ELECTRIC, Chaos ≥ 80,
Picky Pigeon).

## Cooking stations and input

Use a deliberately small station contract once two concrete stations prove the shared seam:

- enter/exit with a plain station session state;
- accept normalized pointer actions (`tap`, `drag`, `swipe`, `holdStart`, `holdEnd`);
- emit deterministic cooking commands/results and presentation events;
- expose a safe snapshot for UI/dev diagnostics.

Each station remains a feature module with its own interaction interpretation and presenter.
Pointer/touch/mouse normalization belongs to presentation/input adapters. Gameplay never checks raw
mouse buttons, browser event names, or exact screen pixels.

## Character and presentation boundary

Character views assemble authored layers through a stable rig/slot definition. Domain state emits
semantic actions such as `customerBite`, `reactionNegative`, or `transformationReveal`; a character
director maps them to tweens, sprite animations, particles, and audio cues. Animation completion
may gate presentation sequencing but cannot decide scoring or rewards.

Feedback uses small/medium/large presets and reduced-motion/reduced-flash settings. Camera punch and
shake affect visual roots only, never interaction geometry or domain positions.

## Asset loading

Stable manifest IDs are the public asset API. Content references `assetKey`; it never builds paths.
`AssetBundleResolver` combines shared street-snack-bar UI/FX with the active shift's resolved order
ingredients, customer appearances/reactions, grill states, finished variants, and compatible
transformation effects. Full manifest and registry validation still runs before this narrowed load.
The current first shift retains its bundle across both orders; `ui.station-tab` is intentionally not
loaded because no current scene uses it. Future chapter/shift bundles can use the same resolver
without making `PreloadScene` a content owner. Related sprites are atlased only after measurement
and visual QA. See `ASSET_PIPELINE.md` and `public/assets/manifest.json`.

## Audio

Audio routes through `Master`, `Music`, `SFX`, `UI`, `Ambience`, and `Voice` buses. The audio service
owns unlock-on-user-gesture, group volume, mute/restore, one-shot pooling, variation, and lifecycle
pause. Domain/presentation emit cue IDs; they do not hold Phaser sound objects.

## Platform boundary

`PlatformService` is injected at the composition root and reports capabilities rather than making
all features mandatory:

- `init`, `gameReady`, `gameplayStart`, `gameplayStop`;
- fullscreen and rewarded ads;
- storage;
- player identity;
- leaderboards;
- purchases;
- language and device/platform information;
- analytics hooks and pause/resume subscription.

The local provider is the only scaffold implementation. Future Yandex and Playgama adapters may
implement the same semantic contract, but core gameplay must never import either SDK. Calls are
idempotent where practical and failures degrade safely. Ads wrap gameplay stop/audio pause/save and
resume only after the platform confirms lifecycle restoration. Reward delivery occurs only on an
explicit rewarded callback.

Current Yandex architecture requirements include calling Game Ready only after all interactive
resources are loaded, marking gameplay start/stop at real lifecycle boundaries, responding to
platform pause/resume, muting audio while paused/ads are shown, deriving locale from the platform,
and placing ads only at logical pauses. SDK integration remains a later task and must be rechecked
against current official documentation then.

## Save architecture

Save schema v2 is JSON-compatible plain data. `SaveRepository` writes a staging copy, reads it back
through schema validation, preserves the previous valid primary as a backup, writes and verifies the
new primary, then clears staging. On load it validates primary, backup, and staging, selects the
highest valid revision, migrates sequentially, and reconciles content IDs before reconstructing the
campaign. The V1 → V2 migration preserves wallet/settings and adds empty run, result, transaction,
and discovery ledgers.

The saved campaign contains chapter and shift progress, active run identity, settled order result
snapshots, a persistent coin balance, applied transaction IDs, unlocks, and discovered
transformations. A replay creates a new run ID while retaining wallet, unlocks, and discoveries, so
its payment is a new transaction and old payments cannot be applied again. A completed shift is
restored as a localized result state with replay available. If the browser closes during an unsettled
order, the shift resumes at that order's entry with the same run ID; its unsaved selection/prep/grill
work restarts, while settled coins and completed orders remain safe.

Every save embeds `schemaVersion`, `revision`, `savedAt`, and build compatibility metadata.
`migrateSave` validates structure and invariants; `createCampaignSession` rejects stale result/slot
references, recovers in-progress snapshots with no remaining authored order, and recovers legacy
all-complete saves without a result snapshot by preserving the wallet and making the first shift
replayable. Campaign changes are saved at run start, first discovery, and order/shift settlement.
Cloud conflict policy, cloud storage, checksums, and save compaction remain future work.

## Localization and analytics

Localization dictionaries map stable keys to strings. Domain/content stores keys only. Locale
resolution order is stored user choice → platform language → browser language → English fallback.

Analytics is a typed port with a no-op provider in the scaffold. Events contain IDs and numeric
outcomes, not localized text or renderer objects. Consent/privacy and a specific SDK require a
separate decision.

## DEV inspectability

Development builds expose `window.SNACK_LAB.getSnapshot()` with safe, cloned read-only data:
scene/order/campaign phase, active shift index and earnings, selected ingredients, FoodInstance,
grill state, ORDER/COOK/CHAOS scores, transformation/discovery results, applied payment IDs,
wallet/session coins, FPS, and platform capabilities. `import.meta.env.DEV` gates installation. The
asset preview and diagnostics bridge are development-only.

Named deterministic scenarios are registered data/setup functions: `basic-order`, `perfect-grill`,
`burned-order`, `first-transformation`, `high-chaos`, `shift-end`, `mobile-layout`, and
`rewarded-interruption`. They are reachable only in development/test builds and accept an explicit
seed.

## Performance budgets

Initial targets are 60 FPS on representative modern mobile/desktop browsers, graceful 30 FPS on
lower-end devices, stable frame pacing, and fast interactive startup. Budgets become measured gates
after the first production flow exists. Avoid per-frame allocations, pool burst effects after
profiling, atlas coherent families, cap device pixel ratio, lazy-load later chapters, and profile a
production build before optimizing. Bundle and asset budgets are recorded per milestone rather
than guessed once and forgotten.
