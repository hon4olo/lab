import { describe, expect, it } from 'vitest';
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
