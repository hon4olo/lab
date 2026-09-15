import { describe, expect, it } from 'vitest';
import { BUSINESS_CAT } from '../../src/content/customers/businessCat';
import { PICKY_PIGEON } from '../../src/content/customers/pickyPigeon';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../src/content/ingredients/hotCheeseBurger';
import { CHEESY_STREET_HOT_DOG_INGREDIENTS } from '../../src/content/ingredients/cheesyStreetHotDog';
import { HOTDOG_GRILL_TIMING } from '../../src/content/recipes/cheesyStreetHotDog';
import { TRANSFORMATIONS } from '../../src/content/transformations';
import { createFoodInstance } from '../../src/game/cooking/createFoodInstance';
import { GrillSession, GRILL_TIMING, type GrillTiming } from '../../src/game/cooking/GrillSession';
import type { CustomerInstance } from '../../src/game/customers/CustomerInstance';
import { createProgressionContext } from '../../src/game/progression/ProgressionContext';
import { resolveTransformation } from '../../src/game/transformations/resolveTransformation';

const businessCat: CustomerInstance = {
  id: 'customer.business-cat.tags-test',
  type: BUSINESS_CAT.type,
  variantId: BUSINESS_CAT.variantId,
  patienceMs: BUSINESS_CAT.basePatienceMs,
};

const pickyPigeon: CustomerInstance = {
  id: 'customer.picky-pigeon.tags-test',
  type: PICKY_PIGEON.type,
  variantId: PICKY_PIGEON.variantId,
  patienceMs: PICKY_PIGEON.basePatienceMs,
};

