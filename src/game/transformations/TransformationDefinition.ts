import type { GameplayTag } from '../ingredients/GameplayTag';
import type { ProgressionContext } from '../progression/ProgressionContext';

export type TransformationRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface TransformationDefinition {
  readonly id: string;
  readonly requiredTags: readonly GameplayTag[];
  readonly preferredTags: readonly GameplayTag[];
  readonly forbiddenTags: readonly GameplayTag[];
  readonly minimumChaos: number;
  readonly priority: number;
  readonly rarity: TransformationRarity;
  readonly compatibleCustomerTypes: readonly string[];
  readonly resultAppearance: string;
  readonly appearanceAssets: readonly string[];
  readonly appearanceMode?: 'overlay' | 'full';
  readonly effectAssets?: readonly string[];
  readonly reactionSequence: string;
  readonly rewardModifier: number;
  readonly requiredUnlocks: readonly string[];
}

export type TransformationContext = ProgressionContext;
