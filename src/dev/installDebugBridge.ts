import type Phaser from 'phaser';
import type { ShiftControllerSnapshot } from '../game/shifts/ShiftController';
import type { OrderSnapshot } from '../game/orders/OrderSession';
import type { PlatformService } from '../platform/PlatformService';
import { SCENARIO_NAMES, type ScenarioName } from './scenarios';

interface DebugSnapshot {
  readonly currentScene: string | null;
  readonly orderId: string | null;
  readonly orderPhase: OrderSnapshot['phase'] | null;
  readonly shiftPhase: ShiftControllerSnapshot['shift']['phase'] | null;
  readonly activeOrderIndex: number | null;
  readonly shiftEarnings: number;
  readonly selectedIngredients: readonly string[];
  readonly foodInstance: OrderSnapshot['food'] | null;
  readonly grillState: OrderSnapshot['grill'] | null;
  readonly scores: OrderSnapshot['scores'];
  readonly transformationResult: OrderSnapshot['transformationResult'];
  readonly coins: number;
  readonly persistentCoins: number;
  readonly sessionCoins: number;
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
  const orderScene = game.scene.getScene('OrderScene') as Phaser.Scene & {
    getDiagnosticsSnapshot?: () => ShiftControllerSnapshot | null;
  };
  const state = orderScene.getDiagnosticsSnapshot?.() ?? null;
  const order = state?.order ?? null;
  return structuredClone({
    currentScene: activeScene?.scene.key ?? null,
    orderId: order?.orderId ?? null,
    orderPhase: order?.phase ?? null,
    shiftPhase: state?.shift.phase ?? null,
    activeOrderIndex: state?.shift.activeOrderIndex ?? null,
    shiftEarnings: state?.shift.earnings ?? 0,
    selectedIngredients: order?.selectedIngredients ?? [],
    foodInstance: order?.food ?? null,
    grillState: order?.grill ?? null,
    scores: order?.scores ?? null,
    transformationResult: order?.transformationResult ?? null,
    coins: state?.economy.coins ?? 0,
    persistentCoins: state?.economy.persistentCoins ?? 0,
    sessionCoins: state?.economy.sessionCoins ?? 0,
    fps: Math.round(game.loop.actualFps),
    platform: {
      providerId: platform.environment.providerId,
      capabilities: platform.capabilities,
    },
  });
}
