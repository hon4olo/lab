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
  baseIngredientIds: [
    'ingredient.hotdog-bun',
    'ingredient.sausage',
    'ingredient.hotdog-cheese',
    'ingredient.pickle',
    'ingredient.mustard',
  ],
  availableIngredientIds: [
    'ingredient.hotdog-bun',
    'ingredient.sausage',
    'ingredient.hotdog-cheese',
    'ingredient.pickle',
    'ingredient.mustard',
    'ingredient.glow-sauce',
  ],
  ingredientOrder: [
    'ingredient.hotdog-bun',
    'ingredient.sausage',
    'ingredient.hotdog-cheese',
    'ingredient.pickle',
    'ingredient.mustard',
    'ingredient.glow-sauce',
  ],
  requiredPrepIngredientIds: ['ingredient.sausage'],
  grillIngredientId: 'ingredient.sausage',
  baseAssembledAssetKey: 'food.hotdog.finished',
  assembly: {
    id: 'assembly.cheesy-street-hot-dog',
    workspaceAspectRatio: 1.6,
    rules: [
      { ingredientId: 'ingredient.hotdog-bun', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, horizontalTolerance: 0.08 },
      { ingredientId: 'ingredient.sausage', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, horizontalTolerance: 0.08, allowRotation: true },
      { ingredientId: 'ingredient.hotdog-cheese', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, horizontalTolerance: 0.1, allowRotation: true },
      { ingredientId: 'ingredient.pickle', mode: 'piece', minCount: 1, maxCount: 5, targetX: 0.5, horizontalTolerance: 0.14, targetSpread: 0.44, allowRotation: true, placementScale: 0.78 },
      { ingredientId: 'ingredient.mustard', mode: 'sauce', minCount: 1, maxCount: 3, targetX: 0.5, horizontalTolerance: 0.13, targetSpread: 0.56 },
      { ingredientId: 'ingredient.glow-sauce', mode: 'sauce', minCount: 0, maxCount: 3, targetX: 0.5, horizontalTolerance: 0.13, targetSpread: 0.56 },
    ],
  },
  compatibleCustomerTypes: ['picky-pigeon'],
  grillTiming: HOTDOG_GRILL_TIMING,
  grillAssetKeys: HOTDOG_GRILL_ASSETS,
};
