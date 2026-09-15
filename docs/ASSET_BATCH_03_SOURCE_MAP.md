# Snack Lab Asset Batch 03 — Production Source Map

**Status:** production-approved and runtime-enabled on 2026-09-15.

Batch 03 closes the dedicated-art gate for the hands-on Order → Prep → Grill → Build → Serve presentation. The assets below are stored in `public/assets`, registered in `public/assets/manifest.json`, and validated by the exact-dimension/alpha verifier plus the full unit/build/browser suite.

## Dedicated station environments

| Runtime ID | Repository path | Source task | QA |
| --- | --- | --- | --- |
| `background.street-snack-bar.order` | `assets/backgrounds/street-snack-bar-order.png` | `a01ed72d-bc10-476e-9f99-ef4cace77bdc` | approved |
| `station.street.prep.background` | `assets/stations/street/prep-background.png` | `1fab977b-2b24-4ac6-a4dc-ed97b31a7b8e` | approved |
| `station.street.grill.background` | `assets/stations/street/grill-background.png` | `637144fd-88bb-40f7-94f6-5cac0b8efdb1` | approved |
| `station.street.build.background` | `assets/stations/street/build-background.png` | `d9addced-6283-44d2-b281-47c9281ffb13` | approved |

All four are standalone 2048×1152 opaque backgrounds with no baked HUD, labels, characters, or completed food.

## Character transformation

`customer.business-cat.flaming.full` uses source generation `16887638-8235-4006-8664-0193d4e392f1` and transparent cutout task `f89d47d8-6d77-4d8e-aa2d-29b697f59223`. Runtime transformation `transformation.business-cat.flaming` now uses this 1024×1024 full replacement sprite in `appearanceMode: 'full'`; the legacy modular mutation pieces remain in the registry but are no longer composed for this result.

## Hands-on tools and Build pieces

- Prep knife: cutout `88ff8834-e09d-4a91-a8f4-228c3487102c`.
- Grill spatula: cutout `eaa1b295-6305-49db-b162-e027b70b86a7`.
- Burger patty / cheese / top bun: cutouts `5ead3c32-9bd9-42f1-aee8-1ce16dda85e0`, `013b2879-68a9-4862-a080-e1aeee7c9620`, `71346fa4-e2a4-4d5f-8730-b53e9aabe12a`.
- Burger bottom bun reuses the already approved `food.burger.bottom-bun` art, repacked to the spatial Build canvas.
- Chili piece: cutout `a435b4b1-1a05-424a-881e-b9a7f61a2cb7`.
- Hot-dog bun / sausage / cheese reuse approved Batch 02 art, repacked for spatial Build.
- Pickle piece: cutout `b84f6412-2db4-498f-83d4-41d5c3dd2027`.
- Sauce bottle cutouts: red `90172ecf-d59f-4cb7-8aaf-9140d508aa0b`, mustard `5b440b7f-6e1a-4cdf-a712-6124e060da96`, glow `5e5ff62e-c044-481e-b25f-2c16019dbdd3`.
- Sauce stamp cutouts: red `f62ac92f-9159-48f0-9095-db84336ef6d1`, mustard `8fe0c521-32ab-4a91-ba64-f7ba6400bbc8`, glow `0152b076-8e3b-498e-a1b9-e31194868b4e`.

Every transparent runtime asset is normalized to its exact manifest canvas and retains a fully transparent outer border.

## Runtime gate

`StationAssetContract` already defines the Batch 03 stable IDs. Once this manifest is loaded, `canEnableHandsOnStations(...)` resolves true for the burger and hot-dog station groups, so the dedicated station presentation activates without a separate feature flag.
