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

/**
 * Order-level ingredient choices. Recipe content defines the allowed food
 * contract; an order selects the subset and removals that a customer asks for.
 */
export interface OrderIngredientRequirements {
  /** Ingredients that must be selected before the food can receive a full order score. */
  readonly requiredIngredientIds: readonly string[];
  /** Authored extras that are allowed during base assembly but are not required. */
  readonly optionalIngredientIds?: readonly string[];
  /** Ingredients from the recipe contract that this order explicitly excludes. */
  readonly forbiddenIngredientIds?: readonly string[];
}

/** A post-assembly variation ingredient. Optional modifiers can be skipped. */
export interface OrderModifierRequirement {
  readonly ingredientId: string;
  readonly required?: boolean;
}

/**
 * A small, authored variation request—not a rules script. It can carry zero,
 * one, or many modifiers and an optional final food visual.
 */
export interface OrderVariation {
  readonly id: string;
  readonly displayNameKey?: string;
  readonly modifiers?: readonly OrderModifierRequirement[];
  readonly assembledAssetKey?: string;
}

export interface OrderDefinition {
  readonly id: string;
  readonly foodInstanceId: string;
  readonly displayNameKey: string;
  readonly recipeId: string;
  readonly ingredientRequirements: OrderIngredientRequirements;
  /** Absent for a plain order; modifiers are variation-specific, never recipe duplicates. */
  readonly requestedVariation?: OrderVariation;
  /** Order-specific override; recipe content remains the base station contract. */
  readonly grillIngredientId: string;
  readonly expectedIngredientOrder: readonly string[];
  readonly requiredPrepIngredientIds?: readonly string[];
  readonly requiredStations?: readonly string[];
  readonly requiredTags: readonly GameplayTag[];
  readonly chaosTarget: number;
  readonly basePayment: number;
  readonly baseTip: number;
  /** Resolved plain visual from the recipe contract; validation keeps it aligned with the recipe. */
  readonly baseAssembledAssetKey: string;
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
