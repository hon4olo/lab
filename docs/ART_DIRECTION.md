# Snack Lab — Art Direction

## Core style

Snack Lab uses a warm illustrated 2D cartoon style:

- slightly textured, not sterile vector;
- deep plum outlines;
- teal/cream environments;
- orange/coral/yellow accents;
- large readable forms;
- expressive faces;
- appetizing food;
- polished commercial browser-game quality;
- mobile readability;
- funny rather than grotesque.

Do not copy third-party IP, characters, logos, station layouts, or branded UI.

## Station-screen composition

The game now requires dedicated visual workspaces:

- Order / Serve customer-facing environment;
- Prep close-up;
- Grill close-up;
- Build close-up;
- Results presentation.

Prep/Grill/Build must not look like the same restaurant background with a large workstation sprite
pasted over it. Each station needs a deliberate camera/composition and clear functional hierarchy.

### Composition priorities

1. one dominant work area;
2. compact readable order reference;
3. station navigation outside the main work target;
4. sufficient negative space for drag gestures;
5. no customer/prop overlap on workstations;
6. no stretched low-resolution artwork;
7. safe mobile crop at 360×640 and landscape mobile at 844×390.

## Food gameplay sprites

Hands-on Build Station ingredients need isolated gameplay variants with consistent perspective,
lighting, outline weight, and nominal scale.

The gameplay dish is assembled from components. Do not rely on a single finished-food render while
the player is building.

Repeated toppings such as chili/pickle should be authored as individual pieces if the player is
expected to distribute them separately.

Sauces need tool/bottle art plus repeatable stamp/ribbon textures for path rendering.

## Finished-food renders

Finished burger/hot-dog renders remain useful for:

- results thumbnails;
- collection/discovery;
- menus;
- marketing/store art.

They should not replace the player's actual spatial Build Station result.

## Customers

Characters must remain recognizable across neutral/reaction/transformed states. Avoid independently
regenerating every face/pose if it breaks identity consistency.

Current characters:

### Business Cat

Caramel-orange anthropomorphic cat, compact serious/self-important business look, white shirt/collar,
oversized deep-plum tie, expressive eyes.

### Picky Pigeon

Gray-blue anthropomorphic pigeon, picky/skeptical attitude, readable compact silhouette, original
Snack Lab character.

## Transformations

Transformed appearances must be coherent authored characters.

The old Flaming Business Cat Batch 01 overlays are visually invalid because they contain duplicated
head/ear/eye/tie fragments. Do not reuse them as a full transformation presentation.

Required replacement: `customer.business-cat.flaming.full`, one coherent transparent full-character
sprite. See `ASSET_BATCH_03_REQUIREMENTS.md`.

## Backgrounds

Background art must be authored at sufficient resolution for the intended crop. Upscaling a small
concept crop until it is visibly blurry is not production approval.

Station backgrounds should be 2048×1152 unless a later asset spec intentionally changes that target.
Opaque backgrounds must contain no baked labels/captions.

## Transparent assets

Transparent sprites require:

- clean alpha on both dark and light backgrounds;
- no white matte/fringe;
- no checkerboard baked into pixels;
- no reference-sheet captions;
- sufficient padding without excessive empty canvas;
- consistent anchor/perspective for modular stacks.

## UI

UI should be compact and secondary to hands-on food manipulation. Order tickets remain readable but
must not dominate Prep/Grill/Build screens. Station tabs/navigation should read instantly without
covering the workspace.

All localizable text stays live text; do not bake RU/EN copy into raster assets.

## Approval standard

Technical validity is not visual approval. An asset may be readable, correctly sized, and transparent
and still fail because of:

- wrong perspective;
- inconsistent style;
- blur/upscale damage;
- poor station composition;
- incorrect scale;
- identity drift;
- unusable layering;
- broken reaction/transformation integration.

In-engine inspection at actual gameplay scale is mandatory before `production-approved`.
