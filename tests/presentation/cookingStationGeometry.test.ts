import { describe, expect, it } from 'vitest';
import { grillStationGeometry, prepStationGeometry } from '../../src/presentation/stations/cookingStationGeometry';

const VIEWPORTS = [
  { name: 'portrait', width: 360, height: 640 },
  { name: 'landscape mobile', width: 844, height: 390 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'large desktop', width: 1440, height: 900 },
] as const;

describe('Prep station presentation geometry', () => {
  it.each(VIEWPORTS)('keeps the authored board as a generous drop target at $name', ({ width, height }) => {
    const geometry = prepStationGeometry(width, height);
    const center = { x: width / 2, y: height * (width < height ? 0.68 : 0.69) };

    expect(geometry.target.width).toBeGreaterThanOrEqual(width * (width < height ? 0.80 : 0.54));
    expect(geometry.target.height).toBeGreaterThanOrEqual(height * 0.27);
    expect(center.x).toBeGreaterThanOrEqual(geometry.target.x);
    expect(center.x).toBeLessThanOrEqual(geometry.target.x + geometry.target.width);
    expect(center.y).toBeGreaterThanOrEqual(geometry.target.y);
    expect(center.y).toBeLessThanOrEqual(geometry.target.y + geometry.target.height);
    expect(geometry.sourceWidth).toBeGreaterThan(width * (width < height ? 0.40 : 0.20));
    expect(geometry.placedWidth).toBeGreaterThan(geometry.sourceWidth);
    expect(geometry.knifeWidth).toBeGreaterThan(60);
  });
});

describe('Grill station presentation geometry', () => {
  it.each(VIEWPORTS)('keeps four readable grill zones and a large tool at $name', ({ width, height }) => {
    const geometry = grillStationGeometry(width, height);
    const centers = geometry.slots.map(({ x, y }) => `${x}:${y}`);

    expect(geometry.slots).toHaveLength(4);
    expect(new Set(centers).size).toBe(4);
    expect(geometry.itemWidth).toBeGreaterThan(width < height ? 180 : height < 500 ? 170 : 280);
    expect(geometry.sourceWidth).toBeGreaterThan(geometry.itemWidth * 0.80);
    expect(geometry.spatulaWidth).toBeGreaterThan(width < height ? 90 : 150);
    for (const slot of geometry.slots) {
      expect(slot.x).toBeGreaterThan(0);
      expect(slot.x).toBeLessThan(width);
      expect(slot.y).toBeGreaterThan(0);
      expect(slot.y).toBeLessThan(height);
      expect(slot.hitRadius).toBeGreaterThan(30);
    }
  });
});
