import Phaser from 'phaser';
import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { OrderScene } from './scenes/OrderScene';
import type { TranslationKey } from '../localization/createTranslator';
import type { CampaignSession } from '../game/campaign/CampaignSession';

export function createGame(
  translate: (key: TranslationKey) => string,
  campaign: CampaignSession,
  flushSave: () => Promise<void>,
): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: RUNTIME_CONFIG.canvasParentId,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: RUNTIME_CONFIG.backgroundColor,
    transparent: true,
    render: {
      antialias: true,
      roundPixels: false,
      pixelArt: false,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloadScene, new OrderScene(translate, campaign, flushSave)],
  });
}
