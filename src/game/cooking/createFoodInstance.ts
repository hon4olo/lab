import type { GrillResult } from './GrillSession';
import type { FoodInstance, IngredientCookState, StationVisit } from './FoodInstance';
import type { GameplayTag } from '../ingredients/GameplayTag';
import type { IngredientDefinition } from '../ingredients/IngredientDefinition';

export interface FoodBuildInput {
  readonly id: string;
  readonly selectedIds: readonly string[];
  readonly preparedIds: readonly string[];
  readonly ingredients: readonly IngredientDefinition[];
  readonly grillResult?: GrillResult | null;
  readonly stationHistory?: readonly StationVisit[];
  readonly assembledAssetKey?: string;
}

export function createFoodInstance(input: FoodBuildInput): FoodInstance {
  const prepared = new Set(input.preparedIds);
  const byId = new Map(input.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const selected = input.selectedIds.map((id) => byId.get(id)).filter((item) => item !== undefined);
  const tags = new Set<GameplayTag>();
  for (const ingredient of selected) {
    if (!ingredient.requiresPrep || prepared.has(ingredient.id)) {
      for (const tag of ingredient.tags) tags.add(tag);
    }
  }

  const cookStates: IngredientCookState[] = input.grillResult
    ? [{
        ingredientId: input.grillResult.ingredientId,
        cookState: input.grillResult.state,
        heat: input.grillResult.quality / 100,
        cold: 0,
        processing: input.grillResult.elapsedMs / 1000,
        burned: input.grillResult.state === 'burned',
      }]
    : [];
  const quality = input.grillResult?.quality ?? 0;
  const chaosScore = selected.reduce(
    (total, ingredient) => total + (ingredient.requiresPrep && !prepared.has(ingredient.id)
      ? 0
      : ingredient.chaosContribution),
    0,
  );

  return {
    id: input.id,
    ingredients: [...input.selectedIds],
    ingredientOrder: [...input.selectedIds],
    cookStates,
    stationHistory: [...(input.stationHistory ?? [])],
    quality,
    tags,
    chaosScore,
    mistakes: [],
    visualVariant: input.assembledAssetKey ?? 'food.unassembled',
  };
}
