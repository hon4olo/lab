import type { FoodInstance } from '../cooking/FoodInstance';

export interface AssemblyResult {
  readonly food: FoodInstance;
  readonly orderedLayers: readonly string[];
}

export function assembleFood(
  food: FoodInstance,
  expectedIngredientOrder: readonly string[],
  assembledAssetKey: string,
): AssemblyResult {
  const selected = new Set(food.ingredients);
  const orderedLayers = expectedIngredientOrder.filter((ingredientId) => selected.has(ingredientId));
  return {
    food: { ...food, ingredientOrder: orderedLayers, visualVariant: assembledAssetKey },
    orderedLayers,
  };
}
