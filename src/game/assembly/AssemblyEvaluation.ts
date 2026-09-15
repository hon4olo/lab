import type { AssemblyDefinition, AssemblyIngredientRule } from './AssemblyDefinition';
import type { FoodAssemblySnapshot } from './AssemblySession';

export interface AssemblyEvaluation {
  readonly completeness: number;
  readonly layerOrder: number;
  readonly centering: number;
  readonly distribution: number;
  readonly total: number;
}

export function evaluateAssembly(
  definition: AssemblyDefinition,
  snapshot: FoodAssemblySnapshot,
): AssemblyEvaluation {
  const completeness = scoreCompleteness(definition, snapshot);
  const layerOrder = scoreLayerOrder(definition, snapshot);
  const centering = scoreCentering(definition, snapshot);
  const distribution = scoreDistribution(definition, snapshot);
  return {
    completeness,
    layerOrder,
    centering,
    distribution,
    total: Math.round(
      completeness * 0.35 +
      layerOrder * 0.25 +
      centering * 0.25 +
      distribution * 0.15,
    ),
  };
}

function scoreCompleteness(definition: AssemblyDefinition, snapshot: FoodAssemblySnapshot): number {
  const required = definition.rules.filter((rule) => rule.minCount > 0);
  if (required.length === 0) return 100;
  const ratios = required.map((rule) => {
    const count = rule.mode === 'sauce'
      ? snapshot.sauceStrokes.filter((stroke) => stroke.ingredientId === rule.ingredientId).length
      : snapshot.placements.filter((placement) => placement.ingredientId === rule.ingredientId).length;
    return Math.min(1, count / rule.minCount);
  });
  return Math.round(average(ratios) * 100);
}

function scoreLayerOrder(definition: AssemblyDefinition, snapshot: FoodAssemblySnapshot): number {
  const authoredLayers = definition.rules.filter((rule) => rule.mode === 'layer').map((rule) => rule.ingredientId);
  const placedLayers = snapshot.placements
    .filter((placement) => authoredLayers.includes(placement.ingredientId))
    .sort((a, b) => a.sequence - b.sequence)
    .map((placement) => placement.ingredientId);
  if (authoredLayers.length <= 1) return 100;
  let orderedPairs = 0;
  let validPairs = 0;
  for (let left = 0; left < placedLayers.length; left += 1) {
    for (let right = left + 1; right < placedLayers.length; right += 1) {
      validPairs += 1;
      if (authoredLayers.indexOf(placedLayers[left] ?? '') <= authoredLayers.indexOf(placedLayers[right] ?? '')) {
        orderedPairs += 1;
      }
    }
  }
  return validPairs === 0 ? 100 : Math.round((orderedPairs / validPairs) * 100);
}

function scoreCentering(definition: AssemblyDefinition, snapshot: FoodAssemblySnapshot): number {
  const scores: number[] = [];
  for (const rule of definition.rules) {
    if (rule.mode === 'sauce') {
      const points = snapshot.sauceStrokes
        .filter((stroke) => stroke.ingredientId === rule.ingredientId)
        .flatMap((stroke) => stroke.points);
      if (points.length > 0) scores.push(centerScore(mean(points.map((point) => point.x)), rule));
      continue;
    }
    const placements = snapshot.placements.filter((placement) => placement.ingredientId === rule.ingredientId);
    for (const placement of placements) scores.push(centerScore(placement.x, rule));
  }
  return scores.length === 0 ? 100 : Math.round(average(scores) * 100);
}

function scoreDistribution(definition: AssemblyDefinition, snapshot: FoodAssemblySnapshot): number {
  const scoredRules = definition.rules.filter((rule) => (rule.targetSpread ?? 0) > 0 && rule.mode !== 'layer');
  if (scoredRules.length === 0) return 100;
  const scores = scoredRules.map((rule) => {
    const xValues = rule.mode === 'sauce'
      ? snapshot.sauceStrokes
        .filter((stroke) => stroke.ingredientId === rule.ingredientId)
        .flatMap((stroke) => stroke.points.map((point) => point.x))
      : snapshot.placements
        .filter((placement) => placement.ingredientId === rule.ingredientId)
        .map((placement) => placement.x);
    if (xValues.length < 2) return rule.minCount <= 1 ? 1 : 0;
    const span = Math.max(...xValues) - Math.min(...xValues);
    const target = rule.targetSpread ?? 0;
    return Math.max(0, 1 - Math.abs(span - target) / Math.max(target, 0.05));
  });
  return Math.round(average(scores) * 100);
}

function centerScore(x: number, rule: AssemblyIngredientRule): number {
  const tolerance = rule.horizontalTolerance ?? 0.08;
  const distance = Math.abs(x - rule.targetX);
  if (distance <= tolerance) return 1;
  return Math.max(0, 1 - (distance - tolerance) / Math.max(0.5 - tolerance, 0.05));
}

function average(values: readonly number[]): number {
  return values.length === 0 ? 1 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0.5 : values.reduce((sum, value) => sum + value, 0) / values.length;
}
