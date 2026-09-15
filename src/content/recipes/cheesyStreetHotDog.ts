import type { CookState, GrillTiming } from '../../game/cooking/GrillSession';
import type { RecipeDefinition } from '../../game/recipes/RecipeDefinition';

export const HOTDOG_GRILL_TIMING: GrillTiming = {
  cookedAtMs: 1_000,
  perfectAtMs: 2_200,
  burnedAtMs: 5_200,
  idealStopAtMs: 3_200,
};

export const HOTDOG_GRILL_ASSETS: Readonly<Record<CookState, string>> = {
  raw: 'food.hotdog.sausage.raw',
  cooked: 'food.hotdog.sausage.cooked',
  perfect: 'food.hotdog.sausage.perfect',
  burned: 'food.hotdog.sausage.burned',
};

export const CHEESY_STREET_HOT_DOG: RecipeDefinition = {
  id: 'recipe.cheesy-street-hot-dog',
  displayNameKey: 'order.cheesy-street-hot-dog',
  ingredientIds: [
    'ingredient.hotdog-bun',
    'ingredient.sausage',
    'ingredient.hotdog-cheese',
    'ingredient.pickle',
    'ingredient.mustard',
  ],
  ingredientOrder: [
    'ingredient.hotdog-bun',
    'ingredient.sausage',
    'ingredient.hotdog-cheese',
    'ingredient.pickle',
    'ingredient.mustard',
  ],
  requiredPrepIngredientIds: ['ingredient.sausage'],
  grillIngredientId: 'ingredient.sausage',
  baseAssembledAssetKey: 'food.hotdog.finished',
  compatibleCustomerTypes: ['picky-pigeon'],
  grillTiming: HOTDOG_GRILL_TIMING,
  grillAssetKeys: HOTDOG_GRILL_ASSETS,
};
