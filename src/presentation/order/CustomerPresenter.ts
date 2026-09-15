import Phaser from 'phaser';
import type { CustomerDefinition } from '../../game/customers/CustomerDefinition';

export interface CustomerLayoutOptions {
  /**
   * Reaction presentations use a central hero treatment. The character keeps
   * the same authored texture and anchor; only the presentation scale/depth
   * changes so the deterministic transformation remains untouched.
   */
  readonly hero?: boolean;
}

export class CustomerPresenter {
  private readonly root: Phaser.GameObjects.Container;
  private readonly baseLayers: readonly Phaser.GameObjects.Image[];
  private readonly headLayer: Phaser.GameObjects.Image | null;
  private readonly mutationLayers = new Map<string, Phaser.GameObjects.Image>();
  private shownMutation = '';
  private characterSize = 0;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly customer: CustomerDefinition,
  ) {
    this.baseLayers = customer.appearanceAssets.map((assetId) => scene.add.image(0, 0, assetId));
    this.headLayer = customer.headAssetId
      ? this.baseLayers.find((layer) => layer.texture.key === customer.headAssetId) ?? null
      : null;
    this.root = scene.add.container(0, 0, [...this.baseLayers]);
    this.root.setDepth(8).setAlpha(0);
  }

  public setReaction(sequence: string | null): void {
    if (!this.headLayer) return;
    const reactionAsset = sequence ? this.customer.reactionAssets?.[sequence] : undefined;
    this.headLayer.setTexture(reactionAsset ?? this.customer.headAssetId ?? this.headLayer.texture.key);
  }

  public layout(x: number, y: number, size: number, options: CustomerLayoutOptions = {}): void {
    this.characterSize = size;
    this.root.setPosition(x, y).setScale(1).setDepth(options.hero ? 18 : 8);
    for (const child of this.root.list) {
      if (child instanceof Phaser.GameObjects.Image) child.setDisplaySize(size, size);
    }
  }

  public setVisible(visible: boolean): void {
    this.root.setVisible(visible);
  }

  public enter(targetX: number, targetY: number, reducedMotion: boolean, onComplete: () => void): void {
    this.root.setVisible(true);
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

  public setMutation(assetIds: readonly string[], mode: 'overlay' | 'full' = 'overlay'): void {
    const next = `${mode}:${assetIds.join('|')}`;
    if (next === this.shownMutation) return;
    this.shownMutation = next;
    for (const layer of this.baseLayers) layer.setVisible(mode !== 'full');
    for (const assetId of assetIds) {
      let layer = this.mutationLayers.get(assetId);
      if (!layer) {
        layer = this.scene.add.image(0, 0, assetId).setVisible(false);
        if (this.characterSize > 0) layer.setDisplaySize(this.characterSize, this.characterSize);
        this.root.add(layer);
        this.mutationLayers.set(assetId, layer);
      }
      layer.setVisible(true);
    }
    for (const [assetId, layer] of this.mutationLayers) {
      layer.setVisible(assetIds.includes(assetId));
    }
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

  public destroy(): void {
    this.root.destroy(true);
  }
}
