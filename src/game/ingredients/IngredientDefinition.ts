import type { GameplayTag } from './GameplayTag';

export type IngredientRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface IngredientDefinition {
  readonly id: string;
  readonly category: string;
  readonly displayNameKey: string;
  readonly assetKey: string;
  readonly tags: readonly GameplayTag[];
  readonly basePrice: number;
  readonly rarity: IngredientRarity;
  readonly cookingBehaviors: readonly string[];
  readonly visualProperties: Readonly<Record<string, string | number | boolean>>;
  readonly chaosContribution: number;
  readonly requiresPrep: boolean;
}
