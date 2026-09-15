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

const ORDER_SHELL_ASSET_IDS = [STREET_STATION_ASSET_IDS.orderBackground] as const;
const PREP_SHELL_ASSET_IDS = [
  STREET_STATION_ASSET_IDS.prepBackground,
  STREET_STATION_ASSET_IDS.prepKnife,
] as const;
const GRILL_SHELL_ASSET_IDS = [
  STREET_STATION_ASSET_IDS.grillBackground,
  STREET_STATION_ASSET_IDS.grillSpatula,
] as const;
const BUILD_SHELL_ASSET_IDS = [STREET_STATION_ASSET_IDS.buildBackground] as const;
const HANDS_ON_STATION_SHELL_ASSET_IDS = [
  ...ORDER_SHELL_ASSET_IDS,
  ...PREP_SHELL_ASSET_IDS,
  ...GRILL_SHELL_ASSET_IDS,
  ...BUILD_SHELL_ASSET_IDS,
] as const;

export type StationAssetGroup =
  | 'shared'
  | 'hands-on-shell'
  | 'order-shell'
  | 'prep-shell'
  | 'grill-shell'
  | 'build-shell'
  | 'burger-build'
  | 'hotdog-build'
  | 'business-cat-transformation';

export function requiredStationAssetIds(group: StationAssetGroup): readonly string[] {
  switch (group) {
    /** Backwards-compatible Batch 03 aggregate, including transformation art. */
    case 'shared': return Object.values(STREET_STATION_ASSET_IDS);
    /** Backwards-compatible aggregate of all workstation screen/tool assets. */
    case 'hands-on-shell': return HANDS_ON_STATION_SHELL_ASSET_IDS;
    case 'order-shell': return ORDER_SHELL_ASSET_IDS;
    case 'prep-shell': return PREP_SHELL_ASSET_IDS;
    case 'grill-shell': return GRILL_SHELL_ASSET_IDS;
    case 'build-shell': return BUILD_SHELL_ASSET_IDS;
    case 'burger-build': return Object.values(BURGER_BUILD_ASSET_IDS);
    case 'hotdog-build': return Object.values(HOTDOG_BUILD_ASSET_IDS);
    case 'business-cat-transformation': return [STREET_STATION_ASSET_IDS.flamingBusinessCat];
  }
}

/** Legacy aggregate retained for validation/docs that need the complete hands-on recipe package. */
export function stationGroupsForRecipe(recipeId: string): readonly StationAssetGroup[] {
  switch (recipeId) {
    case 'recipe.hot-cheese-burger': return ['hands-on-shell', 'burger-build'];
    case 'recipe.cheesy-street-hot-dog': return ['hands-on-shell', 'hotdog-build'];
    default: return ['hands-on-shell'];
  }
}

/** Assets that must exist before the spatial Build Station can be shown for one recipe. */
export function buildStationGroupsForRecipe(recipeId: string): readonly StationAssetGroup[] {
  switch (recipeId) {
    case 'recipe.hot-cheese-burger': return ['build-shell', 'burger-build'];
    case 'recipe.cheesy-street-hot-dog': return ['build-shell', 'hotdog-build'];
    default: return ['build-shell'];
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
