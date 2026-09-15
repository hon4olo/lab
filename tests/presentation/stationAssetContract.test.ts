import { describe, expect, it } from 'vitest';
import type { ProductionAsset } from '../../src/assets/assetManifest';
import {
  buildStationGroupsForRecipe,
  BURGER_BUILD_ASSET_IDS,
  missingApprovedStationAssets,
  requiredStationAssetIds,
  STREET_STATION_ASSET_IDS,
} from '../../src/presentation/stations/StationAssetContract';

describe('station asset contracts', () => {
  it('gates burger Build only on its build background and burger manipulation assets', () => {
    expect(buildStationGroupsForRecipe('recipe.hot-cheese-burger')).toEqual([
      'build-shell',
      'burger-build',
    ]);

    const required = buildStationGroupsForRecipe('recipe.hot-cheese-burger')
      .flatMap((group) => requiredStationAssetIds(group));

    expect(required).toContain(STREET_STATION_ASSET_IDS.buildBackground);
    expect(required).toContain(BURGER_BUILD_ASSET_IDS.bottomBun);
    expect(required).not.toContain(STREET_STATION_ASSET_IDS.prepBackground);
    expect(required).not.toContain(STREET_STATION_ASSET_IDS.prepKnife);
    expect(required).not.toContain(STREET_STATION_ASSET_IDS.grillBackground);
    expect(required).not.toContain(STREET_STATION_ASSET_IDS.grillSpatula);
    expect(required).not.toContain(STREET_STATION_ASSET_IDS.orderBackground);
  });

  it('keeps the grill shell independent from Prep and Build art', () => {
    expect(requiredStationAssetIds('grill-shell')).toEqual([
      STREET_STATION_ASSET_IDS.grillBackground,
      STREET_STATION_ASSET_IDS.grillSpatula,
    ]);
  });

  it('retains the aggregate hands-on shell for full-batch validation', () => {
    expect(requiredStationAssetIds('hands-on-shell')).toEqual(expect.arrayContaining([
      STREET_STATION_ASSET_IDS.orderBackground,
      STREET_STATION_ASSET_IDS.prepBackground,
      STREET_STATION_ASSET_IDS.prepKnife,
      STREET_STATION_ASSET_IDS.grillBackground,
      STREET_STATION_ASSET_IDS.grillSpatula,
      STREET_STATION_ASSET_IDS.buildBackground,
    ]));
  });

  it('does not report unrelated Prep or Grill art missing when burger Build is complete', () => {
    const groups = buildStationGroupsForRecipe('recipe.hot-cheese-burger');
    const required = groups.flatMap((group) => requiredStationAssetIds(group));
    const manifest = required.map(approvedAsset);

    expect(missingApprovedStationAssets(manifest, groups)).toEqual([]);
  });
});

function approvedAsset(id: string): ProductionAsset {
  return {
    id,
    path: `assets/test/${id}.png`,
    status: 'production-approved',
  };
}
