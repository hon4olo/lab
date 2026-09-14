import { describe, expect, it } from 'vitest';
import manifest from '../../public/assets/manifest.json';
import { BUSINESS_CAT } from '../../src/content/customers/businessCat';
import { HOT_CHEESE_BURGER } from '../../src/content/recipes/hotCheeseBurger';
import { ContentRegistry } from '../../src/content/ContentRegistry';
import { SNACK_LAB_CONTENT_REGISTRIES, type SnackLabContentRegistries } from '../../src/content/registries';
import { validateSnackLabContent } from '../../src/content/validateSnackLabContent';

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

  it('reports recipe/order ingredient and sequence mismatches', () => {
    const order = SNACK_LAB_CONTENT_REGISTRIES.orders.all[0]!;
    const registries = withRegistries({
      orders: new ContentRegistry([{ ...order, expectedIngredientOrder: [...order.expectedIngredientOrder].reverse() }]),
    });

    expect(validateSnackLabContent(registries, manifest).issues.join('\n')).toContain(
      'Order order.hot-cheese-burger.extra-spicy ingredient order does not match recipe recipe.hot-cheese-burger',
    );
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
});

function withRegistries(overrides: Partial<SnackLabContentRegistries>): SnackLabContentRegistries {
  return { ...SNACK_LAB_CONTENT_REGISTRIES, ...overrides };
}
