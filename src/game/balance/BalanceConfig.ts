export interface BalanceConfig {
  readonly missingIngredientPenalty: number;
  readonly extraIngredientPenalty: number;
  readonly unpreparedIngredientPenalty: number;
  readonly unassembledPenalty: number;
  /** Share of ORDER score controlled by hands-on spatial assembly quality, from 0 to 1. */
  readonly spatialAssemblyWeight: number;
  readonly qualityBonusScale: number;
  readonly chaosBonusScale: number;
  readonly chaosBonusCap: number;
  readonly tipScale: number;
}

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = Object.freeze({
  missingIngredientPenalty: 18,
  extraIngredientPenalty: 6,
  unpreparedIngredientPenalty: 10,
  unassembledPenalty: 20,
  spatialAssemblyWeight: 0.35,
  qualityBonusScale: 500,
  chaosBonusScale: 1000,
  chaosBonusCap: 200,
  tipScale: 200,
});
