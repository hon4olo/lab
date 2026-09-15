import type { ProductionAsset } from '../../assets/assetManifest';

export const STREET_STATION_ASSET_IDS = {
  orderBackground: 'background.street-snack-bar.order',
  prepBackground: 'station.street.prep.background',
  grillBackground: 'station.street.grill.background',
  buildBackground: 'station.street.build.background',
  prepKnife: 'tool.prep.knife.street',
  grillSpatula: 'tool.grill.spatula.street',
  flamingBusinessCat: 'customer.business-cat.flaming.full',
} as const;

export const BURGER_BUILD_ASSET_IDS = {
  bottomBun: 'food.burger.build.bottom-bun',
  patty: 'food.burger.build.patty',
  cheese: 'food.burger.build.cheese',
  topBun: 'food.burger.build.top-bun',
  chiliPiece: 'food.burger.build.chili-piece',
  sauceBottle: 'tool.sauce.red-bottle',
  sauceStamp: 'fx.sauce.red-stamp',
} as const;

export const HOTDOG_BUILD_ASSET_IDS = {
  bun: 'food.hotdog.build.bun',
  sausage: 'food.hotdog.build.sausage',
  cheese: 'food.hotdog.build.cheese',
  picklePiece: 'food.hotdog.build.pickle-piece',
  mustardBottle: 'tool.sauce.mustard-bottle',
  mustardStamp: 'fx.sauce.mustard-stamp',
  glowBottle: 'tool.sauce.glow-bottle',
  glowStamp: 'fx.sauce.glow-stamp',
} as const;

export type StationAssetGroup = 'shared' | 'burger-build' | 'hotdog-build';

export function requiredStationAssetIds(group: StationAssetGroup): readonly string[] {
  switch (group) {
    case 'shared': return Object.values(STREET_STATION_ASSET_IDS);
    case 'burger-build': return Object.values(BURGER_BUILD_ASSET_IDS);
    case 'hotdog-build': return Object.values(HOTDOG_BUILD_ASSET_IDS);
  }
}

export function missingApprovedStationAssets(
  manifest: readonly ProductionAsset[],
  groups: readonly StationAssetGroup[],
): readonly string[] {
  const approved = new Set(
    manifest.filter((asset) => asset.status === 'production-approved').map((asset) => asset.id),
  );
  return [...new Set(groups.flatMap(requiredStationAssetIds))].filter((id) => !approved.has(id));
}

export function canEnableHandsOnStations(
  manifest: readonly ProductionAsset[],
  groups: readonly StationAssetGroup[],
): boolean {
  return missingApprovedStationAssets(manifest, groups).length === 0;
}
