export interface RecipeDefinition {
  readonly id: string;
  readonly displayNameKey: string;
  readonly ingredientIds: readonly string[];
  readonly ingredientOrder: readonly string[];
  readonly requiredPrepIngredientIds: readonly string[];
  readonly grillIngredientId: string;
  readonly baseAssembledAssetKey: string;
  /** Empty or omitted means the recipe is available to any customer type. */
  readonly compatibleCustomerTypes?: readonly string[];
}
