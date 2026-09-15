import type { IngredientDefinition } from '../../game/ingredients/IngredientDefinition';

export const CHEESY_STREET_HOT_DOG_INGREDIENTS: readonly IngredientDefinition[] = [
  ingredient('ingredient.hotdog-bun', 'bread', 'food.hotdog.bun', 2),
  ingredient('ingredient.sausage', 'protein', 'food.hotdog.sausage.raw', 5, true),
  ingredient('ingredient.hotdog-cheese', 'topping', 'food.hotdog.cheese', 3),
  ingredient('ingredient.pickle', 'topping', 'food.hotdog.pickle', 2),
  ingredient('ingredient.mustard', 'topping', 'food.hotdog.mustard', 2),
  {
    ...ingredient('ingredient.glow-sauce', 'sauce', 'food.hotdog.glow-sauce', 5),
    tags: ['GLOW', 'ELECTRIC'],
    chaosContribution: 100,
  },
];

function ingredient(
  id: string,
  category: string,
  assetKey: string,
  basePrice: number,
  requiresPrep = false,
): IngredientDefinition {
  return {
    id,
    category,
    displayNameKey: id,
    assetKey,
    tags: [],
    basePrice,
    rarity: id === 'ingredient.glow-sauce' ? 'rare' : 'common',
    cookingBehaviors: requiresPrep ? ['grill'] : [],
    visualProperties: {},
    chaosContribution: 0,
    requiresPrep,
  };
}
