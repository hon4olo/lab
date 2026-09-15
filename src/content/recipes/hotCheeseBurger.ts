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
  ingredientIds: [
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
  compatibleCustomerTypes: ['business-cat'],
  grillTiming: GRILL_TIMING,
  grillAssetKeys: BURGER_GRILL_ASSETS,
};
