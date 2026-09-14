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
    transformations/       data-driven resolver and definitions
    economy/               sources, sinks, prices, rewards
    progression/           unlock rules and campaign state
    shifts/                shift orchestration and state
    events/                typed domain event contracts
  presentation/
    characters/ food/ stations/ effects/ ui/
  content/
    chapters/ customers/ ingredients/ recipes/ transformations/
    upgrades/ decorations/ events/
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
- `PreloadScene` loads the production-approved manifest bundle by stable ID.
- `OrderScene` coordinates the first Business Cat order by composing the plain TypeScript
  `OrderSession` with focused Phaser presenters and a feedback director. It does not own recipe,
  cooking, scoring, transformation, or payment rules.

The initial production slice is documented in `GAMEPLAY.md`. It includes one Business Cat order
and does not yet start a second customer. A future shift coordinator may compose order sessions,
customer queues, and station navigation without moving their rules into a scene.

Both DOM and canvas fill the available safe viewport. Portrait and landscape/desktop select
different layout compositions through CSS/container sizing, not a stretched fixed screenshot.
Phaser uses resize scaling, a transparent canvas, and device-pixel-ratio-aware rendering bounded by
a configurable resolution cap.

## Domain state

Prefer composition over a giant mutable `GameState` singleton:

- `PlayerProgress`
- `RestaurantProgress`
- `ShiftState`
- `ActiveOrders`
- `EconomyState`
- `UnlockState`

An application session store can compose these slices and publish read-only snapshots. Commands
validate and mutate through owning services/reducers. IDs are typed string unions or branded IDs;
content lookups fail at validation/load boundaries rather than deep inside a scene.

`FoodInstance` is plain serializable data containing ordered ingredient IDs, cook states, station
history, quality, tags, Chaos score, mistakes, and visual variant. Definitions are immutable;
instances hold runtime state.

The first order session composes focused domain systems for ingredient selection, prep, grilling,
burger assembly, scoring, payment, and customer lifecycle. `OrderSnapshot` is a cloned,
renderer-free diagnostic view of the current order.

## Data-driven transformations

`TransformationResolver` filters incompatible definitions, verifies required/forbidden tags,
minimum Chaos, customer compatibility, and unlock requirements, then ranks candidates by priority,
preferred-tag matches, rarity weight, and stable ID tie-break. Random rarity selection, if later
approved, receives an injected seeded RNG so named scenarios and replays stay deterministic.

Definitions carry appearance and reaction sequence IDs. The resolver never creates art and never
switches on individual transformation names.

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
Bundles are loaded by scene/chapter and released when safe. Related sprites are atlased only after
measurement and visual QA. See `ASSET_PIPELINE.md` and `public/assets/manifest.json`.

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

Save schema v1 is JSON-compatible plain data. `SaveService` captures authoritative state, validates
it, writes through a storage provider, and keeps local fallback/last-known-good data. Browser local
storage cannot provide filesystem atomic rename, so writes use a staged key, validation/read-back,
primary key, and backup key. Platform cloud writes use provider limits and explicit conflict rules.

Every save embeds `schemaVersion`, `revision`, `savedAt`, and content/build compatibility metadata.
Loading performs: parse → checksum/shape check where used → sequential migrations → validation →
content ID reconciliation → domain reconstruction. Migrations are pure and retained permanently.
Autosaves occur at safe boundaries such as order settlement, shift completion, upgrade purchase,
settings change, and visibility loss, with throttling where needed.

## Localization and analytics

Localization dictionaries map stable keys to strings. Domain/content stores keys only. Locale
resolution order is platform language → stored user choice → browser language → English fallback.

Analytics is a typed port with a no-op provider in the scaffold. Events contain IDs and numeric
outcomes, not localized text or renderer objects. Consent/privacy and a specific SDK require a
separate decision.

## DEV inspectability

Development builds expose `window.SNACK_LAB.getSnapshot()` with safe, cloned read-only data:
scene, order ID and phase, selected ingredients, FoodInstance, grill state, ORDER/COOK/CHAOS scores,
transformation result, coins, FPS, and platform capabilities. `import.meta.env.DEV` gates
installation. The asset preview and diagnostics bridge are development-only.

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
