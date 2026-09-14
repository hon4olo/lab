import type { IngredientDefinition } from '../ingredients/IngredientDefinition';

export class PrepBoardSession {
  private readonly preparedIds = new Set<string>();

  public constructor(private readonly ingredients: readonly IngredientDefinition[]) {}

  public prepare(ingredientId: string, selectedIds: readonly string[]): void {
    const ingredient = this.ingredients.find((candidate) => candidate.id === ingredientId);
    if (!ingredient?.requiresPrep) throw new Error(`Ingredient does not need prep: ${ingredientId}`);
    if (!selectedIds.includes(ingredientId)) throw new Error(`Ingredient is not selected: ${ingredientId}`);
    this.preparedIds.add(ingredientId);
  }

  public isPrepared(ingredientId: string): boolean {
    return this.preparedIds.has(ingredientId);
  }

  public getPrepared(): readonly string[] {
    return [...this.preparedIds];
  }
}
