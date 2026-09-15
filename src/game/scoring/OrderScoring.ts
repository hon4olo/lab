import type { FoodInstance } from '../cooking/FoodInstance';
import type { OrderDefinition } from '../orders/OrderDefinition';
import {
  resolveOrderAvailableIngredientIds,
  scoredRequiredIngredientIds,
} from '../orders/OrderRequirements';
import { DEFAULT_BALANCE_CONFIG, type BalanceConfig } from '../balance/BalanceConfig';

export interface ScoreResult {
  readonly order: number;
  readonly cook: number;
  readonly chaos: number;
}

export interface ScoreInput {
  readonly order: OrderDefinition;
  readonly selectedIngredients: readonly string[];
  readonly preparedIngredients: readonly string[];
  readonly assembled: boolean;
  readonly food: FoodInstance;
}

export function scoreOrder(
  input: ScoreInput,
  balance: BalanceConfig = DEFAULT_BALANCE_CONFIG,
): ScoreResult {
  const selected = new Set(input.selectedIngredients);
  const prepared = new Set(input.preparedIngredients);
  const required = scoredRequiredIngredientIds(input.order);
  const available = new Set(resolveOrderAvailableIngredientIds(input.order));
  const missing = required.filter((id) => !selected.has(id)).length;
  const extras = [...selected].filter((id) => !available.has(id)).length;
  const unprepared = (input.order.requiredPrepIngredientIds ?? []).filter(
    (id) => selected.has(id) && !prepared.has(id),
  ).length;
  const orderScore = clamp(
    100 - missing * balance.missingIngredientPenalty - extras * balance.extraIngredientPenalty -
      unprepared * balance.unpreparedIngredientPenalty - Number(!input.assembled) * balance.unassembledPenalty,
    0,
    100,
  );
  const cookScore = clamp(Math.round(input.food.quality), 0, 100);
  const chaosScore = input.order.chaosTarget > 0
    ? Math.round((input.food.chaosScore / input.order.chaosTarget) * 100)
    : 0;

  return { order: orderScore, cook: cookScore, chaos: chaosScore };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
