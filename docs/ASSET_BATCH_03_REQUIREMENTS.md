# Asset Batch 03 — Station Rebuild Requirements

Status: **required before enabling the new hands-on station presentation in production**.

This batch exists to replace the current “single restaurant background + oversized station sprite”
presentation. Do not create temporary substitutes in code.

## Global art requirements

Use the approved Snack Lab art direction:

- warm illustrated 2D cartoon;
- slightly textured, not sterile vector;
- deep plum outlines;
- teal / cream environment with orange, coral, and yellow accents;
- readable mobile silhouettes;
- no text baked into artwork unless explicitly specified;
- no white matte/fringe on transparent sprites;
- no watermarks, filenames, captions, or reference-sheet residue.

Station backgrounds are opaque. Interactive food/tools are transparent PNG/WebP as appropriate.

## A. Order / Serve environment

### `background.street-snack-bar.order`

- 2048×1152 opaque
- customer-facing counter composition
- clean customer standing area with no bottles/props directly under character feet
- reserved upper-left/upper-right negative space for HUD/ticket depending responsive crop
- no player-visible text

The same authored environment may be reused for Serve/Reaction if composition supports it.

## B. Prep Station

### `station.street.prep.background`

- 2048×1152 opaque
- dedicated close-up prep workspace
- large central cutting/prep surface
- ingredient/tool storage around edges, not behind the work target
- no customer visible
- no order bubble baked in

### Prep interaction/tool sprites

Only create a tool when the current recipe actually uses it. Current first-shift minimum:

- `tool.prep.knife.street` — 256×256 transparent
- optional prepared-state overlays only if required by the authored interaction

Do not add decorative fake buttons as image assets; UI controls stay UI.

## C. Grill Station

### `station.street.grill.background`

- 2048×1152 opaque
- dedicated grill close-up
- at least 4 visually readable grill placement zones, with room to scale later
- clear empty grill surface; patties/sausages are separate sprites
- no cooked food baked into background
- no customer visible

### Grill tools

- `tool.grill.spatula.street` — 256×256 transparent
- optional tongs only if a recipe interaction requires them

Current cook-state assets already exist for burger patty and hot-dog sausage. Regenerate only if
visual QA shows they do not match the new station perspective/style.

## D. Build Station

### `station.street.build.background`

- 2048×1152 opaque
- dedicated assembly counter/work surface
- central neutral plate/paper/tray region large enough for free spatial placement
- side/bottom space for ingredient bins on desktop and mobile responsive crops
- no prebuilt burger/hot dog
- no customer visible

### Build gameplay ingredient sprites

The current ingredient icons/renders were not authored specifically for free stacking. Batch 03 must
provide gameplay-placement variants where needed. Each should have consistent perspective, outline,
lighting, and nominal visual scale.

Burger minimum:

- `food.burger.build.bottom-bun`
- `food.burger.build.patty`
- `food.burger.build.cheese`
- `food.burger.build.top-bun`
- `food.burger.build.chili-piece`

Hot-dog minimum:

- `food.hotdog.build.bun`
- `food.hotdog.build.sausage`
- `food.hotdog.build.cheese`
- `food.hotdog.build.pickle-piece`

Recommended canvas: 512×256 or 512×512 transparent depending silhouette. The actual object should
occupy most of its canvas without clipping. Individual repeated toppings must be individual sprites,
not a baked cluster, if the player is expected to distribute them separately.

### Sauce application assets

For every hands-on sauce:

- tool/bottle sprite, e.g. `tool.sauce.red-bottle`, `tool.sauce.mustard-bottle`,
  `tool.sauce.glow-bottle` — 256×256 transparent
- repeatable sauce stamp/ribbon texture, e.g. `fx.sauce.red-stamp` — 128×128 transparent

The game will place repeated stamps along the player's recorded sauce path. Do not fake the path with
plain Phaser geometry in production.

## E. Transformation replacement

### `customer.business-cat.flaming.full`

- 1024×1024 transparent
- one coherent full transformed Business Cat
- same recognizable identity/proportions as neutral Business Cat
- playful fire/glow/singed tie details
- no duplicate ears/eyes/head fragments
- no environment

This replaces the rejected Batch 01 fire/glow/singed modular overlays for the actual reaction view.

## F. UI required for station flow

Existing station rail/HUD assets may be reused after visual QA. New art should be created only if the
existing UI cannot support the final composition.

Potential additions, only if approved after layout work:

- compact order ticket frame for prep/grill/build
- station tab selected/unselected states
- drag/drop highlight frame
- sauce/tool selection frame

Do not generate these pre-emptively if existing production UI can be adapted cleanly.

## Asset manifest / QA requirements

Every asset must have:

- stable manifest ID;
- exact dimensions;
- alpha expectation;
- source/provenance metadata;
- dark/light QA where transparency applies;
- in-engine native/mobile-scale inspection.

Technical PNG validity is necessary but not sufficient for `production-approved`. Visual alignment,
perspective, consistency, composition, and actual gameplay usefulness are approval criteria.

## Activation rule

Code may define and test these stable asset IDs before files exist, but player-facing station code
must not load or display a missing asset and must not substitute programmer art. The new station path
is enabled only after all assets required by that station are manifest-approved.
