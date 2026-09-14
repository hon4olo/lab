import type Phaser from 'phaser';
import type { PlatformService } from '../platform/PlatformService';
import { SCENARIO_NAMES, type ScenarioName } from './scenarios';

interface DebugSnapshot {
  readonly currentScene: string | null;
  readonly shift: null;
  readonly customer: null;
  readonly order: null;
  readonly food: null;
  readonly station: null;
  readonly score: null;
  readonly coins: number;
  readonly unlockedContent: readonly string[];
  readonly fps: number;
  readonly platform: {
    readonly providerId: string;
    readonly capabilities: PlatformService['capabilities'];
  };
}

interface SnackLabDebugBridge {
  getSnapshot(): DebugSnapshot;
  readonly scenarios: readonly ScenarioName[];
}

declare global {
  interface Window {
    SNACK_LAB?: SnackLabDebugBridge;
  }
}

export function installDebugBridge(game: Phaser.Game, platform: PlatformService): void {
  if (!import.meta.env.DEV) return;

  document.documentElement.dataset.snackLabDebug = 'ready';
  window.SNACK_LAB = Object.freeze({
    scenarios: SCENARIO_NAMES,
    getSnapshot: () => createSnapshot(game, platform),
  });
}

function createSnapshot(game: Phaser.Game, platform: PlatformService): DebugSnapshot {
  const activeScene = game.scene.getScenes(true).at(-1);
  return structuredClone({
    currentScene: activeScene?.scene.key ?? null,
    shift: null,
    customer: null,
    order: null,
    food: null,
    station: null,
    score: null,
    coins: 0,
    unlockedContent: [],
    fps: Math.round(game.loop.actualFps),
    platform: {
      providerId: platform.environment.providerId,
      capabilities: platform.capabilities,
    },
  });
}
