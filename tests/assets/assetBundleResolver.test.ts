import { describe, expect, it } from 'vitest';
import manifest from '../../public/assets/manifest.json';
import { createCampaignSession } from '../../src/app/createCampaignSession';
import { FIRST_CHAPTER } from '../../src/content/chapters/firstChapter';
import { SNACK_LAB_CONTENT_REGISTRIES } from '../../src/content/registries';
import { resolveShiftAssetBundle } from '../../src/assets/AssetBundleResolver';
import { getProductionAssets } from '../../src/assets/assetManifest';
import { createDefaultSaveData } from '../../src/save/SaveSchema';

describe('first-shift asset bundle', () => {
  it('retains the current shift contract, including optional modifiers and transformations', () => {
    const campaign = createCampaignSession(createDefaultSaveData(FIRST_CHAPTER.id));
    campaign.startOrRestore();
    const productionAssets = getProductionAssets(manifest);
    const bundle = resolveShiftAssetBundle(productionAssets, {
      getOrderContent: (id) => campaign.getOrderContent(id),
      getCustomerDefinition: (id) => campaign.getCustomerDefinition(id),
      transformations: SNACK_LAB_CONTENT_REGISTRIES.transformations.all,
    }, campaign.getLoadingShiftDefinition());
    const ids = new Set(bundle.assets.map((asset) => asset.id));

    expect(bundle.id).toBe('shift:shift.street-snack-bar.first');
    expect(bundle.assets.every((asset) => asset.status === 'production-approved')).toBe(true);
    expect(ids.has('food.burger.chili')).toBe(true);
    expect(ids.has('food.hotdog.glow-sauce')).toBe(true);
    expect(ids.has('food.hotdog.finished-glow')).toBe(true);
    expect(ids.has('customer.picky-pigeon.mutation.neon')).toBe(true);
    expect(ids.has('fx.electric-sparks')).toBe(true);
    expect(ids.has('fx.neon-burst')).toBe(true);
    expect(ids.has('ui.station-tab')).toBe(false);
    expect(bundle.assets).toHaveLength(productionAssets.length - 1);
  });
});
