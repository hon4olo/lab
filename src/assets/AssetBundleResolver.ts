import type { CustomerDefinition } from '../game/customers/CustomerDefinition';
import type { OrderContent } from '../game/orders/OrderContent';
import type { ShiftDefinition } from '../game/shifts/ShiftDefinition';
import type { TransformationDefinition } from '../game/transformations/TransformationDefinition';
import type { ProductionAsset } from './assetManifest';

/** Assets used by the shared street-snack-bar presentation, independent of an authored order. */
export const FIRST_SHIFT_SHARED_ASSET_IDS = [
  'background.street-snack-bar',
  'environment.service-counter.street',
  'station.prep-board.street',
  'station.grill.street',
  'ui.order-bubble.street',
  'ui.ingredient-slot',
  'ui.coin-icon',
  'ui.result-card.compact',
  'ui.patience-indicator',
  'fx.sparkle.small',
  'fx.smoke.small',
  'fx.grill-steam',
  'fx.transformation-flash',
  'fx.coin-sparkle',
] as const;

export interface AssetBundle {
  readonly id: string;
  readonly assets: readonly ProductionAsset[];
}

/**
 * Runtime content reads are deliberately narrow: manifest validation owns the
 * complete registry gate, while this seam resolves the active shift's texture
 * contract from its already-resolved order content.
 */
export interface ShiftAssetContent {
  getOrderContent(id: string): OrderContent;
  getCustomerDefinition(id: string): CustomerDefinition;
  readonly transformations: readonly TransformationDefinition[];
}

/**
 * Resolves the retained texture bundle for one authored shift. Content validation remains a
 * separate full-registry gate; this only determines what the current playable shift needs.
 */
export function resolveShiftAssetBundle(
  productionAssets: readonly ProductionAsset[],
  content: ShiftAssetContent,
  shift: ShiftDefinition,
): AssetBundle {
  const requiredIds = new Set<string>(FIRST_SHIFT_SHARED_ASSET_IDS);
  const customerTypes = new Set<string>();

  for (const slot of shift.orderSequence) {
    const orderContent = content.getOrderContent(slot.orderId);
    const customer = content.getCustomerDefinition(slot.customerId);
    const order = orderContent.definition;
    customerTypes.add(customer.type);
    addAll(requiredIds, customer.appearanceAssets);
    addAll(requiredIds, Object.values(customer.reactionAssets ?? {}));
    addAll(requiredIds, order.grillAssetKeys ? Object.values(order.grillAssetKeys) : []);
    requiredIds.add(order.baseAssembledAssetKey);
    const variationAsset = order.requestedVariation?.assembledAssetKey;
    if (variationAsset) requiredIds.add(variationAsset);
    addAll(requiredIds, orderContent.ingredients.map((ingredient) => ingredient.assetKey));
  }

  for (const transformation of content.transformations) {
    if (transformation.compatibleCustomerTypes.length > 0 &&
        !transformation.compatibleCustomerTypes.some((type) => customerTypes.has(type))) {
      continue;
    }
    addAll(requiredIds, transformation.appearanceAssets);
    addAll(requiredIds, transformation.effectAssets ?? []);
  }

  const byId = new Map(productionAssets.map((asset) => [asset.id, asset]));
  const missing = [...requiredIds].filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new Error(`Shift ${shift.id} requires unavailable production assets: ${missing.join(', ')}.`);
  }

  return {
    id: `shift:${shift.id}`,
    assets: productionAssets.filter((asset) => requiredIds.has(asset.id)),
  };
}

function addAll(target: Set<string>, values: readonly string[]): void {
  for (const value of values) target.add(value);
}
