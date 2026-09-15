import type { RecipeDefinition } from '../../game/recipes/RecipeDefinition';
import { GRILL_TIMING } from '../../game/cooking/GrillSession';

const BURGER_GRILL_ASSETS = {
  raw: 'food.burger.patty.raw',
  cooked: 'food.burger.patty.cooked',
  perfect: 'food.burger.patty.perfect',
  burned: 'food.burger.patty.burned',
} as const;

export const HOT_CHEESE_BURGER: RecipeDefinition = {
  id: 'recipe.hot-cheese-burger',
  displayNameKey: 'order.hot-cheese-burger',
  baseIngredientIds: [
    'ingredient.bun-bottom',
    'ingredient.patty',
    'ingredient.cheese',
    'ingredient.sauce',
    'ingredient.bun-top',
  ],
  availableIngredientIds: [
    'ingredient.bun-bottom',
    'ingredient.patty',
    'ingredient.cheese',
    'ingredient.sauce',
    'ingredient.extra-spicy',
    'ingredient.bun-top',
  ],
  ingredientOrder: [
    'ingredient.bun-bottom',
    'ingredient.patty',
    'ingredient.cheese',
    'ingredient.sauce',
    'ingredient.extra-spicy',
    'ingredient.bun-top',
  ],
  requiredPrepIngredientIds: ['ingredient.patty'],
  grillIngredientId: 'ingredient.patty',
  baseAssembledAssetKey: 'food.burger.finished',
  assembly: {
    id: 'assembly.hot-cheese-burger',
    workspaceAspectRatio: 1.35,
    rules: [
      { ingredientId: 'ingredient.bun-bottom', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, horizontalTolerance: 0.07 },
      { ingredientId: 'ingredient.patty', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, horizontalTolerance: 0.08 },
      { ingredientId: 'ingredient.cheese', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, horizontalTolerance: 0.09, allowRotation: true },
      { ingredientId: 'ingredient.sauce', mode: 'sauce', minCount: 1, maxCount: 3, targetX: 0.5, horizontalTolerance: 0.12, targetSpread: 0.48 },
      { ingredientId: 'ingredient.extra-spicy', mode: 'piece', minCount: 0, maxCount: 5, targetX: 0.5, horizontalTolerance: 0.12, targetSpread: 0.42, allowRotation: true, placementScale: 0.82 },
      { ingredientId: 'ingredient.bun-top', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, horizontalTolerance: 0.07, allowRotation: true },
    ],
  },
  compatibleCustomerTypes: ['business-cat'],
  grillTiming: GRILL_TIMING,
  grillAssetKeys: BURGER_GRILL_ASSETS,
};
