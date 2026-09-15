import { describe, expect, it } from 'vitest';
import { businessCat } from '../../src/content/customers/businessCat';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import type { FoodInstance } from '../../src/game/cooking/FoodInstance';
import { OrderSession } from '../../src/game/orders/OrderSession';
import { requiredIngredientIds } from '../../src/game/orders/OrderRequirements';
import { createProgressionContext } from '../../src/game/progression/ProgressionContext';
import { resolveTransformation } from '../../src/game/transformations/resolveTransformation';

const GRILL_TIMING = HOT_CHEESE_BURGER_EXTRA_SPICY.grillTiming;
if (!GRILL_TIMING) throw new Error('The first burger order requires authored grill timing.');

describe('first playable vertical slice', () => {
  it('runs the first order from customer entry through Flaming Business Cat payment', () => {
    const session = createSession();
    prepareOrder(session);
    session.startGrill();
    session.advanceGrill(GRILL_TIMING.idealStopAtMs);
    session.stopGrill();
    session.assemble();
    session.addModifier('ingredient.extra-spicy');
    session.serve();
    session.resolveReaction();

    expect(session.snapshot()).toMatchObject({
      phase: 'payment',
      scores: { order: 100, cook: 100, chaos: 140 },
      transformationResult: { id: 'transformation.business-cat.flaming' },
      payment: { total: 55 },
    });
  });

  it('uses immutable ingredient tags and does not infer CAT from generic food', () => {
    const nonCatFood = createFood(['ingredient.bun-bottom'], 100, 0);
    expect([...nonCatFood.tags]).not.toContain('CAT');
    expect(resolveTransformation(
      nonCatFood,
      businessCat,
      createProgressionContext([]),
      TRANSFORMATIONS,
    )).toBeNull();
  });

  it('requires the extra-spicy modifier before serving this authored order', () => {
    const session = createSession();
    prepareOrder(session);
    session.startGrill();
    session.advanceGrill(GRILL_TIMING.idealStopAtMs);
    session.stopGrill();
    session.assemble();
    expect(() => session.serve()).toThrow(/requires additional modifiers/i);
    session.addModifier('ingredient.extra-spicy');
    expect(() => session.serve()).not.toThrow();
  });

  it('keeps transformation discovery gated by progression when authored that way', () => {
    const gated = TRANSFORMATIONS.map((definition) =>
      definition.id === 'transformation.business-cat.flaming'
        ? { ...definition, unlockConditionId: 'discovery.flaming' }
        : definition,
    );
    const lockedSession = createSession([], gated);
    prepareOrder(lockedSession);
    lockedSession.startGrill();
    lockedSession.advanceGrill(GRILL_TIMING.idealStopAtMs);
    lockedSession.stopGrill();
    lockedSession.assemble();
    lockedSession.addModifier('ingredient.extra-spicy');
    lockedSession.serve();
    lockedSession.resolveReaction();
    expect(lockedSession.snapshot().transformationResult).toBeNull();

    const unlockedSession = createSession(['discovery.flaming'], gated);
    prepareOrder(unlockedSession);
    unlockedSession.startGrill();
    unlockedSession.advanceGrill(GRILL_TIMING.idealStopAtMs);
    unlockedSession.stopGrill();
    unlockedSession.assemble();
    unlockedSession.addModifier('ingredient.extra-spicy');
    unlockedSession.serve();
    unlockedSession.resolveReaction();
    expect(unlockedSession.snapshot().transformationResult?.id).toBe('transformation.business-cat.flaming');
  });

  it('tracks grill state and quality against authored timing', () => {
    const session = createSession();
    prepareOrder(session);
    session.startGrill();
    expect(session.advanceGrill(GRILL_TIMING.cookedAtMs).state).toBe('cooked');
    expect(session.advanceGrill(GRILL_TIMING.perfectAtMs - GRILL_TIMING.cookedAtMs).state).toBe('perfect');
    const result = session.stopGrill();
    expect(result.state).toBe('perfect');
    expect(result.quality).toBeGreaterThanOrEqual(80);
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
        spatialAssemblyWeight: 0.35,
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
  for (const ingredientId of requiredIngredientIds(HOT_CHEESE_BURGER_EXTRA_SPICY)) {
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
    tags: new Set(),
    chaosScore,
    quality,
    stationHistory: [],
    visualVariant: 'food.burger.finished',
  };
}
