import type { RecipeDefinition } from '../../game/recipes/RecipeDefinition';

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
};
