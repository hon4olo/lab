import { describe, expect, it } from 'vitest';
import { createStationPresentation, stationModeForPhase } from '../../src/presentation/order/stationPresentation';
import { calculateOrderLayout, finalizeOrderLayout } from '../../src/presentation/order/orderLayout';

describe('customer-facing station presentation', () => {
  it('keeps request acceptance on the customer-facing Order station', () => {
    expect(stationModeForPhase('ingredient-selection')).toBe('order');
    const layout = finalizeOrderLayout(calculateOrderLayout(1280, 720));
    const presentation = createStationPresentation(layout, 'order');
    expect(presentation.showCustomer).toBe(true);
    expect(presentation.showCounter).toBe(true);
    expect(presentation.showStation).toBe(false);
  });

  it('keeps the Serve station customer-facing with a dedicated counter composition', () => {
    const layout = finalizeOrderLayout(calculateOrderLayout(360, 640));
    const presentation = createStationPresentation(layout, 'serve');
    expect(presentation.showCustomer).toBe(true);
    expect(presentation.showCounter).toBe(true);
    expect(presentation.showStation).toBe(false);
    expect(presentation.customerSize).toBeGreaterThan(0);
    expect(presentation.counterWidth).toBeGreaterThan(0);
  });

  it('does not expose a customer behind dedicated food workspaces', () => {
    const layout = finalizeOrderLayout(calculateOrderLayout(1440, 900));
    for (const mode of ['prep', 'grill', 'build'] as const) {
      const presentation = createStationPresentation(layout, mode);
      expect(presentation.showCustomer).toBe(false);
      expect(presentation.showCounter).toBe(false);
    }
  });
});
