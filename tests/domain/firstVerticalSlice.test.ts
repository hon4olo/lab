import { describe, expect, it } from 'vitest';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import type { FoodInstance } from '../../src/game/cooking/FoodInstance';
import { GRILL_TIMING } from '../../src/game/cooking/GrillSession';
import type { CustomerInstance } from '../../src/game/customers/CustomerInstance';
import { calculatePayment } from '../../src/game/economy/PaymentCalculator';
import { EconomySession } from '../../src/game/economy/EconomySession';
import { scoreOrder } from '../../src/game/scoring/OrderScoring';
import { resolveTransformation } from '../../src/game/transformations/resolveTransformation';
import { OrderSession } from '../../src/game/orders/OrderSession';
import { createProgressionContext } from '../../src/game/progression/ProgressionContext';

const businessCat: CustomerInstance = {
  id: 'customer.business-cat.test',
  type: 'business-cat',
  variantId: 'customer.business-cat.neutral',
  patienceMs: 120_000,
};

describe('Snack Lab first order vertical slice domain', () => {
  it('completes a perfect extra-spicy burger and transforms Business Cat', () => {
    const session = createSession();
    prepareOrder(session);
    session.startGrill();
    session.advanceGrill(GRILL_TIMING.idealStopAtMs);
    expect(session.stopGrill()).toMatchObject({ state: 'perfect', quality: 100 });
    session.assemble();
    expect(session.snapshot().phase).toBe('modifier-selection');
    session.addModifier('ingredient.extra-spicy');
    session.serve();
    session.resolveReaction();

    expect(session.snapshot()).toMatchObject({
      phase: 'payment',
      scores: { order: 100, cook: 100, chaos: 140 },
      transformationResult: { id: 'transformation.business-cat.flaming' },
      payment: { total: 55 },
    });
    expect(session.snapshot().food?.tags).toEqual(expect.arrayContaining(['HOT', 'FIRE', 'CAT']));
    expect(session.snapshot()).not.toHaveProperty('coins');
    const economy = new EconomySession(20);
    expect(economy.applyPayment(session.snapshot().payment!)).toBe(true);
    expect(economy.snapshot()).toMatchObject({ persistentCoins: 20, sessionCoins: 55, coins: 75 });
  });

  it('records a burned patty in the FoodInstance when cooking is left too long', () => {
    const session = createSession();
    prepareOrder(session);
    session.startGrill();
    session.advanceGrill(GRILL_TIMING.burnedAtMs);
    expect(session.stopGrill()).toMatchObject({ state: 'burned', quality: 0 });
    expect(session.snapshot().food?.cookStates[0]).toMatchObject({ burned: true, heat: 0 });
  });

  it('penalizes an order with a missing ingredient', () => {
    const selected = HOT_CHEESE_BURGER_EXTRA_SPICY.requiredIngredientIds.filter(
      (id) => id !== 'ingredient.sauce',
    );
    const food = createFood(selected, 100, 70);
    const score = scoreOrder({
      order: HOT_CHEESE_BURGER_EXTRA_SPICY,
      selectedIngredients: selected,
      preparedIngredients: ['ingredient.patty'],
      assembled: true,
      food,
    });
    expect(score.order).toBe(82);
  });

  it('resolves the same Flaming Business Cat definition on repeated runs', () => {
    const food = createFood(HOT_CHEESE_BURGER_EXTRA_SPICY.requiredIngredientIds, 100, 70);
    const first = resolveTransformation(food, businessCat, { unlockedIds: new Set() }, TRANSFORMATIONS);
    const second = resolveTransformation(food, businessCat, { unlockedIds: new Set() }, [...TRANSFORMATIONS].reverse());
    expect(first?.id).toBe('transformation.business-cat.flaming');
    expect(second?.id).toBe(first?.id);
  });

  it('calculates ORDER, COOK, and CHAOS scores from food and requirements', () => {
    const selected = HOT_CHEESE_BURGER_EXTRA_SPICY.requiredIngredientIds;
    const result = scoreOrder({
      order: HOT_CHEESE_BURGER_EXTRA_SPICY,
      selectedIngredients: selected,
      preparedIngredients: ['ingredient.patty'],
      assembled: true,
      food: createFood(selected, 100, 70),
    });
    expect(result).toEqual({ order: 100, cook: 100, chaos: 140 });
  });

  it('calculates base pay, quality, chaos, transformation reward, and tip', () => {
    const payment = calculatePayment({
      basePayment: 24,
      baseTip: 10,
      score: { order: 100, cook: 100, chaos: 140 },
      transformationRewardModifier: 1.25,
    });
    expect(payment).toEqual({
      base: 24,
      qualityBonus: 9,
      chaosBonus: 3,
      transformationMultiplier: 9,
      tip: 10,
      total: 55,
    });
  });

  it('passes injected unlocks through OrderSession into transformation resolution', () => {
    const gatedTransformations = TRANSFORMATIONS.map((definition) => ({
      ...definition,
      requiredUnlocks: ['unlock.flame-reaction'],
    }));
    const session = createSession(['unlock.flame-reaction'], gatedTransformations);
    prepareOrder(session);
    session.startGrill();
    session.advanceGrill(GRILL_TIMING.idealStopAtMs);
    session.stopGrill();
    session.assemble();
    session.addModifier('ingredient.extra-spicy');
    session.serve();
    session.resolveReaction();
    expect(session.snapshot().transformationResult?.id).toBe('transformation.business-cat.flaming');
  });

  it('pauses and resumes patience without failing an order when the timer expires', () => {
    const session = createSession();
    session.customerEntered();
    session.pausePatience();
    expect(session.advancePatience(30_000)).toMatchObject({ remainingMs: 120_000, paused: true });
    session.resumePatience();
    expect(session.advancePatience(120_000)).toMatchObject({ remainingMs: 0, expired: true, paused: false });
    expect(session.snapshot().phase).toBe('ingredient-selection');

    expect(() => session.toggleIngredient('ingredient.bun-bottom')).not.toThrow();
    expect(session.snapshot().phase).toBe('ingredient-selection');
  });
});

