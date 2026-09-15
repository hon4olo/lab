# Snack Lab station gameplay

This document is the canonical player-facing interaction model for cooking workstations.

## Principle

Snack Lab is a hands-on cooking game. The player performs the food preparation directly rather than
selecting a checklist of ingredients and asking the game to assemble the dish automatically.

The station flow is:

```text
Order → Prep → Grill → Build → Serve / Reaction → Results
```

The structure is inspired by the general pattern of classic restaurant-management games with
separate workstations. Do not copy third-party IP, art, exact HUD layouts, terminology, or branded
screen designs.

## 1. Order Station

Purpose: read the request, identify the customer, and decide what work is needed.

The screen contains the customer, a compact order ticket, patience, queue/shift context, and station
navigation. It does not show the full Prep/Grill/Build workspaces over the lobby.

The order ticket remains accessible during later stations in a compact form.

## 2. Prep Station

Purpose: ingredient preparation before cooking/building.

Interactions are recipe-specific and hands-on: cutting, portioning, opening, mixing, seasoning, or
other authored prep actions. For the current burger/hot-dog slice, the architecture may keep prep
simple while the station art/input assets are authored, but new recipes should not reduce Prep to a
single generic “prepare” button.

## 3. Grill Station

Purpose: manipulate cooking food directly.

Target interaction model:

- drag a cookable item onto an available grill slot;
- cooking advances while it occupies that slot;
- visual state changes raw → cooked → perfect → burned;
- authored recipes may require a flip/stir/cut action;
- drag the item off the grill when satisfied;
- multiple grill slots are supported by the architecture even if Shift 1 begins with one active item.

The authoritative timing/state remains renderer-independent. Phaser maps pointer/touch gestures to
domain commands and renders approved station/cook-state artwork.

## 4. Build Station

Build is spatial, not boolean.

Each placed component records at minimum:

- ingredient ID;
- normalized X/Y on the canonical work surface;
- placement sequence;
- rotation when the recipe permits it;
- authored display scale.

Repeated toppings can be placed as individual pieces. Sauces are continuous pointer/touch strokes.
The player can intentionally build a neat centered dish or a visibly crooked one.

The final gameplay dish is rendered from the actual assembly state. A pre-rendered finished burger
or hot-dog PNG is not used as the authoritative Build Station result.

Finished-food PNGs remain useful for:

- collection/discovery screens;
- compact result thumbnails;
- menus/store/promotional art;
- accessibility/fallback representations where explicitly designed.

## Spatial evaluation

Spatial assembly quality is separate from ingredient correctness.

Potential ORDER components include:

- required ingredient presence;
- forbidden/extra ingredient mistakes;
- layer/order correctness;
- horizontal centering;
- repeated-piece distribution;
- sauce coverage/distribution;
- recipe-specific prep correctness.

`AssemblySession` stores player-authored assembly. `evaluateAssembly` exposes renderer-independent
spatial metrics. The existing production payment baselines stay unchanged until spatial metrics are
explicitly integrated into `OrderScoring` and corresponding balance tests are updated.

Bad placement does **not** create CHAOS by itself. CHAOS comes from authored experimental ingredients,
combinations, mutations, and other intentional risk systems.

## Touch input

Desktop uses direct mouse drag/drop.

On touch, the dragged visual can render slightly above the contact point so the finger does not hide
it. Domain coordinates still reflect the intended drop location. Pointer and touch use the same
semantic input actions.

Sauce input should be sampled/resampled at a controlled spacing rather than recording every browser
pointer event. This keeps save/test behavior deterministic enough across devices.

## 5. Serve / Reaction

The player returns to the customer-facing space. The served dish is the FoodInstance produced by
Prep/Grill/Build.

Sequence:

```text
serve → anticipation → taste/reaction → optional transformation → scoring/payment → leave
```

Transformations remain deterministic data-driven resolver results. Presentation may swap to a full
transformed character sprite or approved modular overlays; broken/misaligned overlays must not be
forced into production.

## 6. Results

Results are a separate summary state, not a layer competing with an active workstation.

Show ORDER / COOK / CHAOS, earned coins/tip, discoveries, and shift progress using production UI.

## Screen composition rule

Order/Serve can share restaurant/customer artwork. Prep/Grill/Build require dedicated station
compositions. A station screen must not be implemented as “restaurant background + huge station PNG
in the center”.

Each screen should read immediately at mobile scale:

- one dominant work area;
- compact order reference;
- clear station navigation;
- no unrelated customer/prop overlap;
- comfortable touch targets;
- no stretched low-resolution artwork.

## Current migration status

The codebase still contains a legacy vertical-slice path where base ingredients are selected and a
finished-food asset is assigned during `assemble()`. That path exists to preserve the tested first
shift while the hands-on station implementation and required art are built.

New work must not deepen that legacy path. Migration sequence:

1. spatial assembly domain and authored recipe contracts;
2. dedicated station asset contracts;
3. Build Station direct-manipulation presenter;
4. hands-on Grill placement/removal;
5. scoring integration;
6. retire legacy automatic `assembleFood()` gameplay usage.
