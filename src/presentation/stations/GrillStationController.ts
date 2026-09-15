import Phaser from 'phaser';
import type { GrillSnapshot } from '../../game/cooking/GrillSession';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderAction } from '../order/orderActions';
import { STREET_STATION_ASSET_IDS } from './StationAssetContract';
import { grillStationGeometry } from './cookingStationGeometry';

type GrillAssetKeys = NonNullable<OrderDefinition['grillAssetKeys']>;

import type { GrillSlotGeometry } from './cookingStationGeometry';

export { grillStationGeometry, type GrillStationGeometry } from './cookingStationGeometry';

/**
 * Phaser-only hands-on grill interaction. It never invents visual fallback art:
 * callers must construct it only after the dedicated grill shell, spatula and
 * recipe grill-state textures have passed the runtime asset gate.
 */
export class GrillStationController {
  private readonly rawSource: Phaser.GameObjects.Image;
  private readonly spatula: Phaser.GameObjects.Image;
  private readonly item: Phaser.GameObjects.Image;
  private readonly dragPreview: Phaser.GameObjects.Image;
  private readonly steam: Phaser.GameObjects.Image;
  private readonly smoke: Phaser.GameObjects.Image;
  private slots: readonly GrillSlotGeometry[] = [];
  private visible = false;
  private draggingRaw = false;
  private spatulaSelected = false;
  private snapshot: GrillSnapshot | null = null;
  private fxSignature = '';
  private fxTween: Phaser.Tweens.Tween | null = null;

