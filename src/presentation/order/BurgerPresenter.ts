import Phaser from 'phaser';
import type { CookState } from '../../game/cooking/GrillSession';

const PATTY_ASSETS: Readonly<Record<CookState, string>> = {
  raw: 'food.burger.patty.raw',
  cooked: 'food.burger.patty.cooked',
  perfect: 'food.burger.patty.perfect',
  burned: 'food.burger.patty.burned',
};

export class BurgerPresenter {
  private readonly foodImage: Phaser.GameObjects.Image;
  private currentAsset = '';

  public constructor(private readonly scene: Phaser.Scene) {
    this.foodImage = scene.add.image(0, 0, PATTY_ASSETS.raw).setVisible(false).setDepth(11);
  }

  public layout(x: number, y: number, width: number, assembled: boolean, assembledAssetKey: string): void {
    this.foodImage.setPosition(x, y);
    this.foodImage.setVisible(true);
    if (assembled) this.setAsset(assembledAssetKey);
    else if (!this.currentAsset) this.setAsset(PATTY_ASSETS.raw);
    this.setImageSize(width);
  }

  public setCookState(state: CookState): void {
    this.setAsset(PATTY_ASSETS[state]);
  }

  public setAssembled(assetKey: string): void {
    this.setAsset(assetKey);
    this.scene.tweens.add({
      targets: this.foodImage,
      scaleX: this.foodImage.scaleX * 1.08,
      scaleY: this.foodImage.scaleY * 0.92,
      yoyo: true,
      duration: 160,
      ease: 'Back.Out',
    });
  }

  public hide(): void {
    this.foodImage.setVisible(false);
  }

  public destroy(): void {
    this.foodImage.destroy();
  }

  private setAsset(assetKey: string): void {
    if (this.currentAsset === assetKey) return;
    this.currentAsset = assetKey;
    this.foodImage.setTexture(assetKey);
  }

  private setImageSize(width: number): void {
    const texture = this.scene.textures.get(this.currentAsset).getSourceImage();
    const scale = width / texture.width;
    this.foodImage.setDisplaySize(width, texture.height * scale);
  }
}
