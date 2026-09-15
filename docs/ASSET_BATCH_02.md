# Asset Batch 02 — Picky Pigeon and Cheesy Street Hot Dog

Batch 02 adds 24 authored PNGs to the production manifest. The archive root QA sheets and notes
remain reference material and are not copied into `public/assets/`.

## Approved production entries

All 24 entries are `production-approved` in `public/assets/manifest.json` and retain the archive
stable IDs and paths:

- `customer.picky-pigeon.body`, `.head`, `.eyes`, `.pupils`, `.mouth`, `.arms`, `.feet`, and
  `.accessories` → `assets/characters/picky-pigeon/*.png`;
- `customer.picky-pigeon.reaction.skeptical` and `.reaction.shocked` → the corresponding
  `reaction-*-head.png` files;
- `customer.picky-pigeon.mutation.neon` → `assets/characters/picky-pigeon/mutation-neon-full.png`;
- `food.hotdog.bun`, `.cheese`, `.glow-sauce`, `.mustard`, and `.pickle` →
  `assets/food/hotdog/*.png`;
- `food.hotdog.sausage.raw`, `.cooked`, `.perfect`, and `.burned` → the four authored sausage
  state PNGs;
- `food.hotdog.finished` and `.finished-glow` → the two assembled hot-dog PNGs;
- `fx.electric-sparks` and `fx.neon-burst` → `assets/effects/*.png`.

The manifest records project-owned original artwork provenance for each entry and points to the
archive `ASSET_BATCH_02_MANIFEST.json` as the import record.

## QA evidence

`npm run validate:assets` decodes all 62 manifest PNGs (Batch 01 + Batch 02), checks exact manifest
dimensions, readable image data, required alpha channels, transparent pixels, and transparent
image borders. The development Phaser Asset QA scene loads every approved ID and renders all
non-character assets on dark and light panels plus neutral Business Cat and Picky Pigeon stacks and
Picky Pigeon’s neutral, skeptical, shocked, and Neon authored variants.
The browser asset QA spec confirms the scene reaches `data-snack-lab-asset-qa-status="passed"` with
no failed requests or console/page errors.

Picky Pigeon’s eight neutral layers share a 512×512 canvas. Skeptical and shocked head swaps use
that same canvas, and the Neon Pigeon result is a single full authored appearance. Hot-dog sausage
states are mapped by the shared grill presenter; finished and Glow finished assets are selected by
the order definition. No QA sheet, README, or manifest reference file is a runtime asset.
