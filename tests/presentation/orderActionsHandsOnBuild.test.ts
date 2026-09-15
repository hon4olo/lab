import { describe, expect, it } from 'vitest';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import {
  createEmptyOrderSnapshot,
  getActionLabel,
  getOrderAction,
} from '../../src/presentation/order/orderActions';

function buildSnapshot(assemblyReady: boolean, assembled = false) {
  return {
    ...createEmptyOrderSnapshot(HOT_CHEESE_BURGER_EXTRA_SPICY.id),
    phase: 'assembly' as const,
    assembled,
    assemblyReady,
    assembly: { placements: [], sauceStrokes: [] },
  };
}

describe('hands-on Build Station order actions', () => {
  it('does not expose the legacy one-click assembler when production Build is gated', () => {
    const snapshot = buildSnapshot(false);
    expect(getActionLabel(snapshot, HOT_CHEESE_BURGER_EXTRA_SPICY, false)).toBe('action.finish-build');
    expect(getOrderAction(snapshot, HOT_CHEESE_BURGER_EXTRA_SPICY, false)).toBeNull();
  });

  it('does not expose completion until the spatial build satisfies minimum rules', () => {
    const snapshot = buildSnapshot(false);
    expect(getActionLabel(snapshot, HOT_CHEESE_BURGER_EXTRA_SPICY, true)).toBe('action.finish-build');
    expect(getOrderAction(snapshot, HOT_CHEESE_BURGER_EXTRA_SPICY, true)).toBeNull();
  });

  it('completes the spatial build when ready and serves only after completion', () => {
    const ready = buildSnapshot(true);
    expect(getOrderAction(ready, HOT_CHEESE_BURGER_EXTRA_SPICY, true)).toEqual({ type: 'complete-build' });

    const assembled = buildSnapshot(true, true);
    expect(getActionLabel(assembled, HOT_CHEESE_BURGER_EXTRA_SPICY, true)).toBe('action.serve');
    expect(getOrderAction(assembled, HOT_CHEESE_BURGER_EXTRA_SPICY, true)).toEqual({ type: 'serve' });
  });
});
