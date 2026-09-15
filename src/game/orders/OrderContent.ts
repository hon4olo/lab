import type { AssemblyDefinition } from '../assembly/AssemblyDefinition';
import type { IngredientDefinition } from '../ingredients/IngredientDefinition';
import type { OrderDefinition } from './OrderDefinition';

export interface OrderContent {
  readonly definition: OrderDefinition;
  /** Stable IDs of every ingredient selectable for this authored order. */
  readonly availableIngredientIds: readonly string[];
  /** Resolved definitions for the available pool; never inferred from a single modifier. */
  readonly ingredients: readonly IngredientDefinition[];
  /**
   * Resolved recipe-owned spatial assembly contract. Optional while legacy recipes migrate;
   * player-facing hands-on Build Station code must require this before activation.
   */
  readonly assembly?: AssemblyDefinition;
}
