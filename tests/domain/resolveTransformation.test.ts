import { describe, expect, it } from 'vitest';
import type { FoodInstance } from '../../src/game/cooking/FoodInstance';
import type { CustomerInstance } from '../../src/game/customers/CustomerInstance';
import type { TransformationDefinition } from '../../src/game/transformations/TransformationDefinition';
import { resolveTransformation } from '../../src/game/transformations/resolveTransformation';

const food: FoodInstance = {
  id: 'food-1',
  ingredients: ['chili', 'cat-cookie'],
  ingredientOrder: ['chili', 'cat-cookie'],
  cookStates: [],
  stationHistory: [],
  quality: 1,
  tags: new Set(['HOT', 'FIRE', 'CAT']),
  chaosScore: 140,
  mistakes: [],
  visualVariant: 'assembled',
};

const customer: CustomerInstance = {
  id: 'customer-1',
  type: 'normal',
  variantId: 'normal-01',
  patience: 1,
};

function definition(
  id: string,
  overrides: Partial<TransformationDefinition> = {},
): TransformationDefinition {
  return {
    id,
    requiredTags: ['HOT'],
    preferredTags: [],
    forbiddenTags: [],
    minimumChaos: 100,
    priority: 1,
    rarity: 'common',
    compatibleCustomerTypes: [],
    resultAppearance: `${id}.appearance`,
    reactionSequence: `${id}.reaction`,
    rewardModifier: 1,
    requiredUnlocks: [],
    ...overrides,
  };
}

describe('resolveTransformation', () => {
  it('filters forbidden tags and chooses the strongest eligible definition', () => {
    const result = resolveTransformation(food, customer, { unlockedIds: new Set() }, [
      definition('blocked', { forbiddenTags: ['CAT'], priority: 100 }),
      definition('fire-cat', { requiredTags: ['FIRE', 'CAT'], priority: 3 }),
      definition('hot-face'),
    ]);

    expect(result?.id).toBe('fire-cat');
  });

  it('uses preferred tags and then stable IDs to break ties deterministically', () => {
    const result = resolveTransformation(food, customer, { unlockedIds: new Set() }, [
      definition('z-result', { preferredTags: ['ICE'] }),
      definition('b-result', { preferredTags: ['CAT'] }),
      definition('a-result', { preferredTags: ['FIRE'] }),
    ]);

    expect(result?.id).toBe('a-result');
  });
});
