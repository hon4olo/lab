export const SCENARIO_NAMES = [
  'basic-order',
  'perfect-grill',
  'burned-order',
  'first-transformation',
  'high-chaos',
  'shift-end',
  'mobile-layout',
  'rewarded-interruption',
] as const;

export type ScenarioName = (typeof SCENARIO_NAMES)[number];

export interface ScenarioRequest {
  readonly name: ScenarioName;
  readonly seed: number;
}
