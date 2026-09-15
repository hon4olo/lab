import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import { HOTDOG_GRILL_ASSETS, HOTDOG_GRILL_TIMING } from '../recipes/cheesyStreetHotDog';

export { HOTDOG_GRILL_ASSETS, HOTDOG_GRILL_TIMING } from '../recipes/cheesyStreetHotDog';

export const CHEESY_STREET_HOT_DOG_ORDER: OrderDefinition = {
  id: 'order.cheesy-street-hot-dog',
  foodInstanceId: 'food.cheesy-street-hot-dog.order-02',
  displayNameKey: 'order.cheesy-street-hot-dog',
  requestedVariation: {
    id: 'variation.cheesy-street-hot-dog.glow',
    displayNameKey: 'order.glow-sauce',
    modifiers: [{ ingredientId: 'ingredient.glow-sauce' }],
    assembledAssetKey: 'food.hotdog.finished-glow',
  },
  reactionSequence: 'reaction.picky-pigeon.skeptical',
  instructionKeys: {
    'customer-entering': 'order.phase.customer-entering.picky-pigeon',
    'ingredient-selection': 'order.phase.ingredient-selection.hot-dog',
    'prep-board': 'order.phase.prep-board.sausage',
    grilling: 'order.phase.grilling.sausage',
    assembly: 'order.phase.assembly.hot-dog',
    anticipation: 'order.phase.anticipation.picky-pigeon',
    payment: 'order.phase.payment.picky-pigeon',
    'customer-leaving': 'order.phase.customer-leaving.picky-pigeon',
  },
  actionLabelKeys: {
    'action.assemble': 'action.assemble-hot-dog',
    'action.start-grill': 'action.start-grill-sausage',
    'action.stop-grill': 'action.stop-grill-sausage',
    'action.serve': 'action.serve-picky-pigeon',
  },
  grillIngredientId: 'ingredient.sausage',
  recipeId: 'recipe.cheesy-street-hot-dog',
  ingredientRequirements: {
    requiredIngredientIds: [
      'ingredient.hotdog-bun',
      'ingredient.sausage',
      'ingredient.hotdog-cheese',
      'ingredient.pickle',
      'ingredient.mustard',
    ],
  },
  expectedIngredientOrder: [
    'ingredient.hotdog-bun',
    'ingredient.sausage',
    'ingredient.hotdog-cheese',
    'ingredient.pickle',
    'ingredient.mustard',
    'ingredient.glow-sauce',
  ],
  requiredPrepIngredientIds: ['ingredient.sausage'],
  requiredStations: ['station.prep-board.street', 'station.grill.street'],
  requiredTags: [],
  chaosTarget: 100,
  basePayment: 20,
  baseTip: 8,
  baseAssembledAssetKey: 'food.hotdog.finished',
  grillTiming: HOTDOG_GRILL_TIMING,
  grillAssetKeys: HOTDOG_GRILL_ASSETS,
};
