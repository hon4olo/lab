import { describe, expect, it } from 'vitest';
import manifest from '../../public/assets/manifest.json';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import { getProductionAssets } from '../../src/assets/assetManifest';

describe('getProductionAssets', () => {
  it('returns only production-approved assets by stable manifest ID', () => {
    const assets = getProductionAssets({
      assets: [
        { id: 'food.burger.finished', path: 'assets/food/burger/finished.png', status: 'production-approved' },
        { id: 'customer.business-cat.body', path: 'assets/characters/business-cat/body.png', status: 'planned' },
      ],
    });

    expect(assets).toEqual([
      {
        id: 'food.burger.finished',
        path: 'assets/food/burger/finished.png',
        status: 'production-approved',
      },
    ]);
  });

  it('rejects duplicate manifest IDs', () => {
    expect(() =>
      getProductionAssets({
        assets: [
          { id: 'food.burger.finished', path: 'assets/food/burger/finished.png', status: 'planned' },
          { id: 'food.burger.finished', path: 'assets/food/burger/other.png', status: 'planned' },
        ],
      }),
    ).toThrow('duplicate ID');
  });

  it('rejects paths that escape the public assets folder', () => {
    expect(() =>
      getProductionAssets({
        assets: [{ id: 'unsafe', path: 'assets/../private.png', status: 'production-approved' }],
      }),
    ).toThrow('invalid public asset path');
  });
});

describe('first order content asset references', () => {
  it('references only stable production-approved manifest IDs', () => {
    const approvedIds = new Set(getProductionAssets(manifest).map((asset) => asset.id));
    const referencedIds = [
      ...HOT_CHEESE_BURGER_INGREDIENTS.map((ingredient) => ingredient.assetKey),
      HOT_CHEESE_BURGER_EXTRA_SPICY.baseAssembledAssetKey,
      HOT_CHEESE_BURGER_EXTRA_SPICY.requestedVariation?.assembledAssetKey,
      ...TRANSFORMATIONS.flatMap((transformation) => transformation.appearanceAssets),
    ];
    expect(referencedIds.filter((assetId): assetId is string => Boolean(assetId)).every((assetId) => approvedIds.has(assetId))).toBe(true);
  });
});
