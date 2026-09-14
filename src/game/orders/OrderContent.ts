import type { IngredientDefinition } from '../ingredients/IngredientDefinition';
import type { OrderDefinition } from './OrderDefinition';

export interface OrderContent {
  readonly definition: OrderDefinition;
  readonly ingredients: readonly IngredientDefinition[];
}
