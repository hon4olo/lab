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
  previewAssets(): Promise<void>;
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
    previewAssets: () => openAssetPreview(game),
  });
  addAssetPreviewButton(() => void window.SNACK_LAB?.previewAssets());
}

async function openAssetPreview(game: Phaser.Game): Promise<void> {
  if (game.scene.getScene('AssetPreviewScene')) {
    game.scene.start('AssetPreviewScene');
    return;
  }

  const { AssetPreviewScene } = await import('./AssetPreviewScene');
  game.scene.add('AssetPreviewScene', AssetPreviewScene, true);
}

function addAssetPreviewButton(onClick: () => void): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.snackLabQaControl = 'true';
  button.textContent = 'Asset QA';
  button.setAttribute('aria-label', 'Open development asset preview');
  Object.assign(button.style, {
    position: 'fixed',
    zIndex: '10',
    top: '12px',
    right: '12px',
    padding: '8px 12px',
    border: '1px solid #5df2c6',
    borderRadius: '8px',
    background: '#241332',
    color: '#fff1d0',
    font: '600 13px system-ui, sans-serif',
    cursor: 'pointer',
  });
  button.addEventListener('click', onClick);
  document.body.append(button);
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
