import { getManifestAssets } from '../assets/assetManifest';
import type { CustomerDefinition } from '../game/customers/CustomerDefinition';
import type { IngredientDefinition } from '../game/ingredients/IngredientDefinition';
import type { TransformationDefinition } from '../game/transformations/TransformationDefinition';
import type { ContentRegistry } from './ContentRegistry';
import type { SnackLabContentRegistries } from './registries';
import { grillConfigIssues, sameGrillAssets, sameGrillTiming } from './grillValidation';

export interface SnackLabContentValidationResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

type Registries = SnackLabContentRegistries;
type RegistryEntry = readonly [string, ContentRegistry<{ readonly id: string }>];

export function validateSnackLabContent(
  registries: Registries,
  manifest: unknown,
): SnackLabContentValidationResult {
  const issues: string[] = [];
  const registryEntries: readonly RegistryEntry[] = [
    ['customer', registries.customers],
    ['ingredient', registries.ingredients],
    ['recipe', registries.recipes],
    ['order', registries.orders],
    ['shift', registries.shifts],
    ['chapter', registries.chapters],
    ['transformation', registries.transformations],
  ];
  const firstOwnerById = new Map<string, string>();

  for (const [kind, registry] of registryEntries) {
    for (const definition of registry.all) {
      if (!definition.id.trim()) issues.push(`${kind} has an empty content ID.`);
      const previousOwner = firstOwnerById.get(definition.id);
      if (previousOwner) issues.push(`Duplicate content ID ${definition.id} in ${previousOwner} and ${kind}.`);
      else firstOwnerById.set(definition.id, kind);
    }
    for (const id of registry.duplicateIds) issues.push(`Duplicate ${kind} ID: ${id}.`);
  }

  const assets = readManifestAssets(manifest, issues);
  const approvedAssetIds = new Set(assets.filter((asset) => asset.status === 'production-approved').map((asset) => asset.id));
  const allAssetIds = new Set(assets.map((asset) => asset.id));
  validateCustomers(registries.customers.all, approvedAssetIds, allAssetIds, issues);
  validateIngredients(registries.ingredients.all, approvedAssetIds, allAssetIds, issues);
  validateRecipes(registries, approvedAssetIds, allAssetIds, issues);
  validateOrders(registries, approvedAssetIds, allAssetIds, issues);
  validateShifts(registries, issues);
  validateChapters(registries, issues);
  validateTransformations(registries.transformations.all, registries.customers.all, approvedAssetIds, allAssetIds, issues);

  return { valid: issues.length === 0, issues };
}

function readManifestAssets(manifest: unknown, issues: string[]): readonly { id: string; status: string }[] {
  try {
    return getManifestAssets(manifest);
  } catch (error) {
    issues.push(`Invalid asset manifest: ${errorMessage(error)}.`);
    return [];
  }
}

function validateCustomers(
  customers: readonly CustomerDefinition[],
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
  issues: string[],
): void {
  for (const customer of customers) {
    if (!Number.isFinite(customer.basePatienceMs) || customer.basePatienceMs <= 0) {
      issues.push(`Customer ${customer.id} must have positive basePatienceMs.`);
    }
    validateAssetReferences(`customer ${customer.id}`, customer.appearanceAssets, approved, allAssets, issues);
    if (customer.headAssetId && !customer.appearanceAssets.includes(customer.headAssetId)) {
      issues.push(`Customer ${customer.id} headAssetId must be one of its appearanceAssets.`);
    }
    for (const [sequence, assetId] of Object.entries(customer.reactionAssets ?? {})) {
      if (!sequence.trim()) issues.push(`Customer ${customer.id} has an empty reaction sequence ID.`);
      validateAssetReferences(`customer ${customer.id} reaction ${sequence}`, [assetId], approved, allAssets, issues);
    }
  }
}

function validateIngredients(
  ingredients: readonly IngredientDefinition[],
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
  issues: string[],
): void {
  for (const ingredient of ingredients) {
    validateAssetReferences(`ingredient ${ingredient.id}`, [ingredient.assetKey], approved, allAssets, issues);
  }
}

