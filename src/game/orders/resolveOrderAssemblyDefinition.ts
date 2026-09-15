import type { AssemblyDefinition } from '../assembly/AssemblyDefinition';
import type { OrderDefinition } from './OrderDefinition';
import {
  requiredIngredientIds,
  requiredModifierIngredientIds,
  resolveOrderAvailableIngredientIds,
} from './OrderRequirements';

/**
 * Resolves a recipe-owned spatial assembly contract into the concrete rules for one order.
 * The recipe defines geometry/capacity; the order decides which authored ingredients are required.
 */
export function resolveOrderAssemblyDefinition(
  order: OrderDefinition,
  recipeAssembly: AssemblyDefinition,
): AssemblyDefinition {
  const available = new Set(resolveOrderAvailableIngredientIds(order));
  const required = new Set([
    ...requiredIngredientIds(order),
    ...requiredModifierIngredientIds(order),
  ]);

  for (const ingredientId of required) {
    if (!recipeAssembly.rules.some((rule) => rule.ingredientId === ingredientId)) {
      throw new Error(
        `Order ${order.id} requires ${ingredientId}, but assembly ${recipeAssembly.id} has no rule for it.`,
      );
    }
  }

  const rules = recipeAssembly.rules
    .filter((rule) => available.has(rule.ingredientId))
    .map((rule) => ({
      ...rule,
      minCount: required.has(rule.ingredientId) ? Math.max(1, rule.minCount) : 0,
    }));

  return {
    ...recipeAssembly,
    id: `${recipeAssembly.id}:${order.id}`,
    rules,
  };
}
