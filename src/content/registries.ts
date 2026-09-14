import { BUSINESS_CAT } from './customers/businessCat';
import { HOT_CHEESE_BURGER_INGREDIENTS } from './ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER } from './recipes/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from './orders/hotCheeseBurgerExtraSpicy';
import { FIRST_SHIFT } from './shifts/firstShift';
import { FIRST_CHAPTER } from './chapters/firstChapter';
import { TRANSFORMATIONS } from './transformations';
import { ContentRegistry } from './ContentRegistry';
import type { CustomerDefinition } from '../game/customers/CustomerDefinition';
import type { IngredientDefinition } from '../game/ingredients/IngredientDefinition';
import type { OrderDefinition } from '../game/orders/OrderDefinition';
import type { ShiftDefinition } from '../game/shifts/ShiftDefinition';
import type { TransformationDefinition } from '../game/transformations/TransformationDefinition';
import type { ChapterDefinition } from '../game/campaign/ChapterDefinition';
import type { RecipeDefinition } from '../game/recipes/RecipeDefinition';

export interface SnackLabContentRegistries {
  readonly customers: ContentRegistry<CustomerDefinition>;
  readonly ingredients: ContentRegistry<IngredientDefinition>;
  readonly recipes: ContentRegistry<RecipeDefinition>;
  readonly orders: ContentRegistry<OrderDefinition>;
  readonly shifts: ContentRegistry<ShiftDefinition>;
  readonly chapters: ContentRegistry<ChapterDefinition>;
  readonly transformations: ContentRegistry<TransformationDefinition>;
}

export const SNACK_LAB_CONTENT_REGISTRIES: SnackLabContentRegistries = {
  customers: new ContentRegistry([BUSINESS_CAT]),
  ingredients: new ContentRegistry(HOT_CHEESE_BURGER_INGREDIENTS),
  recipes: new ContentRegistry([HOT_CHEESE_BURGER]),
  orders: new ContentRegistry([HOT_CHEESE_BURGER_EXTRA_SPICY]),
  shifts: new ContentRegistry([FIRST_SHIFT]),
  chapters: new ContentRegistry([FIRST_CHAPTER]),
  transformations: new ContentRegistry(TRANSFORMATIONS),
};
