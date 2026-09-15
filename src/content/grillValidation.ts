import type { CookState, GrillTiming } from '../game/cooking/GrillSession';

const COOK_STATES: readonly CookState[] = ['raw', 'cooked', 'perfect', 'burned'];

export function grillConfigIssues(
  owner: string,
  timing: GrillTiming | undefined,
  assets: Readonly<Record<string, string>> | undefined,
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
): readonly string[] {
  if (!timing && !assets) return [];
  if (!timing || !assets) return [`${owner} must define both grillTiming and grillAssetKeys.`];

  const issues: string[] = [];
  const values = [timing.cookedAtMs, timing.perfectAtMs, timing.burnedAtMs, timing.idealStopAtMs];
  if (!values.every((value) => Number.isFinite(value) && value >= 0) ||
      timing.cookedAtMs >= timing.perfectAtMs || timing.perfectAtMs >= timing.burnedAtMs ||
      timing.idealStopAtMs < timing.perfectAtMs || timing.idealStopAtMs >= timing.burnedAtMs) {
    issues.push(`${owner} has invalid grill timing.`);
  }
  for (const state of COOK_STATES) {
    const assetId = assets[state];
    if (!assetId) issues.push(`${owner} is missing grill asset for ${state}.`);
    else if (!allAssets.has(assetId)) issues.push(`${owner} ${state} references unknown asset ID ${assetId}.`);
    else if (!approved.has(assetId)) issues.push(`${owner} ${state} references non-production-approved asset ID ${assetId}.`);
  }
  return issues;
}

export function sameGrillTiming(left: GrillTiming | undefined, right: GrillTiming | undefined): boolean {
  if (!left && !right) return true;
  return Boolean(left && right && left.cookedAtMs === right.cookedAtMs &&
    left.perfectAtMs === right.perfectAtMs && left.burnedAtMs === right.burnedAtMs &&
    left.idealStopAtMs === right.idealStopAtMs);
}

export function sameGrillAssets(
  left: Readonly<Record<string, string>> | undefined,
  right: Readonly<Record<string, string>> | undefined,
): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return COOK_STATES.every((state) => left[state] === right[state]);
}
