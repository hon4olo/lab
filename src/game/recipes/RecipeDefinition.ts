import type { CookState, GrillTiming } from '../cooking/GrillSession';

export interface RecipeDefinition {
  readonly id: string;
  readonly displayNameKey: string;
  /**
   * The ingredients that make up the plain, authored version of this food.
   * Orders may request a subset, removal, or an approved variation from the
   * recipe's available ingredient contract without duplicating the recipe.
   */
  readonly baseIngredientIds: readonly string[];
  /**
   * Every ingredient that this recipe can legitimately contain. This includes
   * base ingredients and any authored variation/modifier ingredients.
   */
  readonly availableIngredientIds: readonly string[];
  /** Canonical layer order for every ingredient in the available contract. */
  readonly ingredientOrder: readonly string[];
  readonly requiredPrepIngredientIds: readonly string[];
  readonly grillIngredientId: string;
  readonly baseAssembledAssetKey: string;
  /** Empty or omitted means the recipe is available to any customer type. */
  readonly compatibleCustomerTypes?: readonly string[];
  readonly grillTiming?: GrillTiming;
  readonly grillAssetKeys?: Readonly<Record<CookState, string>>;
}
