import { describe, expect, it } from 'vitest';
import { DEFAULT_BALANCE_CONFIG } from '../../src/game/balance/BalanceConfig';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { HOT_CHEESE_BURGER } from '../../src/content/recipes/hotCheeseBurger';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import type { CustomerInstance } from '../../src/game/customers/CustomerInstance';
import { OrderSession } from '../../src/game/orders/OrderSession';
import { resolveOrderAssemblyDefinition } from '../../src/game/orders/resolveOrderAssemblyDefinition';
import { createProgressionContext } from '../../src/game/progression/ProgressionContext';

const businessCat: CustomerInstance = {
  id: 'customer.business-cat.hands-on-acceptance-test',
  type: 'business-cat',
  variantId: 'customer.business-cat.neutral',
  patienceMs: 120_000,
};

describe('hands-on order acceptance', () => {
  it('stages only the Prep/Grill ingredient instead of pre-selecting the future burger stack', () => {
    const assembly = HOT_CHEESE_BURGER.assembly;
    if (!assembly) throw new Error('Burger recipe must define spatial assembly.');
    const session = new OrderSession(
      HOT_CHEESE_BURGER_EXTRA_SPICY,
      businessCat,
      HOT_CHEESE_BURGER_INGREDIENTS,
      TRANSFORMATIONS,
      {
        transactionId: 'test.shift.hands-on-acceptance',
        progression: createProgressionContext([]),
        balance: DEFAULT_BALANCE_CONFIG,
        assembly: resolveOrderAssemblyDefinition(HOT_CHEESE_BURGER_EXTRA_SPICY, assembly),
      },
    );

    session.customerEntered();
    expect(session.snapshot().selectedIngredients).toEqual([]);

    session.openHandsOnPrepBoard();
    expect(session.snapshot()).toMatchObject({
      phase: 'prep-board',
      selectedIngredients: ['ingredient.patty'],
    });
    expect(session.snapshot().selectedIngredients).not.toContain('ingredient.bun-bottom');
    expect(session.snapshot().selectedIngredients).not.toContain('ingredient.cheese');
    expect(session.snapshot().selectedIngredients).not.toContain('ingredient.sauce');
    expect(session.snapshot().selectedIngredients).not.toContain('ingredient.bun-top');

    expect(() => session.prepareIngredient('ingredient.patty')).not.toThrow();
    expect(session.snapshot().preparedIngredients).toContain('ingredient.patty');
  });
});
