import type { TransformationDefinition } from '../game/transformations/TransformationDefinition';

export const TRANSFORMATIONS: readonly TransformationDefinition[] = [
  {
    id: 'transformation.business-cat.flaming',
    requiredTags: ['HOT', 'FIRE'],
    preferredTags: [],
    forbiddenTags: ['ICE'],
    minimumChaos: 60,
    priority: 10,
    rarity: 'rare',
    compatibleCustomerTypes: ['business-cat'],
    resultAppearance: 'business-cat.flaming',
    // Batch 01 mutation cutouts are not safe aligned overlays. Keep the approved base
    // character intact and use the authored fire burst until a full replacement sprite exists.
    appearanceAssets: [],
    effectAssets: ['fx.fire-burst'],
    reactionSequence: 'reaction.flaming',
    rewardModifier: 1.25,
    requiredUnlocks: [],
  },
  {
    id: 'transformation.picky-pigeon.neon',
    requiredTags: ['GLOW', 'ELECTRIC'],
    preferredTags: ['GLOW', 'ELECTRIC'],
    forbiddenTags: [],
    minimumChaos: 80,
    priority: 12,
    rarity: 'rare',
    compatibleCustomerTypes: ['picky-pigeon'],
    resultAppearance: 'picky-pigeon.neon',
    appearanceAssets: ['customer.picky-pigeon.mutation.neon'],
    appearanceMode: 'full',
    effectAssets: ['fx.electric-sparks', 'fx.neon-burst'],
    reactionSequence: 'reaction.picky-pigeon.shocked',
    rewardModifier: 1.35,
    requiredUnlocks: [],
  },
];
