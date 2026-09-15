import { describe, expect, it } from 'vitest';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { CHEESY_STREET_HOT_DOG_ORDER } from '../../src/content/orders/cheesyStreetHotDog';
import { HOT_CHEESE_BURGER } from '../../src/content/recipes/hotCheeseBurger';
import { CHEESY_STREET_HOT_DOG } from '../../src/content/recipes/cheesyStreetHotDog';
import { resolveOrderAssemblyDefinition } from '../../src/game/orders/resolveOrderAssemblyDefinition';

function minCountFor(
  assembly: ReturnType<typeof resolveOrderAssemblyDefinition>,
  ingredientId: string,
): number | undefined {
  return assembly.rules.find((rule) => rule.ingredientId === ingredientId)?.minCount;
}

describe('resolveOrderAssemblyDefinition', () => {
  it('promotes the required extra-spicy modifier into a required hands-on burger placement', () => {
    const recipeAssembly = HOT_CHEESE_BURGER.assembly;
    expect(recipeAssembly).toBeDefined();
    const assembly = resolveOrderAssemblyDefinition(HOT_CHEESE_BURGER_EXTRA_SPICY, recipeAssembly!);

    expect(assembly.id).toContain(HOT_CHEESE_BURGER_EXTRA_SPICY.id);
    expect(minCountFor(assembly, 'ingredient.bun-bottom')).toBe(1);
    expect(minCountFor(assembly, 'ingredient.sauce')).toBe(1);
    expect(minCountFor(assembly, 'ingredient.extra-spicy')).toBe(1);
  });

  it('keeps an optional hot-dog chaos sauce optional while requiring the ordered base food', () => {
    const recipeAssembly = CHEESY_STREET_HOT_DOG.assembly;
    expect(recipeAssembly).toBeDefined();
    const assembly = resolveOrderAssemblyDefinition(CHEESY_STREET_HOT_DOG_ORDER, recipeAssembly!);

    expect(minCountFor(assembly, 'ingredient.hotdog-bun')).toBe(1);
    expect(minCountFor(assembly, 'ingredient.sausage')).toBe(1);
    expect(minCountFor(assembly, 'ingredient.glow-sauce')).toBe(0);
  });
});
