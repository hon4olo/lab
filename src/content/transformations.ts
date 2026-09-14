import type { TransformationDefinition } from '../game/transformations/TransformationDefinition';

export const TRANSFORMATIONS: readonly TransformationDefinition[] = [
  {
    id: 'transformation.business-cat.flaming',
    requiredTags: ['HOT', 'FIRE'],
    preferredTags: ['CAT'],
    forbiddenTags: ['ICE'],
    minimumChaos: 60,
    priority: 10,
    rarity: 'rare',
    compatibleCustomerTypes: ['business-cat'],
    resultAppearance: 'business-cat.flaming',
    appearanceAssets: [
      'customer.business-cat.mutation.fire-accents',
      'customer.business-cat.mutation.glow-eyes',
      'customer.business-cat.mutation.singed-tie',
    ],
    reactionSequence: 'reaction.transformation.flaming',
    rewardModifier: 1.25,
    requiredUnlocks: [],
  },
];
