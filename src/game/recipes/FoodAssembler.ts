import type { FoodAssemblySnapshot } from '../assembly/AssemblySession';
import type { FoodInstance } from '../cooking/FoodInstance';

export interface AssemblyResult {
  readonly food: FoodInstance;
  readonly orderedLayers: readonly string[];
}

/**
 * Legacy deterministic assembler kept while the active first shift migrates to
 * hands-on placement. New Build Station work should use applySpatialAssembly().
 */
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

/**
 * Stores the player's actual spatial build. The final gameplay dish is rendered
 * from these events; a finished-food PNG is not the authoritative assembly.
 */
export function applySpatialAssembly(
  food: FoodInstance,
  assembly: FoodAssemblySnapshot,
  resultAssetKey = food.visualVariant,
): AssemblyResult {
  const events = [
    ...assembly.placements.map((placement) => ({
      ingredientId: placement.ingredientId,
      sequence: placement.sequence,
    })),
    ...assembly.sauceStrokes.map((stroke) => ({
      ingredientId: stroke.ingredientId,
      sequence: stroke.sequence,
    })),
  ].sort((left, right) => left.sequence - right.sequence);
  const orderedLayers = events.map((event) => event.ingredientId);
  return {
    food: {
      ...food,
      ingredientOrder: orderedLayers,
      assembly,
      visualVariant: resultAssetKey,
    },
    orderedLayers,
  };
}