function validateRecipes(
  registries: Registries,
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
  issues: string[],
): void {
  for (const recipe of registries.recipes.all) {
    const ingredientIds = new Set(recipe.ingredientIds);
    checkDuplicates(`recipe ${recipe.id} ingredient`, recipe.ingredientIds, issues);
    if (!sameMembers(recipe.ingredientOrder, recipe.ingredientIds)) {
      issues.push(`Recipe ${recipe.id} ingredientOrder must contain every recipe ingredient exactly once.`);
    }
    for (const id of recipe.ingredientIds) {
      if (!registries.ingredients.has(id)) issues.push(`Recipe ${recipe.id} references unknown ingredient ${id}.`);
    }
    for (const id of recipe.requiredPrepIngredientIds) {
      if (!ingredientIds.has(id)) issues.push(`Recipe ${recipe.id} requires prep for ingredient ${id} outside its ingredients.`);
      const ingredient = registries.ingredients.get(id);
      if (!ingredient) issues.push(`Recipe ${recipe.id} references unknown prep ingredient ${id}.`);
      else if (!ingredient.requiresPrep) issues.push(`Recipe ${recipe.id} requires prep for ${id}, but that ingredient is not prep-required.`);
    }
    const grillIngredient = registries.ingredients.get(recipe.grillIngredientId);
    if (!grillIngredient) issues.push(`Recipe ${recipe.id} references unknown grill ingredient ${recipe.grillIngredientId}.`);
    else if (!grillIngredient.cookingBehaviors.includes('grill')) {
      issues.push(`Recipe ${recipe.id} grill ingredient ${recipe.grillIngredientId} has no grill behavior.`);
    }
    for (const customerType of recipe.compatibleCustomerTypes ?? []) {
      if (!registries.customers.all.some((customer) => customer.type === customerType)) {
        issues.push(`Recipe ${recipe.id} references unknown compatible customer type ${customerType}.`);
      }
    }
    validateAssetReferences(`recipe ${recipe.id}`, [recipe.baseAssembledAssetKey], approved, allAssets, issues);
    issues.push(...grillConfigIssues(`recipe ${recipe.id}`, recipe.grillTiming, recipe.grillAssetKeys, approved, allAssets));
  }
}