  private readonly pointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible || !this.draggingRaw) return;
    this.dragPreview.setPosition(pointer.x, pointer.y - (pointer.wasTouch ? 34 : 0));
  };

  private readonly pointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible || !this.draggingRaw) return;
    this.draggingRaw = false;
    this.dragPreview.setVisible(false);
    const slot = this.nearestSlot(pointer.x, pointer.y);
    if (slot && !this.snapshot?.active) this.onAction({ type: 'grill-place', slotId: slot.id });
  };

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly grillAssetKeys: GrillAssetKeys,
    private readonly onAction: (action: OrderAction) => void,
  ) {
    this.rawSource = scene.add.image(0, 0, grillAssetKeys.raw).setDepth(18);
    this.spatula = scene.add.image(0, 0, STREET_STATION_ASSET_IDS.grillSpatula).setDepth(18);
    this.item = scene.add.image(0, 0, grillAssetKeys.raw).setDepth(16);
    this.dragPreview = scene.add.image(0, 0, grillAssetKeys.raw).setDepth(40).setVisible(false);
    this.steam = scene.add.image(0, 0, 'fx.grill-steam').setDepth(20).setVisible(false);
    this.smoke = scene.add.image(0, 0, 'fx.smoke.small').setDepth(20).setVisible(false);

    this.rawSource.setInteractive({ useHandCursor: true }).on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.visible || this.snapshot?.active) return;
      this.draggingRaw = true;
      this.dragPreview.setVisible(true).setPosition(pointer.x, pointer.y - (pointer.wasTouch ? 34 : 0));
    });
    this.spatula.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (!this.visible || !this.snapshot?.active) return;
      this.spatulaSelected = !this.spatulaSelected;
      this.renderToolSelection();
    });
    this.item.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (!this.visible || !this.snapshot?.active || !this.spatulaSelected) return;
      if (!this.snapshot.flipped) {
        this.onAction({ type: 'grill-flip' });
        this.spatulaSelected = false;
        this.renderToolSelection();
        return;
      }
      this.onAction({ type: 'grill-remove' });
      this.spatulaSelected = false;
      this.renderToolSelection();
    });

    scene.input.on('pointermove', this.pointerMove);
    scene.input.on('pointerup', this.pointerUp);
    this.setVisible(false);
  }

  public layout(width: number, height: number): void {
    const geometry = grillStationGeometry(width, height);
    this.slots = geometry.slots;
    this.layoutImage(this.rawSource, geometry.sourceX, geometry.sourceY, geometry.sourceWidth);
    this.layoutImage(this.dragPreview, this.dragPreview.x, this.dragPreview.y, geometry.sourceWidth);
    this.layoutImage(this.spatula, geometry.spatulaX, geometry.spatulaY, geometry.spatulaWidth);
    this.layoutGrillItem();
    this.layoutStateFx();
  }

  public render(snapshot: GrillSnapshot): void {
    this.snapshot = snapshot;
    const active = this.visible && snapshot.active;
    this.rawSource.setVisible(this.visible && !snapshot.active && !this.draggingRaw);
    this.spatula.setVisible(this.visible && snapshot.active);
    this.item.setVisible(active);
    if (!active) {
      this.spatulaSelected = false;
      this.renderToolSelection();
      this.hideStateFx();
      return;
    }

    this.item.setTexture(this.assetForState(snapshot.state));
    this.item.setAngle(snapshot.flipped ? 180 : 0);
    this.layoutGrillItem();
    this.renderStateFx(snapshot);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.rawSource.setVisible(visible && !this.snapshot?.active);
    this.spatula.setVisible(visible && Boolean(this.snapshot?.active));
    this.item.setVisible(visible && Boolean(this.snapshot?.active));
    if (visible) return;
    this.draggingRaw = false;
    this.spatulaSelected = false;
    this.dragPreview.setVisible(false);
    this.hideStateFx();
    this.renderToolSelection();
  }

  public destroy(): void {
    this.scene.input.off('pointermove', this.pointerMove);
    this.scene.input.off('pointerup', this.pointerUp);
    this.rawSource.destroy();
    this.spatula.destroy();
    this.item.destroy();
    this.dragPreview.destroy();
    this.fxTween?.stop();
    this.steam.destroy();
    this.smoke.destroy();
  }

  private nearestSlot(x: number, y: number): GrillSlotGeometry | null {
    let best: GrillSlotGeometry | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const slot of this.slots) {
      const distance = Phaser.Math.Distance.Between(x, y, slot.x, slot.y);
      if (distance <= slot.hitRadius && distance < bestDistance) {
        best = slot;
        bestDistance = distance;
      }
    }
    return best;
  }

  private layoutGrillItem(): void {
    if (!this.snapshot?.slotId) return;
    const slot = this.slots.find((candidate) => candidate.id === this.snapshot?.slotId);
    if (!slot) return;
    const geometry = grillStationGeometry(this.scene.scale.width, this.scene.scale.height);
    this.layoutImage(this.item, slot.x, slot.y, geometry.itemWidth);
  }

  private layoutStateFx(): void {
    const slot = this.snapshot?.slotId
      ? this.slots.find((candidate) => candidate.id === this.snapshot?.slotId)
      : null;
    if (!slot) return;
    const geometry = grillStationGeometry(this.scene.scale.width, this.scene.scale.height);
    const fxSize = Math.min(geometry.itemWidth * 0.72, 260);
    const fxY = slot.y - geometry.itemWidth * 0.42;
    this.steam.setPosition(slot.x, fxY).setDisplaySize(fxSize, fxSize);
    this.smoke.setPosition(slot.x, fxY).setDisplaySize(fxSize * 0.86, fxSize * 0.86);
  }

  private renderStateFx(snapshot: GrillSnapshot): void {
    const slot = snapshot.slotId
      ? this.slots.find((candidate) => candidate.id === snapshot.slotId)
      : null;
    if (!slot) {
      this.hideStateFx();
      return;
    }

    const key = `${snapshot.slotId}:${snapshot.state}`;
    const fx = snapshot.state === 'burned' ? this.smoke : this.steam;
    const otherFx = fx === this.steam ? this.smoke : this.steam;
    otherFx.setVisible(false);
    if (snapshot.state === 'raw') {
      this.hideStateFx();
      return;
    }

    fx.setVisible(this.visible);
    if (key === this.fxSignature) return;
    this.fxSignature = key;
    this.layoutStateFx();
    this.fxTween?.stop();
    fx.setScale(1).setY(fx.y);
    fx.setAlpha(snapshot.state === 'burned' ? 0.78 : 0.62);
    this.fxTween = this.scene.tweens.add({
      targets: fx,
      y: fx.y - (snapshot.state === 'burned' ? 20 : 30),
      alpha: 0.16,
      scale: snapshot.state === 'burned' ? 1.12 : 1.22,
      duration: snapshot.state === 'burned' ? 820 : 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private hideStateFx(): void {
    this.fxSignature = '';
    this.fxTween?.stop();
    this.fxTween = null;
    this.steam.setVisible(false);
    this.smoke.setVisible(false);
  }

  private layoutImage(image: Phaser.GameObjects.Image, x: number, y: number, width: number): void {
    const source = this.scene.textures.get(image.texture.key).getSourceImage();
    image.setPosition(x, y).setDisplaySize(width, source.height * (width / source.width));
  }

  private renderToolSelection(): void {
    this.spatula.setAlpha(this.spatulaSelected ? 1 : 0.72);
  }

  private assetForState(state: GrillSnapshot['state']): string {
    switch (state) {
      case 'raw': return this.grillAssetKeys.raw;
      case 'cooked': return this.grillAssetKeys.cooked;
      case 'perfect': return this.grillAssetKeys.perfect;
      case 'burned': return this.grillAssetKeys.burned;
    }
  }
}
