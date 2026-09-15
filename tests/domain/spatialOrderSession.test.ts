import { describe, expect, it } from 'vitest';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { HOT_CHEESE_BURGER } from '../../src/content/recipes/hotCheeseBurger';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import { GRILL_TIMING } from '../../src/game/cooking/GrillSession';
import type { CustomerInstance } from '../../src/game/customers/CustomerInstance';
import { OrderSession } from '../../src/game/orders/OrderSession';
import { requiredIngredientIds } from '../../src/game/orders/OrderRequirements';
import { resolveOrderAssemblyDefinition } from '../../src/game/orders/resolveOrderAssemblyDefinition';
import { createProgressionContext } from '../../src/game/progression/ProgressionContext';

const businessCat: CustomerInstance = {
  id: 'customer.business-cat.spatial-test',
  type: 'business-cat',
  variantId: 'customer.business-cat.neutral',
  patienceMs: 120_000,
};

describe('hands-on spatial order assembly', () => {
  it('builds the requested burger from positioned layers, pieces, and a sauce stroke', () => {
    const session = createSpatialSession();
    prepareToBuild(session);

    session.placeAssemblyIngredient('ingredient.bun-bottom', { x: 0.5, y: 0.82 });
    session.placeAssemblyIngredient('ingredient.patty', { x: 0.5, y: 0.67 });
    session.placeAssemblyIngredient('ingredient.cheese', { x: 0.51, y: 0.56 }, 6);
    session.addAssemblySauceStroke('ingredient.sauce', [
      { x: 0.26, y: 0.48 },
      { x: 0.5, y: 0.46 },
      { x: 0.74, y: 0.48 },
    ]);
    session.placeAssemblyIngredient('ingredient.extra-spicy', { x: 0.30, y: 0.42 }, -14);
    session.placeAssemblyIngredient('ingredient.extra-spicy', { x: 0.70, y: 0.42 }, 18);
    session.placeAssemblyIngredient('ingredient.bun-top', { x: 0.5, y: 0.28 }, -3);

    const evaluation = session.completeSpatialAssembly();
    expect(evaluation.completeness).toBe(100);
    expect(evaluation.total).toBeGreaterThanOrEqual(90);

    const built = session.snapshot();
    expect(built.phase).toBe('assembly');
    expect(built.assembled).toBe(true);
    expect(built.selectedIngredients).toContain('ingredient.extra-spicy');
    expect(built.food?.ingredientOrder).toEqual([
      'ingredient.bun-bottom',
      'ingredient.patty',
      'ingredient.cheese',
      'ingredient.sauce',
      'ingredient.extra-spicy',
      'ingredient.bun-top',
    ]);
    expect(built.assembly?.placements).toHaveLength(6);
    expect(built.assembly?.sauceStrokes).toHaveLength(1);
    expect(built.assemblyEvaluation?.total).toBe(evaluation.total);

    session.serve();
    session.resolveReaction();
    expect(session.snapshot()).toMatchObject({
      scores: { order: 100, cook: 100, chaos: 140 },
      transformationResult: { id: 'transformation.business-cat.flaming' },
      payment: { total: 55 },
    });
  });
});

function createSpatialSession(): OrderSession {
  const assembly = HOT_CHEESE_BURGER.assembly;
  if (!assembly) throw new Error('Burger recipe must define spatial assembly.');
  return new OrderSession(
    HOT_CHEESE_BURGER_EXTRA_SPICY,
    businessCat,
    HOT_CHEESE_BURGER_INGREDIENTS,
    TRANSFORMATIONS,
    {
      transactionId: 'test.shift.spatial-order-01',
      progression: createProgressionContext([]),
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
      assembly: resolveOrderAssemblyDefinition(HOT_CHEESE_BURGER_EXTRA_SPICY, assembly),
    },
  );
}

function prepareToBuild(session: OrderSession): void {
  session.customerEntered();
  for (const ingredientId of requiredIngredientIds(HOT_CHEESE_BURGER_EXTRA_SPICY)) {
    session.toggleIngredient(ingredientId);
  }
  session.openPrepBoard();
  session.prepareIngredient('ingredient.patty');
  session.continueToGrill();
  session.startGrill();
  session.advanceGrill(GRILL_TIMING.idealStopAtMs);
  session.stopGrill();
}
