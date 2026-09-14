import Phaser from 'phaser';
import type { CookState } from '../../game/cooking/GrillSession';

export class FeedbackDirector {
  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly reducedMotion: boolean,
  ) {}

  public ingredientSelected(x: number, y: number): void {
    const sparkle = this.spawn('fx.sparkle.small', x, y, 0.34, 12);
    this.scene.tweens.add({
      targets: sparkle,
      scale: this.reducedMotion ? 0.38 : 0.66,
      alpha: 0,
      duration: this.reducedMotion ? 90 : 240,
      onComplete: () => sparkle.destroy(),
    });
  }

  public grillStateChanged(state: CookState, x: number, y: number): void {
    const key = state === 'burned' ? 'fx.smoke.small' : 'fx.grill-steam';
    const steam = this.spawn(key, x, y - 44, state === 'perfect' ? 0.72 : 0.5, 12);
    this.scene.tweens.add({
      targets: steam,
      y: steam.y - (this.reducedMotion ? 18 : 48),
      alpha: 0,
      duration: this.reducedMotion ? 120 : 620,
      onComplete: () => steam.destroy(),
    });
  }

  public transformation(x: number, y: number): void {
    if (this.reducedMotion) {
      const fire = this.spawn('fx.fire-burst', x, y, 0.42, 14, 130);
      this.scene.time.delayedCall(260, () => fire.destroy());
      return;
    }

    const flashSize = Math.max(this.scene.scale.width, this.scene.scale.height);
    const flash = this.spawn('fx.transformation-flash', x, y, 0.74, 13, flashSize);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 160,
      onComplete: () => flash.destroy(),
    });

    const fire = this.spawn('fx.fire-burst', x, y, 0.92, 14, 190);
    this.scene.tweens.add({
      targets: fire,
      scale: 1.5,
      alpha: 0,
      duration: 640,
      ease: 'Cubic.Out',
      onComplete: () => fire.destroy(),
    });
  }

  public payment(x: number, y: number): void {
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const sparkle = this.spawn('fx.coin-sparkle', x, y, 0.38, 14);
      this.scene.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * 52,
        y: y + Math.sin(angle) * 34,
        alpha: 0,
        duration: this.reducedMotion ? 100 : 420,
        delay: index * 35,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private spawn(
    assetKey: string,
    x: number,
    y: number,
    scale: number,
    depth: number,
    displaySize?: number,
  ): Phaser.GameObjects.Image {
    const image = this.scene.add.image(x, y, assetKey).setDepth(depth).setAlpha(1);
    if (displaySize) image.setDisplaySize(displaySize, displaySize);
    else image.setScale(scale);
    return image;
  }
}
