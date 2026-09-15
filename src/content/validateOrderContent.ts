import type { SnackLabContentRegistries } from './registries';
import {
  forbiddenIngredientIds,
  modifierIngredientIds,
  optionalIngredientIds,
  requiredIngredientIds,
  resolveOrderAvailableIngredientIds,
} from '../game/orders/OrderRequirements';
import { grillConfigIssues, sameGrillAssets, sameGrillTiming } from './grillValidation';

export function validateOrders(
  registries: SnackLabContentRegistries,
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
  issues: string[],
): void {
  for (const order of registries.orders.all) {
    const recipe = registries.recipes.get(order.recipeId);
    const required = requiredIngredientIds(order);
    const optional = optionalIngredientIds(order);
    const forbidden = forbiddenIngredientIds(order);
    const modifiers = modifierIngredientIds(order);
    const available = resolveOrderAvailableIngredientIds(order);
    if (!recipe) issues.push(`Order ${order.id} references unknown recipe ${order.recipeId}.`);
    else {
      const recipeAvailable = new Set(recipe.availableIngredientIds);
      for (const ingredientId of [...available, ...forbidden]) {
        if (!recipeAvailable.has(ingredientId)) {
          issues.push(`Order ${order.id} ingredient ${ingredientId} is outside recipe ${recipe.id}'s available ingredient contract.`);
        }
      }
      const expectedOrder = recipe.ingredientOrder.filter((id) => available.includes(id));
      if (!sameSequence(order.expectedIngredientOrder, expectedOrder)) {
        issues.push(`Order ${order.id} ingredient order must follow recipe ${recipe.id}'s available ingredient order.`);
      }
      const prepRequirements = order.requiredPrepIngredientIds ?? recipe.requiredPrepIngredientIds;
      if (!prepRequirements.every((id) => recipe.requiredPrepIngredientIds.includes(id))) {
        issues.push(`Order ${order.id} prep requirements must be supported by recipe ${recipe.id}.`);
      }
      if (order.grillIngredientId !== recipe.grillIngredientId) {
        issues.push(`Order ${order.id} grill ingredient does not match recipe ${recipe.id}.`);
      }
      if (order.baseAssembledAssetKey !== recipe.baseAssembledAssetKey) {
        issues.push(`Order ${order.id} base assembled asset does not match recipe ${recipe.id}.`);
      }
      if (!sameGrillTiming(order.grillTiming, recipe.grillTiming) ||
          !sameGrillAssets(order.grillAssetKeys, recipe.grillAssetKeys)) {
        issues.push(`Order ${order.id} grill configuration does not match recipe ${recipe.id}.`);
      }
    }
    checkDuplicates(`order ${order.id} required ingredient`, required, issues);
    checkDuplicates(`order ${order.id} optional ingredient`, optional, issues);
    checkDuplicates(`order ${order.id} forbidden ingredient`, forbidden, issues);
    checkDuplicates(`order ${order.id} modifier`, modifiers, issues);
    for (const id of required) {
      if (optional.includes(id) || forbidden.includes(id)) {
        issues.push(`Order ${order.id} ingredient ${id} cannot be both required and optional or forbidden.`);
      }
    }
    for (const id of optional) {
      if (forbidden.includes(id)) issues.push(`Order ${order.id} ingredient ${id} cannot be both optional and forbidden.`);
    }
    for (const id of modifiers) {
      if (forbidden.includes(id)) issues.push(`Order ${order.id} modifier ${id} cannot be forbidden.`);
      if (required.includes(id) || optional.includes(id)) {
        issues.push(`Order ${order.id} modifier ${id} must not also be a base-assembly ingredient.`);
      }
    }
    if (order.requestedVariation && !order.requestedVariation.id.trim()) {
      issues.push(`Order ${order.id} requestedVariation must have an ID.`);
    }
    if (!available.includes(order.grillIngredientId)) {
      issues.push(`Order ${order.id} grill ingredient ${order.grillIngredientId} is not available.`);
    }
    for (const id of [...available, ...forbidden]) {
      if (!registries.ingredients.has(id)) issues.push(`Order ${order.id} references unknown ingredient ${id}.`);
    }
    for (const id of order.requiredPrepIngredientIds ?? []) {
      const ingredient = registries.ingredients.get(id);
      if (!available.includes(id)) issues.push(`Order ${order.id} requires prep for non-available ingredient ${id}.`);
      if (!ingredient) issues.push(`Order ${order.id} references unknown prep ingredient ${id}.`);
      else if (!ingredient.requiresPrep) issues.push(`Order ${order.id} requires prep for ${id}, but it is not prep-required.`);
    }
    validateAssetReferences(
      `order ${order.id}`,
      [order.baseAssembledAssetKey, ...(order.requestedVariation?.assembledAssetKey ? [order.requestedVariation.assembledAssetKey] : [])],
      approved,
      allAssets,
      issues,
    );
    issues.push(...grillConfigIssues(`order ${order.id}`, order.grillTiming, order.grillAssetKeys, approved, allAssets));
    if (order.reactionSequence !== undefined && !order.reactionSequence.trim()) {
      issues.push(`Order ${order.id} reactionSequence must not be empty.`);
    }
  }
}

function validateAssetReferences(
  owner: string,
  ids: readonly string[],
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
  issues: string[],
): void {
  for (const id of ids) {
    if (!allAssets.has(id)) issues.push(`${owner} references unknown asset ID ${id}.`);
    else if (!approved.has(id)) issues.push(`${owner} references non-production-approved asset ID ${id}.`);
  }
}

function checkDuplicates(label: string, values: readonly string[], issues: string[]): void {
  const duplicates = new Set<string>();
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  for (const value of duplicates) issues.push(`Duplicate ${label} ID: ${value}.`);
}

function sameSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}
