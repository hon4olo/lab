import type { ScoreResult } from '../scoring/OrderScoring';
import { DEFAULT_BALANCE_CONFIG, type BalanceConfig } from '../balance/BalanceConfig';

export interface PaymentInput {
  readonly basePayment: number;
  readonly baseTip: number;
  readonly score: ScoreResult;
  readonly transformationRewardModifier: number;
}

export interface PaymentResult {
  readonly base: number;
  readonly qualityBonus: number;
  readonly chaosBonus: number;
  readonly transformationMultiplier: number;
  readonly tip: number;
  readonly total: number;
}

export function calculatePayment(
  input: PaymentInput,
  balance: BalanceConfig = DEFAULT_BALANCE_CONFIG,
): PaymentResult {
  const qualityBonus = Math.floor(
    input.basePayment * (input.score.order + input.score.cook) / balance.qualityBonusScale,
  );
  const chaosBonus = Math.floor(
    input.basePayment * Math.min(input.score.chaos, balance.chaosBonusCap) / balance.chaosBonusScale,
  );
  const preTip = input.basePayment + qualityBonus + chaosBonus;
  const multiplied = Math.round(preTip * input.transformationRewardModifier);
  const tip = Math.floor(input.baseTip * (input.score.order + input.score.cook) / balance.tipScale);
  return {
    base: input.basePayment,
    qualityBonus,
    chaosBonus,
    transformationMultiplier: multiplied - preTip,
    tip,
    total: multiplied + tip,
  };
}
