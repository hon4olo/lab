import { BUSINESS_CAT } from './customers/businessCat';
import { PICKY_PIGEON } from './customers/pickyPigeon';
import { HOT_CHEESE_BURGER_INGREDIENTS } from './ingredients/hotCheeseBurger';
import { CHEESY_STREET_HOT_DOG_INGREDIENTS } from './ingredients/cheesyStreetHotDog';
import { HOT_CHEESE_BURGER } from './recipes/hotCheeseBurger';
import { CHEESY_STREET_HOT_DOG } from './recipes/cheesyStreetHotDog';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from './orders/hotCheeseBurgerExtraSpicy';
import { CHEESY_STREET_HOT_DOG_ORDER } from './orders/cheesyStreetHotDog';
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
  customers: new ContentRegistry([BUSINESS_CAT, PICKY_PIGEON]),
  ingredients: new ContentRegistry([...HOT_CHEESE_BURGER_INGREDIENTS, ...CHEESY_STREET_HOT_DOG_INGREDIENTS]),
  recipes: new ContentRegistry([HOT_CHEESE_BURGER, CHEESY_STREET_HOT_DOG]),
  orders: new ContentRegistry([HOT_CHEESE_BURGER_EXTRA_SPICY, CHEESY_STREET_HOT_DOG_ORDER]),
  shifts: new ContentRegistry([FIRST_SHIFT]),
  chapters: new ContentRegistry([FIRST_CHAPTER]),
  transformations: new ContentRegistry(TRANSFORMATIONS),
};
