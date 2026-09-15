import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import { GRILL_TIMING } from '../../game/cooking/GrillSession';

const BURGER_GRILL_ASSETS = {
  raw: 'food.burger.patty.raw',
  cooked: 'food.burger.patty.cooked',
  perfect: 'food.burger.patty.perfect',
  burned: 'food.burger.patty.burned',
} as const;

export const HOT_CHEESE_BURGER_EXTRA_SPICY: OrderDefinition = {
  id: 'order.hot-cheese-burger.extra-spicy',
  foodInstanceId: 'food.hot-cheese-burger.order-01',
  displayNameKey: 'order.hot-cheese-burger',
  modifierKey: 'order.extra-spicy',
  modifierIngredientId: 'ingredient.extra-spicy',
  reactionSequence: 'reaction.flaming',
  grillIngredientId: 'ingredient.patty',
  recipeId: 'recipe.hot-cheese-burger',
  requiredIngredientIds: [
    'ingredient.bun-bottom',
    'ingredient.patty',
    'ingredient.cheese',
    'ingredient.sauce',
    'ingredient.extra-spicy',
    'ingredient.bun-top',
  ],
  expectedIngredientOrder: [
    'ingredient.bun-bottom',
    'ingredient.patty',
    'ingredient.cheese',
    'ingredient.sauce',
    'ingredient.extra-spicy',
    'ingredient.bun-top',
  ],
  requiredPrepIngredientIds: ['ingredient.patty'],
  requiredStations: ['station.prep-board.street', 'station.grill.street'],
  requiredTags: ['HOT', 'FIRE'],
  chaosTarget: 50,
  basePayment: 24,
  baseTip: 10,
  baseAssembledAssetKey: 'food.burger.finished',
  assembledAssetKey: 'food.burger.extra-spicy',
  grillTiming: GRILL_TIMING,
  grillAssetKeys: BURGER_GRILL_ASSETS,
};
