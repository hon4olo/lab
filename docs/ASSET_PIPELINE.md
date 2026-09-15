# Snack Lab Asset Pipeline v0.1

## Policy

Snack Lab ships an original production-quality raster art set. Player-facing gameplay does not use
SVG assets, colored rectangle substitutes, programmer-art characters, fake food icons, or assets
labelled “replace later.” Technical debug overlays and asset-free system shell UI are allowed only
when they are not presented as gameplay.

The workflow is: brief → manifest entry → approved seed/reference → coherent family production →
deterministic normalization → technical QA → native-scale/in-game review → approval. Generated
images are source material, not automatically shippable assets.

## Visual system

- 2D cartoon, bright and chunky, with strong silhouettes and expressive faces.
- Food is appetizing first and absurd second; state changes read at phone scale.
- Shapes and facial features are exaggerated, with controlled detail and visual hierarchy.
- Highest production priority: food → customer face/reaction → transformation.
- Original IP only; no copied meme, brainrot, restaurant-game, or licensed characters.
- Lighting, palette roles, outline weight, view angle, and detail density are locked after the first
  approved hero customer + hero dish + restaurant-background style board.

## Formats and color

- Gameplay sprites: PNG source/working master; PNG or WebP runtime export with alpha when required.
- Opaque backgrounds: WebP by default after visual comparison; PNG when lossless edges demand it.
- Sprite sheets only for actions that benefit from frame animation; otherwise layered sprites and
  tweens are preferred.
- sRGB color, premultiplied-alpha behavior checked in Phaser/WebGL, no clipped transparent fringe.
- Simple functional UI symbols may be code-native; raster ornament follows the same manifest.
- Localized words are not baked into raster images unless a documented exception is approved.

## Naming and folders

Stable asset ID:

```text
<family>.<subject>.<variant>.<state>[.<resolution>]
customer.kid-01.base.idle
food.street-burger.classic.assembled
station.grill.street.level-01
fx.transformation.fire-cat.burst
ui.frame.order.street.default
```

Runtime paths:

```text
public/assets/source-records/     prompts, references, provenance metadata
public/assets/characters/
public/assets/food/
public/assets/stations/
public/assets/backgrounds/
public/assets/ui/
public/assets/effects/
public/assets/audio/
public/assets/atlases/
```

Filenames use lowercase kebab-case. Code/content uses manifest IDs, not paths. Source masters may
live outside the runtime bundle but their provenance record remains linked from the manifest.

## Resolution and framing

Dimensions are approved per family after the first in-context target. Each manifest item records:

- exact pixel dimensions and intended on-screen size range;
- alpha/opaque requirement;
- view/facing, crop bounds, safe padding, pivot/anchor, and baseline;
- animation frame count/order and playback role;
- filtering, mipmaps, compression, and atlas group;
- intended scene/chapter and mobile readability notes.

Characters use a shared canvas and bottom-center baseline per rig family. Modular layers preserve
head/body/hand attachment points. Food uses consistent plate/work-surface perspective. Backgrounds
reserve low-detail contrast zones for station interactions and UI.

Do not assume “2× retina” universally. Author enough source resolution for the largest intended
render size, cap runtime device pixel ratio, and validate memory/texture upload cost on mobile.

## Manifest and provenance

`public/assets/manifest.json` is the structured runtime/production manifest. Every entry includes:

- stable ID, family, role, runtime path, status, scene/chapter;
- technical dimensions, alpha, crop, anchor, frames, filtering, and atlas group;
- source prompt/reference/tool, creator/date, license/rights, and edit history;
- visual locks and mobile notes;
- native-scale, alpha/crop, animation, atlas, and in-engine verification flags.

Allowed statuses: `planned`, `seed-review`, `source-approved`, `normalized`, `integrated`,
`production-approved`, `rejected`. Only `production-approved` assets may be relied on as final art.
The manifest contains batch plans and import records. The runtime shell loads only
`production-approved` entries, so unreviewed source art is not presented as gameplay art.

Batch 02 is recorded in `ASSET_BATCH_02.md`. Its 24 Picky Pigeon, hot-dog, and neon-effect PNGs
were imported at their manifest-defined paths after contact-sheet and in-engine dark/light review;
the archive QA sheets and notes remain outside the runtime asset tree.

## Generation and normalization

When a new player-visible asset is in scope, use the project `create-game-assets` workflow and an
available image-generation/editing capability. Prompt records must define gameplay role, subject,
view, art direction, game-scale readability, exact output constraints, identity locks, and explicit
exclusions. Related assets use an approved reference seed to prevent drift.

After generation/source authoring:

1. inspect at full and native gameplay scale;
2. remove background contamination and verify real alpha;
3. normalize canvas, crop, baseline, pivot, and layer attachment points;
4. verify animation identity/volume and build a contact sheet;
5. test compression and texture bleeding;
6. import through stable manifest keys;
7. review in actual portrait and desktop compositions;
8. record provenance and approval.

## Atlas strategy

Atlas by coherent load/unload lifetime and render adjacency—not by arbitrary maximum packing.
Likely groups are chapter environment, shared UI, one character rig family, station family, and
transformation effects family. Keep large backgrounds and independently streamed content separate.
Measure draw calls, memory, and update churn before changing atlas policy.

## Acceptance gates

- **Cohesion:** palette, lighting, outline, proportions, and perspective match the approved family.
- **Readability:** silhouette, face, food state, and interaction target read at minimum mobile size.
- **Technical:** exact dimensions, clean alpha/crop, stable anchors, no clipping, correct color and
  compression, no accidental text/signatures.
- **Animation:** no identity drift, baseline hopping, hand/attachment mismatch, or unstable volume.
- **Performance:** texture size and atlas use fit the measured milestone budget.
- **Rights:** source/tool/license and restrictions are recorded and commercially compatible.
- **Context:** reviewed in Phaser at portrait and desktop layouts, not only on a contact sheet.