function createSession(
  unlockedIds: readonly string[] = [],
  transformations = TRANSFORMATIONS,
): OrderSession {
  return new OrderSession(
    HOT_CHEESE_BURGER_EXTRA_SPICY,
    businessCat,
    HOT_CHEESE_BURGER_INGREDIENTS,
    transformations,
    {
      transactionId: 'test.shift.order-01',
      progression: createProgressionContext(unlockedIds),
      balance: {
        missingIngredientPenalty: 18,
        extraIngredientPenalty: 6,
        unpreparedIngredientPenalty: 10,
        unassembledPenalty: 20,
        qualityBonusScale: 500,
        chaosBonusScale: 1000,
        chaosBonusCap: 200,
        tipScale: 200,
      },
    },
  );
}

function prepareOrder(session: OrderSession): void {
  session.customerEntered();
  for (const ingredientId of HOT_CHEESE_BURGER_EXTRA_SPICY.requiredIngredientIds
    .filter((id) => id !== 'ingredient.extra-spicy')) {
    session.toggleIngredient(ingredientId);
  }
  session.openPrepBoard();
  session.prepareIngredient('ingredient.patty');
  session.continueToGrill();
}

function createFood(
  ingredients: readonly string[],
  quality: number,
  chaosScore: number,
): FoodInstance {
  return {
    id: 'food.test',
    ingredients,
    ingredientOrder: ingredients,
    cookStates: [],
    stationHistory: [],
    quality,
    tags: new Set(['HOT', 'FIRE', 'CAT']),
    chaosScore,
    mistakes: [],
    visualVariant: 'food.burger.extra-spicy',
  };
}
