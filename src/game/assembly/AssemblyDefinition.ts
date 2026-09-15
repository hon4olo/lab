export type AssemblyPlacementMode = 'layer' | 'piece' | 'sauce';

export interface AssemblyPoint {
  /** Normalized workspace X coordinate in the inclusive range 0..1. */
  readonly x: number;
  /** Normalized workspace Y coordinate in the inclusive range 0..1. */
  readonly y: number;
}

export interface AssemblyIngredientRule {
  readonly ingredientId: string;
  readonly mode: AssemblyPlacementMode;
  /** Minimum number of placed pieces/strokes required by the base recipe. */
  readonly minCount: number;
  /** Maximum number accepted by the authored recipe workspace. */
  readonly maxCount: number;
  /** Ideal horizontal center in normalized workspace coordinates. */
  readonly targetX: number;
  /** Optional ideal vertical center; presentation may derive Y from the stack. */
  readonly targetY?: number;
  /** Distance from targetX that still receives full placement credit. */
  readonly horizontalTolerance?: number;
  /** Desired horizontal span for multi-piece toppings such as pickles/chili. */
  readonly targetSpread?: number;
  readonly allowRotation?: boolean;
  /** Authored visual scale relative to the station's canonical ingredient size. */
  readonly placementScale?: number;
}

export interface AssemblyDefinition {
  /** Stable gameplay/workspace identifier, not a Phaser scene name. */
  readonly id: string;
  /** Canonical work-surface aspect ratio used to map normalized domain coordinates. */
  readonly workspaceAspectRatio: number;
  readonly rules: readonly AssemblyIngredientRule[];
}

export function getAssemblyRule(
  definition: AssemblyDefinition,
  ingredientId: string,
): AssemblyIngredientRule {
  const rule = definition.rules.find((candidate) => candidate.ingredientId === ingredientId);
  if (!rule) throw new Error(`Ingredient ${ingredientId} is not valid for assembly ${definition.id}.`);
  return rule;
}
