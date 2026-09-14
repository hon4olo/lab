import Phaser from 'phaser';
import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ShellScene } from './scenes/ShellScene';

export function createGame(): Phaser.Game {
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
    scene: [BootScene, PreloadScene, ShellScene],
  });
}
