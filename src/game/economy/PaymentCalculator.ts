import type { ScoreResult } from '../scoring/OrderScoring';

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

export function calculatePayment(input: PaymentInput): PaymentResult {
  const qualityBonus = Math.floor(input.basePayment * (input.score.order + input.score.cook) / 500);
  const chaosBonus = Math.floor(input.basePayment * Math.min(input.score.chaos, 200) / 1000);
  const preTip = input.basePayment + qualityBonus + chaosBonus;
  const multiplied = Math.round(preTip * input.transformationRewardModifier);
  const tip = Math.floor(input.baseTip * (input.score.order + input.score.cook) / 200);
  return {
    base: input.basePayment,
    qualityBonus,
    chaosBonus,
    transformationMultiplier: multiplied - preTip,
    tip,
    total: multiplied + tip,
  };
}