function validateOrders(
  registries: Registries,
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
  issues: string[],
): void {
  for (const order of registries.orders.all) {
    const recipe = registries.recipes.get(order.recipeId);
    if (!recipe) issues.push(`Order ${order.id} references unknown recipe ${order.recipeId}.`);
    else {
      if (!sameMembers(order.requiredIngredientIds, recipe.ingredientIds)) {
        issues.push(`Order ${order.id} required ingredients do not match recipe ${recipe.id}.`);
      }
      if (!sameSequence(order.expectedIngredientOrder, recipe.ingredientOrder)) {
        issues.push(`Order ${order.id} ingredient order does not match recipe ${recipe.id}.`);
      }
      if (!sameMembers(order.requiredPrepIngredientIds, recipe.requiredPrepIngredientIds)) {
        issues.push(`Order ${order.id} prep requirements do not match recipe ${recipe.id}.`);
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
    const modifierRequired = order.modifierRequired ?? true;
    if (modifierRequired && !order.requiredIngredientIds.includes(order.modifierIngredientId)) {
      issues.push(`Order ${order.id} modifier ${order.modifierIngredientId} is not a required recipe ingredient.`);
    }
    if (!registries.ingredients.has(order.modifierIngredientId)) {
      issues.push(`Order ${order.id} references unknown modifier ingredient ${order.modifierIngredientId}.`);
    }
    if (!order.requiredIngredientIds.includes(order.grillIngredientId)) {
      issues.push(`Order ${order.id} grill ingredient ${order.grillIngredientId} is not required.`);
    }
    for (const id of order.requiredIngredientIds) {
      if (!registries.ingredients.has(id)) issues.push(`Order ${order.id} references unknown ingredient ${id}.`);
    }
    for (const id of order.requiredPrepIngredientIds) {
      const ingredient = registries.ingredients.get(id);
      if (!order.requiredIngredientIds.includes(id)) issues.push(`Order ${order.id} requires prep for non-required ingredient ${id}.`);
      if (!ingredient) issues.push(`Order ${order.id} references unknown prep ingredient ${id}.`);
      else if (!ingredient.requiresPrep) issues.push(`Order ${order.id} requires prep for ${id}, but it is not prep-required.`);
    }
    validateAssetReferences(`order ${order.id}`, [order.baseAssembledAssetKey, order.assembledAssetKey], approved, allAssets, issues);
    issues.push(...grillConfigIssues(`order ${order.id}`, order.grillTiming, order.grillAssetKeys, approved, allAssets));
    if (order.reactionSequence !== undefined && !order.reactionSequence.trim()) {
      issues.push(`Order ${order.id} reactionSequence must not be empty.`);
    }
  }
}

function validateShifts(registries: Registries, issues: string[]): void {
  for (const shift of registries.shifts.all) {
    checkDuplicates(`shift ${shift.id} slot`, shift.orderSequence.map((slot) => slot.id), issues);
    if (shift.orderSequence.length === 0) issues.push(`Shift ${shift.id} has no order slots.`);
    for (const slot of shift.orderSequence) {
      const order = registries.orders.get(slot.orderId);
      const customer = registries.customers.get(slot.customerId);
      if (!order) issues.push(`Shift ${shift.id} references unknown order ${slot.orderId}.`);
      if (!customer) issues.push(`Shift ${shift.id} references unknown customer ${slot.customerId}.`);
      if (order && customer) {
        const recipe = registries.recipes.get(order.recipeId);
        const compatibleTypes = recipe?.compatibleCustomerTypes;
        if (recipe && compatibleTypes?.length && !compatibleTypes.includes(customer.type)) {
          issues.push(`Shift ${shift.id} assigns recipe ${recipe.id} to incompatible customer type ${customer.type}.`);
        }
      }
      if (!slot.customerInstanceId.trim()) issues.push(`Shift ${shift.id} slot ${slot.id} has an empty customer instance ID.`);
    }
  }
}

function validateChapters(registries: Registries, issues: string[]): void {
  for (const chapter of registries.chapters.all) {
    checkDuplicates(`chapter ${chapter.id} shift`, chapter.shiftIds, issues);
    if (chapter.shiftIds.length === 0) issues.push(`Chapter ${chapter.id} has no shifts.`);
    for (const shiftId of chapter.shiftIds) {
      if (!registries.shifts.has(shiftId)) issues.push(`Chapter ${chapter.id} references unknown shift ${shiftId}.`);
    }
  }
}

function validateTransformations(
  transformations: readonly TransformationDefinition[],
  customers: readonly CustomerDefinition[],
  approved: ReadonlySet<string>,
  allAssets: ReadonlySet<string>,
  issues: string[],
): void {
  const customerTypes = new Set(customers.map((customer) => customer.type));
  for (const transformation of transformations) {
    for (const type of transformation.compatibleCustomerTypes) {
      if (!customerTypes.has(type)) issues.push(`Transformation ${transformation.id} references unknown customer type ${type}.`);
    }
    validateAssetReferences(`transformation ${transformation.id}`, transformation.appearanceAssets, approved, allAssets, issues);
    validateAssetReferences(`transformation ${transformation.id} effects`, transformation.effectAssets ?? [], approved, allAssets, issues);
    if (transformation.appearanceMode === 'full' && transformation.appearanceAssets.length !== 1) {
      issues.push(`Transformation ${transformation.id} full appearance must contain one authored appearance asset.`);
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

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return (
    left.length === right.length &&
    leftSet.size === left.length &&
    rightSet.size === right.length &&
    left.every((id) => rightSet.has(id))
  );
}

function sameSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
