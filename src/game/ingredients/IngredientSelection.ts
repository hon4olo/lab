import type { IngredientDefinition } from './IngredientDefinition';

export class IngredientSelection {
  private readonly selectedIds = new Set<string>();

  public constructor(private readonly definitions: readonly IngredientDefinition[]) {}

  public toggle(ingredientId: string): boolean {
    this.assertKnown(ingredientId);
    if (this.selectedIds.has(ingredientId)) {
      this.selectedIds.delete(ingredientId);
      return false;
    }
    this.selectedIds.add(ingredientId);
    return true;
  }

  public select(ingredientId: string): void {
    this.assertKnown(ingredientId);
    this.selectedIds.add(ingredientId);
  }

  public deselect(ingredientId: string): void {
    this.assertKnown(ingredientId);
    this.selectedIds.delete(ingredientId);
  }

  public includes(ingredientId: string): boolean {
    return this.selectedIds.has(ingredientId);
  }

  public getSelected(): readonly string[] {
    return [...this.selectedIds];
  }

  private assertKnown(ingredientId: string): void {
    if (!this.definitions.some((ingredient) => ingredient.id === ingredientId)) {
      throw new Error(`Unknown ingredient: ${ingredientId}`);
    }
  }
}
