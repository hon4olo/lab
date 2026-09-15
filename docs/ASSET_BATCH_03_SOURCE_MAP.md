# Asset Batch 03 — Generated Source Map

This file records generation provenance only. **Nothing listed here is production-approved by default.**

A generated source becomes usable in runtime only after:

1. visual QA against `ART_DIRECTION.md` and `ASSET_PIPELINE.md`;
2. dimension / alpha / crop checks;
3. in-game composition QA at supported viewports;
4. import into the repository;
5. manifest status explicitly changed to `production-approved`.

Do not replace missing assets with programmer art, color blocks, emoji, temporary SVG, or baked text.

## Full-screen station backgrounds

| Runtime asset ID | Intended use | Generation task | Current status |
| --- | --- | --- | --- |
| `background.street-snack-bar.order` | Order + Serve customer-facing screen | `a01ed72d-bc10-476e-9f99-ef4cace77bdc` | generated; awaiting visual QA/import |
| `station.street.prep.background` | Dedicated Prep Station | `1fab977b-2b24-4ac6-a4dc-ed97b31a7b8e` | generated; awaiting visual QA/import |
| `station.street.grill.background` | Dedicated Grill Station | `637144fd-88bb-40f7-94f6-5cac0b8efdb1` | generated; awaiting visual QA/import |
| `station.street.build.background` | Dedicated Build Station | `d9addced-6283-44d2-b281-47c9281ffb13` | generated; awaiting visual QA/import |

Background acceptance rules:

- one coherent 16:9 environment, not a mockup/contact sheet;
- no player-visible text, UI, customers, food, or baked interaction props;
- genuine dedicated station composition rather than the old restaurant background with a floating station sprite;
- safe responsive crop for desktop landscape and narrow portrait;
- central work region remains readable after HUD/ticket overlays;
- source quality must remain crisp at gameplay render scale; do not approve a blurry upscale.

## Flaming Business Cat

| Runtime asset ID | Intended use | Generation task | Current status |
| --- | --- | --- | --- |
| `customer.business-cat.flaming.full` | Full-swap transformation character | `16887638-8235-4006-8664-0193d4e392f1` | generated; cutout/identity QA required |

The Flaming Business Cat must be a **single authored full-body transformed character**, not the old stack of ears/eyes/tie/fire overlays. Preserve the neutral Business Cat identity, proportions, shirt/collar and oversized plum tie. Runtime should prefer full-swap presentation once this asset passes QA.

## Build / tool cutouts

The generated Batch 03 work also includes transparent-cutout candidates for burger layers, hot-dog layers, individual chili/pickle pieces, sauce bottles/stamps, prep knife and grill spatula. Their generation/segmentation outputs remain **QA candidates** until each source is matched to its runtime ID and visually inspected.

Required runtime IDs are authoritative in `src/presentation/stations/StationAssetContract.ts`:

### Burger

- `food.burger.build.bottom-bun`
- `food.burger.build.patty`
- `food.burger.build.cheese`
- `food.burger.build.top-bun`
- `food.burger.build.chili-piece`
- `tool.sauce.red-bottle`
- `fx.sauce.red-stamp`

### Hot dog

- `food.hotdog.build.bun`
- `food.hotdog.build.sausage`
- `food.hotdog.build.cheese`
- `food.hotdog.build.pickle-piece`
- `tool.sauce.mustard-bottle`
- `fx.sauce.mustard-stamp`
- `tool.sauce.glow-bottle`
- `fx.sauce.glow-stamp`

### Station tools

- `tool.prep.knife.street`
- `tool.grill.spatula.street`

## Runtime gate

`StationAssetContract.ts` remains the source of truth for activation. The hands-on runtime must stay gated until every required asset for the relevant recipe exists as an approved texture. A missing asset is a production blocker, not permission to show a placeholder.
