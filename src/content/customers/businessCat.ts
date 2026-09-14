import type { CustomerDefinition } from '../../game/customers/CustomerDefinition';

export const BUSINESS_CAT: CustomerDefinition = {
  id: 'customer.business-cat',
  type: 'business-cat',
  variantId: 'customer.business-cat.neutral',
  displayNameKey: 'order.customer',
  basePatience: 1,
  appearanceAssets: [
    'customer.business-cat.body',
    'customer.business-cat.head',
    'customer.business-cat.eyes',
    'customer.business-cat.pupils',
    'customer.business-cat.mouth',
    'customer.business-cat.arms',
    'customer.business-cat.hands',
    'customer.business-cat.accessories',
  ],
};
