import type { AssemblyDefinition, AssemblyPoint } from './AssemblyDefinition';
import { getAssemblyRule } from './AssemblyDefinition';

export interface PlacedIngredient {
  readonly instanceId: string;
  readonly ingredientId: string;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly scale: number;
  readonly sequence: number;
}

export interface SauceStroke {
  readonly strokeId: string;
  readonly ingredientId: string;
  readonly points: readonly AssemblyPoint[];
  readonly sequence: number;
}

export interface FoodAssemblySnapshot {
  readonly placements: readonly PlacedIngredient[];
  readonly sauceStrokes: readonly SauceStroke[];
}

export class AssemblySession {
  private placements: PlacedIngredient[] = [];
  private sauceStrokes: SauceStroke[] = [];
  private nextSequence = 0;
  private nextPlacementId = 0;
  private nextStrokeId = 0;

  public constructor(private readonly definition: AssemblyDefinition) {}

  public placeIngredient(
    ingredientId: string,
    point: AssemblyPoint,
    rotation = 0,
    scale?: number,
  ): PlacedIngredient {
    const rule = getAssemblyRule(this.definition, ingredientId);
    if (rule.mode === 'sauce') throw new Error(`${ingredientId} must be applied as a sauce stroke.`);
    this.requireCapacity(ingredientId, rule.maxCount);
    const placement: PlacedIngredient = {
      instanceId: `${ingredientId}#${this.nextPlacementId++}`,
      ingredientId,
      x: clamp01(point.x),
      y: clamp01(point.y),
      rotation: rule.allowRotation ? normalizeRotation(rotation) : 0,
      scale: clampScale(scale ?? rule.placementScale ?? 1),
      sequence: this.nextSequence++,
    };
    this.placements = [...this.placements, placement];
    return placement;
  }

  public moveIngredient(
    instanceId: string,
    point: AssemblyPoint,
    rotation?: number,
  ): PlacedIngredient {
    const current = this.placements.find((placement) => placement.instanceId === instanceId);
    if (!current) throw new Error(`Unknown assembly placement ${instanceId}.`);
    const rule = getAssemblyRule(this.definition, current.ingredientId);
    const moved: PlacedIngredient = {
      ...current,
      x: clamp01(point.x),
      y: clamp01(point.y),
      rotation: rotation === undefined
        ? current.rotation
        : rule.allowRotation ? normalizeRotation(rotation) : 0,
    };
    this.placements = this.placements.map((placement) => placement.instanceId === instanceId ? moved : placement);
    return moved;
  }

  public removeIngredient(instanceId: string): void {
    if (!this.placements.some((placement) => placement.instanceId === instanceId)) {
      throw new Error(`Unknown assembly placement ${instanceId}.`);
    }
    this.placements = this.placements.filter((placement) => placement.instanceId !== instanceId);
  }

  public addSauceStroke(ingredientId: string, points: readonly AssemblyPoint[]): SauceStroke {
    const rule = getAssemblyRule(this.definition, ingredientId);
    if (rule.mode !== 'sauce') throw new Error(`${ingredientId} is not authored as a sauce.`);
    if (points.length < 2) throw new Error('A sauce stroke requires at least two points.');
    this.requireSauceCapacity(ingredientId, rule.maxCount);
    const stroke: SauceStroke = {
      strokeId: `${ingredientId}@${this.nextStrokeId++}`,
      ingredientId,
      points: points.map((point) => ({ x: clamp01(point.x), y: clamp01(point.y) })),
      sequence: this.nextSequence++,
    };
    this.sauceStrokes = [...this.sauceStrokes, stroke];
    return stroke;
  }

  public clearSauce(ingredientId: string): void {
    getAssemblyRule(this.definition, ingredientId);
    this.sauceStrokes = this.sauceStrokes.filter((stroke) => stroke.ingredientId !== ingredientId);
  }

  public isComplete(): boolean {
    return this.definition.rules.every((rule) => this.countForRule(rule.ingredientId, rule.mode) >= rule.minCount);
  }

  public snapshot(): FoodAssemblySnapshot {
    return {
      placements: this.placements.map((placement) => ({ ...placement })),
      sauceStrokes: this.sauceStrokes.map((stroke) => ({
        ...stroke,
        points: stroke.points.map((point) => ({ ...point })),
      })),
    };
  }

  private countForRule(ingredientId: string, mode: 'layer' | 'piece' | 'sauce'): number {
    return mode === 'sauce'
      ? this.sauceStrokes.filter((stroke) => stroke.ingredientId === ingredientId).length
      : this.placements.filter((placement) => placement.ingredientId === ingredientId).length;
  }

  private requireCapacity(ingredientId: string, maxCount: number): void {
    const count = this.placements.filter((placement) => placement.ingredientId === ingredientId).length;
    if (count >= maxCount) throw new Error(`${ingredientId} already reached its assembly limit of ${maxCount}.`);
  }

  private requireSauceCapacity(ingredientId: string, maxCount: number): void {
    const count = this.sauceStrokes.filter((stroke) => stroke.ingredientId === ingredientId).length;
    if (count >= maxCount) throw new Error(`${ingredientId} already reached its sauce-stroke limit of ${maxCount}.`);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Assembly coordinates must be finite.');
  return Math.min(1, Math.max(0, value));
}

function clampScale(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Assembly scale must be finite.');
  return Math.min(1.5, Math.max(0.5, value));
}

function normalizeRotation(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Assembly rotation must be finite.');
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}
