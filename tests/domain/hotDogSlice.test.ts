import { describe, expect, it } from 'vitest';
import { CHEESY_STREET_HOT_DOG_INGREDIENTS } from '../../src/content/ingredients/cheesyStreetHotDog';
import { PICKY_PIGEON } from '../../src/content/customers/pickyPigeon';
import {
  CHEESY_STREET_HOT_DOG_ORDER,
  HOTDOG_GRILL_TIMING,
} from '../../src/content/orders/cheesyStreetHotDog';
import { SNACK_LAB_CONTENT_REGISTRIES } from '../../src/content/registries';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import { DEFAULT_BALANCE_CONFIG } from '../../src/game/balance/BalanceConfig';
import { GrillSession } from '../../src/game/cooking/GrillSession';
import { OrderSession } from '../../src/game/orders/OrderSession';
import { createProgressionContext } from '../../src/game/progression/ProgressionContext';

describe('Picky Pigeon and Cheesy Street Hot Dog', () => {
  it('resolves authored customer, recipe, order, and second shift slot from registries', () => {
    expect(SNACK_LAB_CONTENT_REGISTRIES.customers.get(PICKY_PIGEON.id)).toBe(PICKY_PIGEON);
    expect(SNACK_LAB_CONTENT_REGISTRIES.recipes.get('recipe.cheesy-street-hot-dog')).toBeTruthy();
    expect(SNACK_LAB_CONTENT_REGISTRIES.orders.get(CHEESY_STREET_HOT_DOG_ORDER.id)).toBe(
      CHEESY_STREET_HOT_DOG_ORDER,
    );
    expect(SNACK_LAB_CONTENT_REGISTRIES.shifts.get('shift.street-snack-bar.first')?.orderSequence[1]).toMatchObject({
      orderId: CHEESY_STREET_HOT_DOG_ORDER.id,
      customerId: PICKY_PIGEON.id,
    });
  });

  it('keeps authored sausage states raw, cooked, perfect, and burned', () => {
    const cases = [
      [0, 'raw'],
      [HOTDOG_GRILL_TIMING.cookedAtMs, 'cooked'],
      [HOTDOG_GRILL_TIMING.perfectAtMs, 'perfect'],
      [HOTDOG_GRILL_TIMING.burnedAtMs, 'burned'],
    ] as const;
    for (const [elapsedMs, state] of cases) {
      const grill = new GrillSession(HOTDOG_GRILL_TIMING);
      grill.start('ingredient.sausage');
      grill.advance(elapsedMs);
      expect(grill.stop()).toMatchObject({ ingredientId: 'ingredient.sausage', elapsedMs, state });
    }
  });

  it('scores and pays the correct base hot dog without a transformation', () => {
    const result = completeHotDog(false);
    expect(result).toMatchObject({
      scores: { order: 100, cook: 100, chaos: 0 },
      transformationResult: null,
      payment: { total: 36 },
    });
    expect(result.food?.tags).not.toEqual(expect.arrayContaining(['GLOW', 'ELECTRIC']));
  });

  it('adds Glow Sauce tags and deterministically resolves Neon Pigeon', () => {
    const result = completeHotDog(true);
    expect(result).toMatchObject({
      scores: { order: 100, cook: 100, chaos: 100 },
      transformationResult: { id: 'transformation.picky-pigeon.neon' },
      payment: { total: 49 },
    });
    expect(result.food?.tags).toEqual(expect.arrayContaining(['GLOW', 'ELECTRIC']));
  });
});

function completeHotDog(withGlow: boolean) {
  const session = new OrderSession(
    CHEESY_STREET_HOT_DOG_ORDER,
    {
      id: 'customer.picky-pigeon.test',
      type: PICKY_PIGEON.type,
      variantId: PICKY_PIGEON.variantId,
      patienceMs: PICKY_PIGEON.basePatienceMs,
    },
    CHEESY_STREET_HOT_DOG_INGREDIENTS,
    TRANSFORMATIONS,
    {
      transactionId: `test.hotdog.${withGlow ? 'glow' : 'base'}`,
      progression: createProgressionContext(),
      balance: DEFAULT_BALANCE_CONFIG,
    },
  );
  session.customerEntered();
  for (const id of CHEESY_STREET_HOT_DOG_ORDER.requiredIngredientIds) session.toggleIngredient(id);
  session.openPrepBoard();
  session.prepareIngredient('ingredient.sausage');
  session.continueToGrill();
  session.startGrill();
  session.advanceGrill(HOTDOG_GRILL_TIMING.idealStopAtMs);
  session.stopGrill();
  session.assemble();
  if (withGlow) session.addModifier('ingredient.glow-sauce');
  session.serve();
  session.resolveReaction();
  return session.snapshot();
}
