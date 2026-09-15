import type { AssemblyDefinition } from '../assembly/AssemblyDefinition';
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
  /** Canonical recipe order. Hands-on assembly may deliberately deviate from it. */
  readonly ingredientOrder: readonly string[];
  readonly requiredPrepIngredientIds: readonly string[];
  readonly grillIngredientId: string;
  readonly baseAssembledAssetKey: string;
  /**
   * Spatial assembly contract for the Build Station. Domain coordinates are
   * normalized and renderer-independent; Phaser only maps them onto a work surface.
   * This is optional while legacy recipes migrate, but new production recipes should author it.
   */
  readonly assembly?: AssemblyDefinition;
  /** Empty or omitted means the recipe is available to any customer type. */
  readonly compatibleCustomerTypes?: readonly string[];
  readonly grillTiming?: GrillTiming;
  readonly grillAssetKeys?: Readonly<Record<CookState, string>>;
}
