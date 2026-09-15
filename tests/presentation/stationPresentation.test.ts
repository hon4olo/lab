import { describe, expect, it } from 'vitest';
import { createStationPresentation, stationModeForPhase } from '../../src/presentation/order/stationPresentation';
import { calculateOrderLayout, finalizeOrderLayout } from '../../src/presentation/order/orderLayout';

describe('station presentation flow', () => {
  it('maps order phases into distinct player-facing stations', () => {
    expect(stationModeForPhase('customer-entering')).toBe('order');
    expect(stationModeForPhase('ingredient-selection')).toBe('order');
    expect(stationModeForPhase('prep-board')).toBe('prep');
    expect(stationModeForPhase('grilling')).toBe('grill');
    expect(stationModeForPhase('assembly')).toBe('build');
    expect(stationModeForPhase('modifier-selection')).toBe('build');
    expect(stationModeForPhase('anticipation')).toBe('serve');
    expect(stationModeForPhase('payment')).toBe('serve');
    expect(stationModeForPhase('customer-leaving')).toBe('serve');
    expect(stationModeForPhase('next-order-ready')).toBe('results');
  });

  it('removes the customer and counter from cooking workspaces', () => {
    const layout = finalizeOrderLayout(calculateOrderLayout(1280, 720));
    for (const mode of ['prep', 'grill', 'build'] as const) {
      const presentation = createStationPresentation(layout, mode);
      expect(presentation.showWorkspace).toBe(true);
      expect(presentation.showCustomer).toBe(false);
      expect(presentation.showCounter).toBe(false);
      expect(presentation.showStation).toBe(true);
    }
  });

  it('keeps source artwork at or below its intended display scale', () => {
    const desktop = createStationPresentation(
      finalizeOrderLayout(calculateOrderLayout(1440, 900)),
      'grill',
    );
    expect(desktop.stationWidth).toBeLessThanOrEqual(1440 * 0.90);
    expect(desktop.stationWidth).toBeGreaterThanOrEqual(1440 * 0.60);
    expect(desktop.customerSize).toBeLessThanOrEqual(410);
    expect(desktop.counterWidth).toBeLessThanOrEqual(1080);

    const mobile = createStationPresentation(
      finalizeOrderLayout(calculateOrderLayout(360, 640)),
      'prep',
    );
    expect(mobile.workspaceWidth).toBeLessThanOrEqual(360);
    expect(mobile.stationWidth).toBeLessThan(desktop.stationWidth);
  });

  it('keeps every hands-on surface broad, central, and inside the viewport', () => {
    const viewports = [
      [360, 640],
      [844, 390],
      [1280, 720],
      [1440, 900],
    ] as const;

    for (const [width, height] of viewports) {
      const layout = finalizeOrderLayout(calculateOrderLayout(width, height));
      for (const mode of ['prep', 'grill', 'build'] as const) {
        const presentation = createStationPresentation(layout, mode);
        const surface = presentation.workSurface;
        expect(surface.width).toBeGreaterThanOrEqual(width * 0.60);
        expect(surface.x).toBeGreaterThanOrEqual(0);
        expect(surface.y).toBeGreaterThanOrEqual(0);
        expect(surface.x + surface.width).toBeLessThanOrEqual(width);
        expect(surface.y + surface.height).toBeLessThanOrEqual(height);
        expect(presentation.backgroundAsset).toMatch(/^station\.street\.|^background\./);
      }
    }
  });

  it('keeps ticket/status controls in a separate top band', () => {
    const layout = finalizeOrderLayout(calculateOrderLayout(1280, 720));
    const prep = createStationPresentation(layout, 'prep');
    expect(prep.hudBand.y + prep.hudBand.height).toBeLessThan(prep.workSurface.y);
    expect(prep.toolBand.y).toBeGreaterThan(prep.workSurface.y);
    expect(prep.focusScale).toBeGreaterThan(1);
  });
});
