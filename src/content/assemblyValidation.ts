import type { AssemblyDefinition } from '../game/assembly/AssemblyDefinition';

export function assemblyDefinitionIssues(
  owner: string,
  definition: AssemblyDefinition | undefined,
  availableIngredientIds: ReadonlySet<string>,
): readonly string[] {
  if (!definition) return [];
  const issues: string[] = [];
  if (!definition.id.trim()) issues.push(`${owner} assembly has an empty ID.`);
  if (!Number.isFinite(definition.workspaceAspectRatio) || definition.workspaceAspectRatio <= 0) {
    issues.push(`${owner} assembly must have a positive workspaceAspectRatio.`);
  }
  const seen = new Set<string>();
  for (const rule of definition.rules) {
    if (seen.has(rule.ingredientId)) {
      issues.push(`${owner} assembly has duplicate rule for ${rule.ingredientId}.`);
    }
    seen.add(rule.ingredientId);
    if (!availableIngredientIds.has(rule.ingredientId)) {
      issues.push(`${owner} assembly references ingredient ${rule.ingredientId} outside the recipe contract.`);
    }
    if (!Number.isInteger(rule.minCount) || rule.minCount < 0) {
      issues.push(`${owner} assembly ${rule.ingredientId} minCount must be a non-negative integer.`);
    }
    if (!Number.isInteger(rule.maxCount) || rule.maxCount < 1) {
      issues.push(`${owner} assembly ${rule.ingredientId} maxCount must be a positive integer.`);
    }
    if (rule.minCount > rule.maxCount) {
      issues.push(`${owner} assembly ${rule.ingredientId} minCount cannot exceed maxCount.`);
    }
    if (!inUnitRange(rule.targetX)) {
      issues.push(`${owner} assembly ${rule.ingredientId} targetX must be between 0 and 1.`);
    }
    if (rule.targetY !== undefined && !inUnitRange(rule.targetY)) {
      issues.push(`${owner} assembly ${rule.ingredientId} targetY must be between 0 and 1.`);
    }
    if (rule.horizontalTolerance !== undefined && !positiveUnit(rule.horizontalTolerance)) {
      issues.push(`${owner} assembly ${rule.ingredientId} horizontalTolerance must be > 0 and <= 1.`);
    }
    if (rule.targetSpread !== undefined && !inUnitRange(rule.targetSpread)) {
      issues.push(`${owner} assembly ${rule.ingredientId} targetSpread must be between 0 and 1.`);
    }
    if (rule.placementScale !== undefined && (!Number.isFinite(rule.placementScale) || rule.placementScale <= 0)) {
      issues.push(`${owner} assembly ${rule.ingredientId} placementScale must be positive.`);
    }
  }
  return issues;
}

function inUnitRange(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function positiveUnit(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 1;
}
