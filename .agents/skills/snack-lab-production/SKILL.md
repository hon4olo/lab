---
name: snack-lab-production
description: >
  Project-specific production workflow for Snack Lab. Use for substantial gameplay, station,
  presentation, content, asset, save, or release work in this repository. Enforces the separate
  station flow, hands-on food preparation, no-placeholder rule, domain/Phaser ownership, visual QA,
  and stable Git checkpoints.
---

# Snack Lab Production

Use this skill for work in this repository after reading `AGENTS.md` and the smallest relevant
project documentation.

## Product invariant

Snack Lab is a production browser cooking game built around **hands-on workstations**:

`Order → Prep → Grill → Build → Serve / Reaction → Results`

This is a structural interaction pattern, not permission to copy another game's IP, art, exact UI,
characters, wording, or screen composition.

## Hands-on food rule

Do not implement food as a list of clicked ingredients followed by a magic assembled sprite.

The player must perform the preparation:

- drag/place pieces on the work surface;
- retain placement order and normalized position;
- support authored rotation where useful;
- distribute repeated toppings as individual pieces when art/content supports it;
- apply sauce as pointer/touch strokes;
- place/remove cooked food on station surfaces;
- serve the actual assembled FoodInstance.

The authoritative build is domain data (`AssemblySession` / `FoodAssemblySnapshot`), never a Phaser
sprite or a finished-food PNG.

## Station presentation rule

Treat each station as a separate visual workspace. Order/Serve may share a customer-counter scene,
but Prep, Grill, and Build need dedicated compositions and production station artwork.

Do not place a giant station sprite over the lobby and call it a separate station.
Do not keep the customer visible behind preparation screens unless the approved design explicitly
requires it.

## Missing artwork

Never invent a player-visible placeholder.

When art is missing:

1. define the stable asset IDs and exact asset contract;
2. implement renderer-independent logic and tests;
3. prepare a presenter/interface that requires the real asset;
4. keep the new visual path disabled until manifest-approved production art exists.

Finished-food renders are allowed for results, collection, menus, or promotional use. During Build
Station gameplay, render the spatial component stack instead.

## Architecture

- Plain TypeScript owns authoritative state and deterministic rules.
- Phaser owns pointer/touch input mapping, rendering, tweens, effects, audio, and responsive layout.
- `OrderScene` coordinates; it must not become the domain model.
- Campaign/shift/economy/save ownership remains outside individual station presenters.
- Stable content/asset IDs are save-compatible contracts.
- Keep runtime files normally under ~300 lines.

## Spatial assembly workflow

When implementing Build Station work:

1. Author `RecipeDefinition.assembly` rules.
2. Record normalized 0..1 coordinates in `AssemblySession`.
3. Map viewport input to normalized workspace coordinates in presentation/input code.
4. Render layers/pieces/strokes from the assembly snapshot.
5. Evaluate spatial quality separately from ingredient presence.
6. Integrate assembly metrics into ORDER scoring only after baseline tests lock intended payouts.
7. Keep CHAOS tied to authored experimental ingredients/combinations, not bad placement.

## Interaction targets

Desktop: direct mouse drag/drop.
Touch: direct drag/drop with the visual offset above the finger when needed so the object remains
visible. Pointer and touch must feed the same semantic assembly commands.

Sauces use continuous paths. Sampling should be rate-limited/resampled so domain state is stable and
not device-frame-rate dependent.

## Required QA

For station gameplay changes:

- Vitest domain tests;
- Playwright desktop + portrait + landscape flows;
- screenshot capture at representative station states;
- no console/page/network errors;
- no document overflow;
- inspect actual screenshots for scale, overlap, clarity, and touch usability.

The minimum viewport matrix is 360×640, 844×390, 1280×720, and 1440×900.

## Checkpoint workflow

Before a large station refactor and after each stable milestone, run the relevant checks, commit,
and push when direct GitHub work is authorized. Keep `origin/main` usable and never force-push.
