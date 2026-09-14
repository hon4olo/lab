import type { FoodInstance } from '../cooking/FoodInstance';
import type { CustomerInstance } from '../customers/CustomerInstance';
import type {
  TransformationContext,
  TransformationDefinition,
  TransformationRarity,
} from './TransformationDefinition';

const RARITY_WEIGHT: Readonly<Record<TransformationRarity, number>> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
};

interface RankedTransformation {
  readonly definition: TransformationDefinition;
  readonly preferredMatches: number;
}

export function resolveTransformation(
  food: FoodInstance,
  customer: CustomerInstance,
  context: TransformationContext,
  definitions: readonly TransformationDefinition[],
): TransformationDefinition | null {
  const candidates = definitions
    .filter((definition) => isEligible(definition, food, customer, context))
    .map((definition): RankedTransformation => ({
      definition,
      preferredMatches: countMatches(definition.preferredTags, food.tags),
    }))
    .sort(compareRanked);

  return candidates[0]?.definition ?? null;
}

function isEligible(
  definition: TransformationDefinition,
  food: FoodInstance,
  customer: CustomerInstance,
  context: TransformationContext,
): boolean {
  return (
    food.chaosScore >= definition.minimumChaos &&
    definition.requiredTags.every((tag) => food.tags.has(tag)) &&
    definition.forbiddenTags.every((tag) => !food.tags.has(tag)) &&
    (definition.compatibleCustomerTypes.length === 0 ||
      definition.compatibleCustomerTypes.includes(customer.type)) &&
    definition.requiredUnlocks.every((id) => context.unlockedIds.has(id))
  );
}

function countMatches(tags: readonly string[], foodTags: ReadonlySet<string>): number {
  return tags.reduce((count, tag) => count + Number(foodTags.has(tag)), 0);
}

function compareRanked(left: RankedTransformation, right: RankedTransformation): number {
  return (
    right.definition.priority - left.definition.priority ||
    right.preferredMatches - left.preferredMatches ||
    RARITY_WEIGHT[right.definition.rarity] - RARITY_WEIGHT[left.definition.rarity] ||
    left.definition.id.localeCompare(right.definition.id)
  );
}
