import { describe, expect, it } from 'vitest';
import manifest from '../../public/assets/manifest.json';
import { BUSINESS_CAT } from '../../src/content/customers/businessCat';
import { CHEESY_STREET_HOT_DOG_ORDER } from '../../src/content/orders/cheesyStreetHotDog';
import { HOT_CHEESE_BURGER } from '../../src/content/recipes/hotCheeseBurger';
import { ContentRegistry } from '../../src/content/ContentRegistry';
import { SNACK_LAB_CONTENT_REGISTRIES, type SnackLabContentRegistries } from '../../src/content/registries';
import { validateSnackLabContent } from '../../src/content/validateSnackLabContent';
import { resolveOrderAvailableIngredientIds } from '../../src/game/orders/OrderRequirements';

describe('Snack Lab content validation', () => {
  it('accepts the authored first chapter and its production-approved assets', () => {
    expect(validateSnackLabContent(SNACK_LAB_CONTENT_REGISTRIES, manifest)).toEqual({ valid: true, issues: [] });
  });

  it('reports duplicate IDs within a registry', () => {
    const registries = withRegistries({
      customers: new ContentRegistry([...SNACK_LAB_CONTENT_REGISTRIES.customers.all, BUSINESS_CAT]),
    });

    expect(validateSnackLabContent(registries, manifest).issues.join('\n')).toContain(
      'Duplicate customer ID: customer.business-cat',
    );
  });

  it('reports broken chapter-to-shift and shift-to-customer references', () => {
    const registries = withRegistries({
      chapters: new ContentRegistry([{ id: 'street-snack-bar', shiftIds: ['shift.missing'] }]),
    });

    expect(validateSnackLabContent(registries, manifest).issues.join('\n')).toContain(
      'Chapter street-snack-bar references unknown shift shift.missing',
    );
  });

  it('reports shifts that reference unknown orders or customers', () => {
    const shift = SNACK_LAB_CONTENT_REGISTRIES.shifts.all[0]!;
    const registries = withRegistries({
      shifts: new ContentRegistry([{
        ...shift,
        orderSequence: [{ ...shift.orderSequence[0]!, orderId: 'order.missing', customerId: 'customer.missing' }],
      }]),
    });
    const issues = validateSnackLabContent(registries, manifest).issues.join('\n');

    expect(issues).toContain('Shift shift.street-snack-bar.first references unknown order order.missing');
    expect(issues).toContain('Shift shift.street-snack-bar.first references unknown customer customer.missing');
  });

  it('reports recipe/order ingredient order mismatches', () => {
    const order = SNACK_LAB_CONTENT_REGISTRIES.orders.all[0]!;
    const registries = withRegistries({
      orders: new ContentRegistry([{ ...order, expectedIngredientOrder: [...order.expectedIngredientOrder].reverse() }]),
    });

    expect(validateSnackLabContent(registries, manifest).issues.join('\n')).toContain(
      'Order order.hot-cheese-burger.extra-spicy ingredient order must follow recipe recipe.hot-cheese-burger',
    );
  });

  it('accepts an order variation that uses a recipe subset, optional pool, removal, and modifier', () => {
    const baseOrder = SNACK_LAB_CONTENT_REGISTRIES.orders.get('order.hot-cheese-burger.extra-spicy')!;
    const variationOrder = {
      ...baseOrder,
      id: 'order.hot-cheese-burger.no-sauce.experimental',
      ingredientRequirements: {
        requiredIngredientIds: [
          'ingredient.bun-bottom',
          'ingredient.patty',
          'ingredient.bun-top',
        ],
        optionalIngredientIds: ['ingredient.cheese'],
        forbiddenIngredientIds: ['ingredient.sauce'],
      },
      requestedVariation: {
        id: 'variation.hot-cheese-burger.experimental',
        modifiers: [{ ingredientId: 'ingredient.extra-spicy' }],
        assembledAssetKey: 'food.burger.extra-spicy',
      },
      expectedIngredientOrder: [
        'ingredient.bun-bottom',
        'ingredient.patty',
        'ingredient.cheese',
        'ingredient.extra-spicy',
        'ingredient.bun-top',
      ],
    };
    const registries = withRegistries({
      orders: new ContentRegistry([
        ...SNACK_LAB_CONTENT_REGISTRIES.orders.all,
        variationOrder,
      ]),
    });

    expect(validateSnackLabContent(registries, manifest)).toEqual({ valid: true, issues: [] });
    expect(resolveOrderAvailableIngredientIds(variationOrder)).toEqual([
      'ingredient.bun-bottom',
      'ingredient.patty',
      'ingredient.bun-top',
      'ingredient.cheese',
      'ingredient.extra-spicy',
    ]);
  });

  it('rejects an order requirement outside the recipe ingredient contract', () => {
    const order = SNACK_LAB_CONTENT_REGISTRIES.orders.get('order.hot-cheese-burger.extra-spicy')!;
    const registries = withRegistries({
      orders: new ContentRegistry([{
        ...order,
        ingredientRequirements: {
          ...order.ingredientRequirements,
          optionalIngredientIds: ['ingredient.glow-sauce'],
        },
      }]),
    });

    expect(validateSnackLabContent(registries, manifest).issues.join('\n')).toContain(
      "Order order.hot-cheese-burger.extra-spicy ingredient ingredient.glow-sauce is outside recipe recipe.hot-cheese-burger's available ingredient contract.",
    );
  });

  it('accepts plain and multi-modifier variations without duplicating the recipe', () => {
    const baseOrder = SNACK_LAB_CONTENT_REGISTRIES.orders.get('order.hot-cheese-burger.extra-spicy')!;
    const { requestedVariation, ...plainBaseOrder } = baseOrder;
    expect(requestedVariation).toBeDefined();
    const plainOrder = {
      ...plainBaseOrder,
      id: 'order.hot-cheese-burger.plain',
      expectedIngredientOrder: [
        'ingredient.bun-bottom',
        'ingredient.patty',
        'ingredient.cheese',
        'ingredient.sauce',
        'ingredient.bun-top',
      ],
    };
    const multiModifierOrder = {
      ...baseOrder,
      id: 'order.hot-cheese-burger.double-modified',
      ingredientRequirements: {
        requiredIngredientIds: [
          'ingredient.bun-bottom',
          'ingredient.patty',
          'ingredient.cheese',
          'ingredient.bun-top',
        ],
      },
      requestedVariation: {
        id: 'variation.hot-cheese-burger.double-modified',
        modifiers: [
          { ingredientId: 'ingredient.sauce' },
          { ingredientId: 'ingredient.extra-spicy' },
        ],
        assembledAssetKey: 'food.burger.extra-spicy',
      },
      expectedIngredientOrder: [
        'ingredient.bun-bottom',
        'ingredient.patty',
        'ingredient.cheese',
        'ingredient.sauce',
        'ingredient.extra-spicy',
        'ingredient.bun-top',
      ],
    };
    const registries = withRegistries({
      orders: new ContentRegistry([
        ...SNACK_LAB_CONTENT_REGISTRIES.orders.all,
        plainOrder,
        multiModifierOrder,
      ]),
    });

    expect(validateSnackLabContent(registries, manifest)).toEqual({ valid: true, issues: [] });
    expect(resolveOrderAvailableIngredientIds(plainOrder)).not.toContain('ingredient.extra-spicy');
    expect(resolveOrderAvailableIngredientIds(multiModifierOrder)).toEqual(expect.arrayContaining([
      'ingredient.sauce',
      'ingredient.extra-spicy',
    ]));
  });

  it('requires prep-listed ingredients to exist and actually require prep', () => {
    const ingredients = SNACK_LAB_CONTENT_REGISTRIES.ingredients.all.map((ingredient) =>
      ingredient.id === 'ingredient.patty' ? { ...ingredient, requiresPrep: false } : ingredient,
    );
    const registries = withRegistries({ ingredients: new ContentRegistry(ingredients) });

    expect(validateSnackLabContent(registries, manifest).issues.join('\n')).toContain(
      'requires prep for ingredient.patty, but that ingredient is not prep-required',
    );
  });

  it('checks recipe customer compatibility for authored shift assignments', () => {
    const recipe = { ...HOT_CHEESE_BURGER, compatibleCustomerTypes: ['not-authored'] };
    const registries = withRegistries({ recipes: new ContentRegistry([recipe]) });
    const issues = validateSnackLabContent(registries, manifest).issues.join('\n');

    expect(issues).toContain('references unknown compatible customer type not-authored');
    expect(issues).toContain('assigns recipe recipe.hot-cheese-burger to incompatible customer type business-cat');
  });

  it('rejects content that references an asset which is not production-approved', () => {
    const alteredManifest = JSON.parse(JSON.stringify(manifest)) as {
      assets: { id: string; status: string }[];
    };
    alteredManifest.assets.find((asset) => asset.id === 'food.burger.finished')!.status = 'planned';

    expect(validateSnackLabContent(SNACK_LAB_CONTENT_REGISTRIES, alteredManifest).issues.join('\n')).toContain(
      'references non-production-approved asset ID food.burger.finished',
    );
  });

  it('keeps the hot-dog order and recipe grill configuration aligned', () => {
    const alteredOrder = {
      ...CHEESY_STREET_HOT_DOG_ORDER,
      grillTiming: { ...CHEESY_STREET_HOT_DOG_ORDER.grillTiming!, burnedAtMs: 5_300 },
    };
    const registries = withRegistries({ orders: new ContentRegistry([
      ...SNACK_LAB_CONTENT_REGISTRIES.orders.all.filter((order) => order.id !== alteredOrder.id),
      alteredOrder,
    ]) });

    expect(validateSnackLabContent(registries, manifest).issues.join('\n')).toContain(
      'Order order.cheesy-street-hot-dog grill configuration does not match recipe recipe.cheesy-street-hot-dog',
    );
  });
});

function withRegistries(overrides: Partial<SnackLabContentRegistries>): SnackLabContentRegistries {
  return { ...SNACK_LAB_CONTENT_REGISTRIES, ...overrides };
}