describe('Food tags and timing-relative grill quality', () => {
  it('derives ordinary food tags solely from its authored ingredients', () => {
    const burger = createFoodInstance({
      id: 'food.tags.burger',
      selectedIds: ['ingredient.bun-bottom', 'ingredient.patty', 'ingredient.cheese', 'ingredient.sauce', 'ingredient.bun-top'],
      preparedIds: ['ingredient.patty'],
      ingredients: HOT_CHEESE_BURGER_INGREDIENTS,
    });
    const hotDog = createFoodInstance({
      id: 'food.tags.hot-dog',
      selectedIds: ['ingredient.hotdog-bun', 'ingredient.sausage', 'ingredient.hotdog-cheese', 'ingredient.pickle', 'ingredient.mustard'],
      preparedIds: ['ingredient.sausage'],
      ingredients: CHEESY_STREET_HOT_DOG_INGREDIENTS,
    });

    expect([...burger.tags]).toEqual([]);
    expect([...hotDog.tags]).toEqual([]);
    expect(burger.tags.has('CAT')).toBe(false);
    expect(hotDog.tags.has('CAT')).toBe(false);
  });

  it('keeps Flaming Business Cat and Neon Pigeon deterministic from authored tags', () => {
    const flamingFood = createFoodInstance({
      id: 'food.tags.extra-spicy-burger',
      selectedIds: [
        'ingredient.bun-bottom',
        'ingredient.patty',
        'ingredient.cheese',
        'ingredient.sauce',
        'ingredient.extra-spicy',
        'ingredient.bun-top',
      ],
      preparedIds: ['ingredient.patty'],
      ingredients: HOT_CHEESE_BURGER_INGREDIENTS,
    });
    const neonFood = createFoodInstance({
      id: 'food.tags.glow-hot-dog',
      selectedIds: [
        'ingredient.hotdog-bun',
        'ingredient.sausage',
        'ingredient.hotdog-cheese',
        'ingredient.pickle',
        'ingredient.mustard',
        'ingredient.glow-sauce',
      ],
      preparedIds: ['ingredient.sausage'],
      ingredients: CHEESY_STREET_HOT_DOG_INGREDIENTS,
    });
    const progression = createProgressionContext();

    expect([...flamingFood.tags]).toEqual(['HOT', 'FIRE']);
    expect(flamingFood.tags.has('CAT')).toBe(false);
    expect(resolveTransformation(flamingFood, businessCat, progression, TRANSFORMATIONS)?.id).toBe(
      'transformation.business-cat.flaming',
    );
    expect(resolveTransformation(flamingFood, businessCat, progression, [...TRANSFORMATIONS].reverse())?.id).toBe(
      'transformation.business-cat.flaming',
    );

    expect([...neonFood.tags]).toEqual(['GLOW', 'ELECTRIC']);
    expect(resolveTransformation(neonFood, pickyPigeon, progression, TRANSFORMATIONS)?.id).toBe(
      'transformation.picky-pigeon.neon',
    );
    expect(resolveTransformation(neonFood, pickyPigeon, progression, [...TRANSFORMATIONS].reverse())?.id).toBe(
      'transformation.picky-pigeon.neon',
    );
  });

  it('normalizes perfect quality across the burger and hot-dog timing windows', () => {
    for (const [ingredientId, timing] of [
      ['ingredient.patty', GRILL_TIMING],
      ['ingredient.sausage', HOTDOG_GRILL_TIMING],
    ] as const) {
      expect(grillAt(ingredientId, timing, 0)).toMatchObject({ state: 'raw', quality: 25 });
      expect(grillAt(ingredientId, timing, timing.cookedAtMs)).toMatchObject({ state: 'cooked', quality: 60 });
      expect(grillAt(ingredientId, timing, timing.perfectAtMs)).toMatchObject({ state: 'perfect', quality: 60 });
      expect(grillAt(ingredientId, timing, midpoint(timing.perfectAtMs, timing.idealStopAtMs))).toMatchObject({
        state: 'perfect',
        quality: 80,
      });
      expect(grillAt(ingredientId, timing, timing.idealStopAtMs)).toMatchObject({ state: 'perfect', quality: 100 });
      expect(grillAt(ingredientId, timing, midpoint(timing.idealStopAtMs, timing.burnedAtMs))).toMatchObject({
        state: 'perfect',
        quality: 80,
      });
      expect(grillAt(ingredientId, timing, timing.burnedAtMs - 1)).toMatchObject({ state: 'perfect', quality: 60 });
      expect(grillAt(ingredientId, timing, timing.burnedAtMs)).toMatchObject({ state: 'burned', quality: 0 });
    }
  });

  it('keeps a perfectly timed hands-on flip at full grill quality and records its slot', () => {
    const grill = new GrillSession(GRILL_TIMING);
    grill.start('ingredient.patty', 'slot-3');
    grill.advance(GRILL_TIMING.idealStopAtMs / 2);
    expect(grill.flip()).toMatchObject({
      active: true,
      slotId: 'slot-3',
      flipped: true,
      flippedAtMs: GRILL_TIMING.idealStopAtMs / 2,
    });
    grill.advance(GRILL_TIMING.idealStopAtMs / 2);
    expect(grill.stop()).toMatchObject({
      state: 'perfect',
      quality: 100,
      slotId: 'slot-3',
      flipQuality: 100,
    });
  });

  it('penalizes a badly timed hands-on flip without changing legacy no-flip timing', () => {
    const early = new GrillSession(GRILL_TIMING);
    early.start('ingredient.patty', 'slot-1');
    early.advance(100);
    early.flip();
    early.advance(GRILL_TIMING.idealStopAtMs - 100);
    const earlyResult = early.stop();

    const legacy = grillAt('ingredient.patty', GRILL_TIMING, GRILL_TIMING.idealStopAtMs);
    expect(earlyResult.state).toBe('perfect');
    expect(earlyResult.quality).toBeLessThan(100);
    expect(legacy).toMatchObject({ quality: 100 });
    expect(legacy).not.toHaveProperty('flipQuality');
  });
});

function grillAt(ingredientId: string, timing: GrillTiming, elapsedMs: number) {
  const grill = new GrillSession(timing);
  grill.start(ingredientId);
  grill.advance(elapsedMs);
  return grill.stop();
}

function midpoint(left: number, right: number): number {
  return left + ((right - left) / 2);
}
