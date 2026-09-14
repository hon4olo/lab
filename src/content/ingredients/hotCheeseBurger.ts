import type { IngredientDefinition } from '../../game/ingredients/IngredientDefinition';
import type { GameplayTag } from '../../game/ingredients/GameplayTag';

export const HOT_CHEESE_BURGER_INGREDIENTS: readonly IngredientDefinition[] = [
  ingredient('ingredient.bun-bottom', 'common', 'food.burger.bottom-bun'),
  { ...ingredient('ingredient.patty', 'common', 'food.burger.patty.raw'), requiresPrep: true },
  ingredient('ingredient.cheese', 'common', 'food.burger.cheese'),
  ingredient('ingredient.sauce', 'common', 'food.burger.sauce'),
  {
    ...ingredient('ingredient.extra-spicy', 'uncommon', 'food.burger.chili', ['HOT', 'FIRE'], 70),
    requiresPrep: false,
  },
  ingredient('ingredient.bun-top', 'common', 'food.burger.top-bun'),
];

function ingredient(
  id: string,
  rarity: 'common' | 'uncommon',
  assetKey: string,
  tags: readonly GameplayTag[] = [],
  chaosContribution = 0,
): IngredientDefinition {
  const name = id.replace('ingredient.', 'ingredient.');
  return {
    id,
    category: id.endsWith('patty') ? 'protein' : id.includes('bun') ? 'bread' : 'topping',
    displayNameKey: name,
    assetKey,
    tags,
    basePrice: rarity === 'common' ? 2 : 4,
    rarity,
    cookingBehaviors: id.endsWith('patty') ? ['grill'] : [],
    visualProperties: {},
    chaosContribution,
    requiresPrep: false,
  };
}
