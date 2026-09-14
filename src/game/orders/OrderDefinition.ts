import type { GameplayTag } from '../ingredients/GameplayTag';

export interface OrderDefinition {
  readonly id: string;
  readonly foodInstanceId: string;
  readonly displayNameKey: string;
  readonly modifierKey: string;
  readonly modifierIngredientId: string;
  readonly grillIngredientId: string;
  readonly customerType: string;
  readonly recipeId: string;
  readonly requiredIngredientIds: readonly string[];
  readonly expectedIngredientOrder: readonly string[];
  readonly requiredPrepIngredientIds: readonly string[];
  readonly requiredStations: readonly string[];
  readonly requiredTags: readonly GameplayTag[];
  readonly chaosTarget: number;
  readonly basePayment: number;
  readonly baseTip: number;
  readonly baseAssembledAssetKey: string;
  readonly assembledAssetKey: string;
}
