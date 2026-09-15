import type { OrderActionLabel, OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderPhase, OrderSnapshot } from '../../game/orders/OrderSession';
import {
  allRequiredModifiersSelected,
  requiredModifierIngredientIds,
} from '../../game/orders/OrderRequirements';

export type OrderAction =
  | { readonly type: 'ingredient'; readonly ingredientId: string; readonly x: number; readonly y: number }
  | { readonly type: 'open-prep' }
  | { readonly type: 'prepare-ingredient'; readonly ingredientId: string }
  | { readonly type: 'continue-grill' }
  | { readonly type: 'toggle-grill' }
  | { readonly type: 'assemble' }
  | { readonly type: 'add-modifier'; readonly ingredientId: string }
  | { readonly type: 'serve' }
  | { readonly type: 'replay-shift' };

export function hasOrderAction(phase: OrderPhase): boolean {
  return ['ingredient-selection', 'prep-board', 'grilling', 'assembly', 'modifier-selection'].includes(phase);
}

export function getActionLabel(snapshot: OrderSnapshot, order: OrderDefinition): OrderActionLabel {
  switch (snapshot.phase) {
    case 'ingredient-selection': return 'action.open-prep';
    case 'prep-board':
      return (order.requiredPrepIngredientIds ?? []).some(
        (id) => snapshot.selectedIngredients.includes(id) && !snapshot.preparedIngredients.includes(id),
      )
        ? 'action.prepare-ingredient'
        : 'action.continue-grill';
    case 'grilling': return snapshot.grill.active ? 'action.stop-grill' : 'action.start-grill';
    case 'modifier-selection': return allRequiredModifiersSelected(order, snapshot.selectedIngredients)
      ? 'action.serve'
      : 'action.add-modifier';
    case 'assembly': return snapshot.assembled ? 'action.serve' : 'action.assemble';
    default: return 'action.open-prep';
  }
}

export function getOrderAction(snapshot: OrderSnapshot, order: OrderDefinition): OrderAction | null {
  switch (getActionLabel(snapshot, order)) {
    case 'action.open-prep': return snapshot.phase === 'ingredient-selection' ? { type: 'open-prep' } : null;
    case 'action.prepare-ingredient': {
      const ingredientId = (order.requiredPrepIngredientIds ?? []).find(
        (id) => snapshot.selectedIngredients.includes(id) && !snapshot.preparedIngredients.includes(id),
      );
      return ingredientId ? { type: 'prepare-ingredient', ingredientId } : { type: 'continue-grill' };
    }
    case 'action.continue-grill': return { type: 'continue-grill' };
    case 'action.start-grill':
    case 'action.stop-grill': return { type: 'toggle-grill' };
    case 'action.assemble': return { type: 'assemble' };
    case 'action.add-modifier': {
      const ingredientId = requiredModifierIngredientIds(order).find(
        (id) => !snapshot.selectedIngredients.includes(id),
      );
      return ingredientId ? { type: 'add-modifier', ingredientId } : { type: 'serve' };
    }
    case 'action.serve': return { type: 'serve' };
    default: return null;
  }
}

export function createEmptyOrderSnapshot(orderId: string): OrderSnapshot {
  return {
    orderId,
    phase: 'customer-entering',
    customerPhase: 'entering',
    patience: { remainingMs: 0, elapsedMs: 0, ratio: 1, expired: false, paused: false },
    selectedIngredients: [],
    preparedIngredients: [],
    food: null,
    grill: { active: false, elapsedMs: 0, state: 'raw', progress: 0, result: null },
    assembled: false,
    scores: null,
    transformationResult: null,
    payment: null,
  };
}
