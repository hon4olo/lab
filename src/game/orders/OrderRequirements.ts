import type {
  OrderDefinition,
  OrderModifierRequirement,
} from './OrderDefinition';

export function requiredIngredientIds(order: OrderDefinition): readonly string[] {
  return order.ingredientRequirements.requiredIngredientIds;
}

export function optionalIngredientIds(order: OrderDefinition): readonly string[] {
  return order.ingredientRequirements.optionalIngredientIds ?? [];
}

export function forbiddenIngredientIds(order: OrderDefinition): readonly string[] {
  return order.ingredientRequirements.forbiddenIngredientIds ?? [];
}

export function modifierRequirements(order: OrderDefinition): readonly OrderModifierRequirement[] {
  return order.requestedVariation?.modifiers ?? [];
}

export function modifierIngredientIds(order: OrderDefinition): readonly string[] {
  return modifierRequirements(order).map((modifier) => modifier.ingredientId);
}

export function requiredModifierIngredientIds(order: OrderDefinition): readonly string[] {
  return modifierRequirements(order)
    .filter((modifier) => modifier.required ?? false)
    .map((modifier) => modifier.ingredientId);
}

/** Ingredients that must be present for a fully correct served order. */
export function scoredRequiredIngredientIds(order: OrderDefinition): readonly string[] {
  return [...requiredIngredientIds(order), ...requiredModifierIngredientIds(order)];
}

export function optionalModifierIngredientIds(order: OrderDefinition): readonly string[] {
  return modifierRequirements(order)
    .filter((modifier) => !(modifier.required ?? false))
    .map((modifier) => modifier.ingredientId);
}

/** Ingredients the player may select during base assembly. */
export function selectableBaseIngredientIds(order: OrderDefinition): readonly string[] {
  return [...requiredIngredientIds(order), ...optionalIngredientIds(order)];
}

/** The complete runtime pool for this order, including post-assembly modifiers. */
export function resolveOrderAvailableIngredientIds(order: OrderDefinition): readonly string[] {
  return unique([
    ...selectableBaseIngredientIds(order),
    ...modifierIngredientIds(order),
  ]);
}

export function hasModifiers(order: OrderDefinition): boolean {
  return modifierRequirements(order).length > 0;
}

export function hasRequiredModifiers(order: OrderDefinition): boolean {
  return requiredModifierIngredientIds(order).length > 0;
}

export function allRequiredModifiersSelected(
  order: OrderDefinition,
  selectedIngredientIds: readonly string[],
): boolean {
  const selected = new Set(selectedIngredientIds);
  return requiredModifierIngredientIds(order).every((id) => selected.has(id));
}

export function hasAppliedVariation(
  order: OrderDefinition,
  selectedIngredientIds: readonly string[],
): boolean {
  const selected = new Set(selectedIngredientIds);
  return modifierIngredientIds(order).some((id) => selected.has(id));
}

export function orderVariationAssetKey(order: OrderDefinition): string | null {
  return order.requestedVariation?.assembledAssetKey ?? null;
}

export function orderVariationDisplayNameKey(order: OrderDefinition): string | null {
  return order.requestedVariation?.displayNameKey ?? null;
}

export function requiredPrepIngredientIds(
  order: OrderDefinition,
  recipeRequirements: readonly string[],
): readonly string[] {
  return order.requiredPrepIngredientIds ?? recipeRequirements;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
