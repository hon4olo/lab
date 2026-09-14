import Phaser from 'phaser';

const BASE_LAYERS = [
  'customer.business-cat.body',
  'customer.business-cat.head',
  'customer.business-cat.eyes',
  'customer.business-cat.pupils',
  'customer.business-cat.mouth',
  'customer.business-cat.arms',
  'customer.business-cat.hands',
  'customer.business-cat.accessories',
] as const;

export class BusinessCatPresenter {
  private readonly root: Phaser.GameObjects.Container;
  private readonly mutationLayers = new Map<string, Phaser.GameObjects.Image>();
  private shownMutation = '';

  public constructor(private readonly scene: Phaser.Scene) {
    const base = BASE_LAYERS.map((assetId) => scene.add.image(0, 0, assetId));
    this.root = scene.add.container(0, 0, base);
    this.root.setDepth(8).setAlpha(0);
    for (const assetId of [
      'customer.business-cat.mutation.fire-accents',
      'customer.business-cat.mutation.glow-eyes',
      'customer.business-cat.mutation.singed-tie',
    ]) {
      const layer = scene.add.image(0, 0, assetId).setVisible(false);
      this.mutationLayers.set(assetId, layer);
      this.root.add(layer);
    }
  }

  public layout(x: number, y: number, size: number): void {
    this.root.setPosition(x, y);
    for (const child of this.root.list) {
      if (child instanceof Phaser.GameObjects.Image) child.setDisplaySize(size, size);
    }
  }

  public enter(targetX: number, targetY: number, reducedMotion: boolean, onComplete: () => void): void {
    this.root.setPosition(targetX + Math.max(100, this.scene.scale.width * 0.42), targetY);
    this.root.setAlpha(1);
    if (reducedMotion) {
      this.root.setPosition(targetX, targetY);
      onComplete();
      return;
    }
    this.scene.tweens.add({
      targets: this.root,
      x: targetX,
      duration: 650,
      ease: 'Back.Out',
      onComplete,
    });
  }

  public setMutation(assetIds: readonly string[]): void {
    const next = [...assetIds].join('|');
    if (next === this.shownMutation) return;
    this.shownMutation = next;
    for (const [assetId, layer] of this.mutationLayers) layer.setVisible(assetIds.includes(assetId));
  }

  public anticipate(reducedMotion: boolean): void {
    if (reducedMotion) return;
    this.scene.tweens.add({
      targets: this.root,
      scaleX: 1.035,
      scaleY: 0.97,
      yoyo: true,
      duration: 250,
      repeat: 1,
      ease: 'Sine.InOut',
    });
  }

  public leave(reducedMotion: boolean, onComplete: () => void): void {
    if (reducedMotion) {
      this.root.setAlpha(0);
      onComplete();
      return;
    }
    this.scene.tweens.add({
      targets: this.root,
      x: this.root.x + this.scene.scale.width * 0.55,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.In',
      onComplete,
    });
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.root.x, y: this.root.y };
  }
}
