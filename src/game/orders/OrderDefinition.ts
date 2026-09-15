import type { GameplayTag } from '../ingredients/GameplayTag';
import type { CookState, GrillTiming } from '../cooking/GrillSession';
import type { OrderPhase } from './OrderSession';

export type OrderActionLabel =
  | 'action.open-prep'
  | 'action.prepare-ingredient'
  | 'action.continue-grill'
  | 'action.start-grill'
  | 'action.stop-grill'
  | 'action.assemble'
  | 'action.add-modifier'
  | 'action.serve';

export interface OrderDefinition {
  readonly id: string;
  readonly foodInstanceId: string;
  readonly displayNameKey: string;
  readonly modifierKey: string;
  readonly modifierIngredientId: string;
  readonly grillIngredientId: string;
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
  /** Optional modifiers can be skipped after assembly; existing orders default to required. */
  readonly modifierRequired?: boolean;
  /** Authored feedback sequence used for the normal customer reaction. */
  readonly reactionSequence?: string;
  /** Optional localized instruction overrides for this recipe/order. */
  readonly instructionKeys?: Readonly<Partial<Record<OrderPhase, string>>>;
  /** Optional localized action-label overrides without changing action semantics. */
  readonly actionLabelKeys?: Readonly<Partial<Record<OrderActionLabel, string>>>;
  /** Recipe-specific cook curve and state artwork. */
  readonly grillTiming?: GrillTiming;
  readonly grillAssetKeys?: Readonly<Record<CookState, string>>;
}
