import Phaser from 'phaser';
import { APP_EVENTS } from '../appEvents';

export class ShellScene extends Phaser.Scene {
  public constructor() {
    super('ShellScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.game.events.emit(APP_EVENTS.shellReady);
  }
}
