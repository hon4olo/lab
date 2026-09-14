import { describe, expect, it } from 'vitest';
import { BUSINESS_CAT } from '../../src/content/customers/businessCat';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { FIRST_SHIFT } from '../../src/content/shifts/firstShift';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import { DEFAULT_BALANCE_CONFIG } from '../../src/game/balance/BalanceConfig';
import { GRILL_TIMING } from '../../src/game/cooking/GrillSession';
import { EconomySession } from '../../src/game/economy/EconomySession';
import type { PaymentTransaction } from '../../src/game/economy/PaymentTransaction';
import { createProgressionContext } from '../../src/game/progression/ProgressionContext';
import { ShiftController } from '../../src/game/shifts/ShiftController';
import { ShiftSession } from '../../src/game/shifts/ShiftSession';

describe('shift and economy boundaries', () => {
  it('applies order payment to external economy and completes a one-order shift', () => {
    const economy = new EconomySession(12);
    const shift = createFirstShift(economy);
    shift.start();
    const order = shift.orderSession;
    order.customerEntered();
    for (const ingredientId of HOT_CHEESE_BURGER_EXTRA_SPICY.requiredIngredientIds
      .filter((id) => id !== 'ingredient.extra-spicy')) {
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

    expect(order.snapshot().payment?.total).toBe(55);
    shift.completeActiveOrder();
    expect(shift.shiftSnapshot).toEqual({
      shiftId: FIRST_SHIFT.id,
      phase: 'completed',
      activeOrderIndex: null,
      earnings: 55,
      completedOrders: [FIRST_SHIFT.orderSequence[0]!.id],
    });
    expect(economy.snapshot()).toMatchObject({ persistentCoins: 12, sessionCoins: 55, coins: 67 });
    expect(() => shift.completeActiveOrder()).toThrow();
    expect(economy.snapshot().coins).toBe(67);
  });

  it('accumulates payments as shift earnings and rejects duplicate transactions', () => {
    const shift = new ShiftSession({
      id: 'shift.test',
      orderSequence: [
        { id: 'slot-1', orderId: 'order-1', customerId: 'customer-1', customerInstanceId: 'customer-1.a' },
        { id: 'slot-2', orderId: 'order-2', customerId: 'customer-2', customerInstanceId: 'customer-2.a' },
      ],
    });
    const first = transaction('shift.test:slot-1', 'order-1', 20);
    const second = transaction('shift.test:slot-2', 'order-2', 35);
    shift.start();
    expect(shift.completeOrder('slot-1', first)).toBe(true);
    expect(shift.completeOrder('slot-2', second)).toBe(true);
    expect(shift.snapshot()).toMatchObject({ phase: 'completed', earnings: 55, completedOrders: ['slot-1', 'slot-2'] });
  });

  it('does not award the same payment transaction twice', () => {
    const economy = new EconomySession(4);
    const payment = transaction('shift.test:slot-1', 'order-1', 55);
    expect(economy.applyPayment(payment)).toBe(true);
    expect(economy.applyPayment(payment)).toBe(false);
    expect(economy.snapshot()).toMatchObject({ persistentCoins: 4, sessionCoins: 55, coins: 59 });
  });
});

function createFirstShift(economy: EconomySession): ShiftController {
  return new ShiftController({
    definition: FIRST_SHIFT,
    orders: new Map([[HOT_CHEESE_BURGER_EXTRA_SPICY.id, {
      definition: HOT_CHEESE_BURGER_EXTRA_SPICY,
      ingredients: HOT_CHEESE_BURGER_INGREDIENTS,
    }]]),
    customers: new Map([[BUSINESS_CAT.id, BUSINESS_CAT]]),
    transformations: TRANSFORMATIONS,
    economy,
    progression: createProgressionContext(),
    balance: DEFAULT_BALANCE_CONFIG,
  });
}

function transaction(transactionId: string, orderId: string, total: number): PaymentTransaction {
  return {
    transactionId,
    orderId,
    base: total,
    qualityBonus: 0,
    chaosBonus: 0,
    transformationMultiplier: 0,
    tip: 0,
    total,
  };
}
