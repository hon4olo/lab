# Snack Lab — Asset Pipeline

## Rule zero: no player-visible placeholders

Do not ship or temporarily wire player-visible programmer art to make a feature appear complete.
Forbidden substitutes include colored boxes/circles, emoji, generic SVG icons, checkerboards,
reference-sheet crops with labels, fake station backgrounds, or intentionally temporary sprites.

When production art is missing, code may define stable asset contracts and renderer-independent logic,
but the new visual path stays disabled until the required files pass manifest + in-engine QA.

## Manifest

`public/assets/manifest.json` is the stable production asset registry. Gameplay/presentation references
assets by stable ID, not arbitrary relative file paths.

Every manifest entry should record at minimum:

- stable ID;
- path;
- type/category;
- exact dimensions;
- alpha expectation;
- status (`planned` / `production-approved`);
- provenance/creator metadata as supported by schema.

Never silently rename an asset ID already used by content/saves/tests.

## Approval layers

### 1. Technical QA

- file exists and decodes;
- exact dimensions;
- expected alpha/opacity;
- transparent corners where required;
- no failed load/path mismatch;
- no baked filename/caption;
- no obvious white matte.

### 2. Visual QA

- style matches Snack Lab;
- perspective matches its station/character family;
- correct scale at gameplay size;
- no blur/upscale damage;
- clean modular alignment;
- usable negative space/crop;
- no duplicate character fragments;
- readable on light/dark backgrounds where relevant.

### 3. Gameplay QA

- asset actually works in its intended interaction;
- drag target silhouette is readable;
- station art leaves room for UI/gesture paths;
- layer anchor is stable;
- sauce/tool assets behave correctly;
- transformed character reads coherently in reaction view.

`production-approved` requires all applicable layers, not merely PNG validity.

## Station assets

The next required set is specified in `ASSET_BATCH_03_REQUIREMENTS.md`.

Dedicated station backgrounds should normally be 2048×1152 opaque and authored for their actual
camera/composition. Do not upscale small moodboard/reference crops as final station backgrounds.

Build Station interactive food sprites need consistent perspective and transparent alpha. Repeated
piece toppings should be separate piece sprites if gameplay places them individually.

Sauce interaction requires approved bottle/tool art and repeatable sauce stamp/ribbon textures. The
production game should not substitute plain geometry for final sauce visuals.

## Character assets

Prefer a coherent master identity across states. Modular layers must share a canvas/anchor when they
are intended to stack.

If a transformation is easier/safer as a full appearance swap, use one authored full transformed
sprite rather than forcing unreliable procedural overlays.

## File formats

Use PNG for transparent character/food/UI/FX where appropriate. Use WebP or PNG for opaque
backgrounds based on actual visual/size tradeoffs. Do not introduce SVG game art unless explicitly
approved for a specific UI use.

## Localization

Do not bake localizable strings into raster art. RU/EN runtime copy stays in localization dictionaries.

## Import workflow

1. Receive/generate the complete coherent batch.
2. Inspect source files before import.
3. Map each file to its stable manifest ID/path.
4. Run technical validation.
5. Run in-engine light/dark/native-scale QA.
6. Inspect actual gameplay screenshots.
7. Mark only passing files `production-approved`.
8. Run `npm run check` / relevant browser QA.
9. Commit/push stable checkpoint.

If one asset fails, keep it planned and fix that file; do not fabricate a replacement inside code.

## Batch documentation

Batch docs record import/QA history. Newer design/art documents override old batch assumptions when
the product direction changes.
