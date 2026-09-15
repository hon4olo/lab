import type { AssemblyDefinition, AssemblyPoint } from '../assembly/AssemblyDefinition';
import { evaluateAssembly, type AssemblyEvaluation } from '../assembly/AssemblyEvaluation';
import {
  AssemblySession,
  type FoodAssemblySnapshot,
  type PlacedIngredient,
  type SauceStroke,
} from '../assembly/AssemblySession';

export class SpatialOrderAssembly {
  private readonly session: AssemblySession;
  private evaluation: AssemblyEvaluation | null = null;

  public constructor(private readonly definition: AssemblyDefinition) {
    this.session = new AssemblySession(definition);
  }

  public placeIngredient(
    ingredientId: string,
    point: AssemblyPoint,
    rotation = 0,
    scale?: number,
  ): PlacedIngredient {
    this.evaluation = null;
    return this.session.placeIngredient(ingredientId, point, rotation, scale);
  }

  public moveIngredient(instanceId: string, point: AssemblyPoint, rotation?: number): PlacedIngredient {
    this.evaluation = null;
    return this.session.moveIngredient(instanceId, point, rotation);
  }

  public removeIngredient(instanceId: string): void {
    this.evaluation = null;
    this.session.removeIngredient(instanceId);
  }

  public addSauceStroke(ingredientId: string, points: readonly AssemblyPoint[]): SauceStroke {
    this.evaluation = null;
    return this.session.addSauceStroke(ingredientId, points);
  }

  public clearSauce(ingredientId: string): void {
    this.evaluation = null;
    this.session.clearSauce(ingredientId);
  }

  public complete(): AssemblyEvaluation {
    if (!this.session.isComplete()) throw new Error('Spatial food assembly is incomplete.');
    this.evaluation = evaluateAssembly(this.definition, this.session.snapshot());
    return this.evaluation;
  }

  public snapshot(): FoodAssemblySnapshot {
    return this.session.snapshot();
  }

  public evaluationSnapshot(): AssemblyEvaluation | null {
    return this.evaluation ? { ...this.evaluation } : null;
  }

  public includedIngredientIds(): readonly string[] {
    const snapshot = this.session.snapshot();
    return uniqueBySequence(snapshot).map((entry) => entry.ingredientId);
  }

  public orderedIngredientIds(): readonly string[] {
    return this.includedIngredientIds();
  }
}

function uniqueBySequence(snapshot: FoodAssemblySnapshot): readonly { ingredientId: string; sequence: number }[] {
  const events = [
    ...snapshot.placements.map((placement) => ({
      ingredientId: placement.ingredientId,
      sequence: placement.sequence,
    })),
    ...snapshot.sauceStrokes.map((stroke) => ({
      ingredientId: stroke.ingredientId,
      sequence: stroke.sequence,
    })),
  ].sort((left, right) => left.sequence - right.sequence);

  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.ingredientId)) return false;
    seen.add(event.ingredientId);
    return true;
  });
}
