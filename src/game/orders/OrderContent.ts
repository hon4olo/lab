import type { IngredientDefinition } from '../ingredients/IngredientDefinition';
import type { OrderDefinition } from './OrderDefinition';

export interface OrderContent {
  readonly definition: OrderDefinition;
  /** Stable IDs of every ingredient selectable for this authored order. */
  readonly availableIngredientIds: readonly string[];
  /** Resolved definitions for the available pool; never inferred from a single modifier. */
  readonly ingredients: readonly IngredientDefinition[];
}
