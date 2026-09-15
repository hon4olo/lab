import type { CustomerDefinition } from '../../game/customers/CustomerDefinition';

export const PICKY_PIGEON: CustomerDefinition = {
  id: 'customer.picky-pigeon',
  type: 'picky-pigeon',
  variantId: 'customer.picky-pigeon.neutral',
  displayNameKey: 'order.customer.picky-pigeon',
  basePatienceMs: 95_000,
  headAssetId: 'customer.picky-pigeon.head',
  defaultReactionSequence: 'reaction.picky-pigeon.skeptical',
  reactionAssets: {
    'reaction.picky-pigeon.skeptical': 'customer.picky-pigeon.reaction.skeptical',
    'reaction.picky-pigeon.shocked': 'customer.picky-pigeon.reaction.shocked',
  },
  appearanceAssets: [
    'customer.picky-pigeon.body',
    'customer.picky-pigeon.head',
    'customer.picky-pigeon.eyes',
    'customer.picky-pigeon.pupils',
    'customer.picky-pigeon.mouth',
    'customer.picky-pigeon.arms',
    'customer.picky-pigeon.feet',
    'customer.picky-pigeon.accessories',
  ],
};
