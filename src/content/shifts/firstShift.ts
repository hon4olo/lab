import type { ShiftDefinition } from '../../game/shifts/ShiftDefinition';

export const FIRST_SHIFT: ShiftDefinition = {
  id: 'shift.street-snack-bar.first',
  orderSequence: [
    {
      id: 'shift.street-snack-bar.first.order-01',
      orderId: 'order.hot-cheese-burger.extra-spicy',
      customerId: 'customer.business-cat',
      customerInstanceId: 'customer.business-cat.first-shift-order-01',
    },
    {
      id: 'shift.street-snack-bar.first.order-02',
      orderId: 'order.cheesy-street-hot-dog',
      customerId: 'customer.picky-pigeon',
      customerInstanceId: 'customer.picky-pigeon.first-shift-order-02',
    },
  ],
};
