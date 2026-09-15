import { describe, expect, it } from 'vitest';
import { assemblyPointToScreen, dragVisualPosition, screenToAssemblyPoint } from '../../src/presentation/stations/AssemblyWorkspaceMapper';
import { canEnableHandsOnStations, missingApprovedStationAssets, requiredStationAssetIds } from '../../src/presentation/stations/StationAssetContract';
import type { ProductionAsset } from '../../src/assets/assetManifest';

describe('hands-on station preparation', () => {
  it('round-trips normalized assembly coordinates through a responsive workspace', () => {
    const rect = { x: 100, y: 50, width: 800, height: 500 };
    const screen = assemblyPointToScreen(rect, { x: 0.25, y: 0.8 });
    expect(screen).toEqual({ x: 300, y: 450 });
    expect(screenToAssemblyPoint(rect, screen.x, screen.y)).toEqual({ x: 0.25, y: 0.8 });
    expect(screenToAssemblyPoint(rect, -999, 9999)).toEqual({ x: 0, y: 1 });
  });

  it('offsets only the touch drag visual, not the intended pointer position', () => {
    expect(dragVisualPosition(220, 300, 'mouse')).toEqual({ x: 220, y: 300 });
    expect(dragVisualPosition(220, 300, 'touch', 48)).toEqual({ x: 220, y: 252 });
  });

  it('does not enable station rebuild until every required asset is approved', () => {
    const ids = requiredStationAssetIds('burger-build');
    const manifest: ProductionAsset[] = ids.map((id, index) => ({
      id,
      path: `assets/test/${index}.png`,
      status: index === ids.length - 1 ? 'planned' : 'production-approved',
    }));
    expect(canEnableHandsOnStations(manifest, ['burger-build'])).toBe(false);
    expect(missingApprovedStationAssets(manifest, ['burger-build'])).toEqual([ids.at(-1)]);

    const approved = manifest.map((asset) => ({ ...asset, status: 'production-approved' }));
    expect(canEnableHandsOnStations(approved, ['burger-build'])).toBe(true);
  });
});
