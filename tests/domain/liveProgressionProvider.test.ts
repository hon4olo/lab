import { describe, expect, it } from 'vitest';
import { BUSINESS_CAT } from '../../src/content/customers/businessCat';
import { PICKY_PIGEON } from '../../src/content/customers/pickyPigeon';
import { CHEESY_STREET_HOT_DOG_INGREDIENTS } from '../../src/content/ingredients/cheesyStreetHotDog';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { CHEESY_STREET_HOT_DOG_ORDER, HOTDOG_GRILL_TIMING } from '../../src/content/orders/cheesyStreetHotDog';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { FIRST_SHIFT } from '../../src/content/shifts/firstShift';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import { DEFAULT_BALANCE_CONFIG } from '../../src/game/balance/BalanceConfig';
import { GRILL_TIMING } from '../../src/game/cooking/GrillSession';
import { EconomySession } from '../../src/game/economy/EconomySession';
import type { IngredientDefinition } from '../../src/game/ingredients/IngredientDefinition';
import type { OrderContent } from '../../src/game/orders/OrderContent';
import type { OrderDefinition } from '../../src/game/orders/OrderDefinition';
import { requiredIngredientIds, resolveOrderAvailableIngredientIds } from '../../src/game/orders/OrderRequirements';
import { createProgressionContext, createProgressionContextProvider } from '../../src/game/progression/ProgressionContext';
import { ShiftController } from '../../src/game/shifts/ShiftController';

describe('live progression provider', () => {
  it('gives the second order an unlock recorded after the first order settles', () => {
    const unlockedIds = new Set<string>();
    const shift = new ShiftController({
      definition: FIRST_SHIFT,
      orders: new Map([
        [HOT_CHEESE_BURGER_EXTRA_SPICY.id, content(HOT_CHEESE_BURGER_EXTRA_SPICY, HOT_CHEESE_BURGER_INGREDIENTS)],
        [CHEESY_STREET_HOT_DOG_ORDER.id, content(CHEESY_STREET_HOT_DOG_ORDER, CHEESY_STREET_HOT_DOG_INGREDIENTS)],
      ]),
      customers: new Map([
        [BUSINESS_CAT.id, BUSINESS_CAT],
        [PICKY_PIGEON.id, PICKY_PIGEON],
      ]),
      transformations: TRANSFORMATIONS.map((definition) => definition.id === 'transformation.picky-pigeon.neon'
        ? { ...definition, requiredUnlocks: ['unlock.business-cat.order-01'] }
        : definition),
      economy: new EconomySession(),
      progression: createProgressionContextProvider(() => createProgressionContext([...unlockedIds])),
      balance: DEFAULT_BALANCE_CONFIG,
    });

    shift.start();
    completeBurger(shift);
    unlockedIds.add('unlock.business-cat.order-01');
    shift.completeActiveOrder();

    expect(shift.orderContent.definition.id).toBe(CHEESY_STREET_HOT_DOG_ORDER.id);
    const pigeon = shift.orderSession;
    pigeon.customerEntered();
    for (const ingredientId of requiredIngredientIds(CHEESY_STREET_HOT_DOG_ORDER)) {
      pigeon.toggleIngredient(ingredientId);
    }
    pigeon.openPrepBoard();
    pigeon.prepareIngredient('ingredient.sausage');
    pigeon.continueToGrill();
    pigeon.startGrill();
    pigeon.advanceGrill(HOTDOG_GRILL_TIMING.idealStopAtMs);
    pigeon.stopGrill();
    pigeon.assemble();
    pigeon.addModifier('ingredient.glow-sauce');
    pigeon.serve();
    pigeon.resolveReaction();

    expect(pigeon.snapshot().transformationResult?.id).toBe('transformation.picky-pigeon.neon');
  });
});

function content(definition: OrderDefinition, ingredients: readonly IngredientDefinition[]): OrderContent {
  return {
    definition,
    availableIngredientIds: resolveOrderAvailableIngredientIds(definition),
    ingredients,
  };
}

function completeBurger(shift: ShiftController): void {
  const order = shift.orderSession;
  order.customerEntered();
  for (const ingredientId of requiredIngredientIds(HOT_CHEESE_BURGER_EXTRA_SPICY)) {
    order.toggleIngredient(ingredientId);
  }
  order.openPrepBoard();
  order.prepareIngredient('ingredient.patty');
  order.continueToGrill();
  order.startGrill();
  order.advanceGrill(GRILL_TIMING.idealStopAtMs);
  order.stopGrill();
  order.assemble();
  order.addModifier('ingredient.extra-spicy');
  order.serve();
  order.resolveReaction();
  order.beginCustomerLeaving();
  order.customerLeft();
}
