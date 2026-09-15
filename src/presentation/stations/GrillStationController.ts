import Phaser from 'phaser';
import type { GrillSnapshot } from '../../game/cooking/GrillSession';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderAction } from '../order/orderActions';
import { STREET_STATION_ASSET_IDS } from './StationAssetContract';

interface GrillSlot {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly hitRadius: number;
}

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
  private slots: readonly GrillSlot[] = [];
  private visible = false;
  private draggingRaw = false;
  private spatulaSelected = false;
  private snapshot: GrillSnapshot | null = null;

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
    private readonly grillAssetKeys: OrderDefinition['grillAssetKeys'],
    private readonly onAction: (action: OrderAction) => void,
  ) {
    this.rawSource = scene.add.image(0, 0, grillAssetKeys.raw).setDepth(18);
    this.spatula = scene.add.image(0, 0, STREET_STATION_ASSET_IDS.spatula).setDepth(18);
    this.item = scene.add.image(0, 0, grillAssetKeys.raw).setDepth(16);
    this.dragPreview = scene.add.image(0, 0, grillAssetKeys.raw).setDepth(40).setVisible(false);

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
    const portrait = width < height;
    const grillWidth = portrait ? width * 0.72 : Math.min(width * 0.52, 720);
    const grillHeight = portrait ? height * 0.38 : Math.min(height * 0.56, 460);
    const centerX = width * 0.5;
    const centerY = height * (portrait ? 0.44 : 0.48);
    const dx = grillWidth * 0.24;
    const dy = grillHeight * 0.22;
    const radius = Math.min(grillWidth, grillHeight) * 0.20;
    this.slots = [
      { id: 'slot-1', x: centerX - dx, y: centerY - dy, hitRadius: radius },
      { id: 'slot-2', x: centerX + dx, y: centerY - dy, hitRadius: radius },
      { id: 'slot-3', x: centerX - dx, y: centerY + dy, hitRadius: radius },
      { id: 'slot-4', x: centerX + dx, y: centerY + dy, hitRadius: radius },
    ];

    const sourceWidth = Math.min(width * (portrait ? 0.28 : 0.13), 155);
    this.layoutImage(this.rawSource, width * (portrait ? 0.23 : 0.15), height * 0.82, sourceWidth);
    this.layoutImage(this.dragPreview, this.dragPreview.x, this.dragPreview.y, sourceWidth);
    this.layoutImage(this.spatula, width * (portrait ? 0.78 : 0.86), height * 0.80, Math.min(sourceWidth * 0.78, 120));
    this.layoutGrillItem();
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
      return;
    }

    this.item.setTexture(this.assetForState(snapshot.state));
    this.item.setAngle(snapshot.flipped ? 180 : 0);
    this.layoutGrillItem();
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
    this.renderToolSelection();
  }

  public destroy(): void {
    this.scene.input.off('pointermove', this.pointerMove);
    this.scene.input.off('pointerup', this.pointerUp);
    this.rawSource.destroy();
    this.spatula.destroy();
    this.item.destroy();
    this.dragPreview.destroy();
  }

  private nearestSlot(x: number, y: number): GrillSlot | null {
    let best: GrillSlot | null = null;
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
    const viewportWidth = this.scene.scale.width;
    const width = Math.min(viewportWidth * (viewportWidth < this.scene.scale.height ? 0.28 : 0.15), 165);
    this.layoutImage(this.item, slot.x, slot.y, width);
  }

  private layoutImage(image: Phaser.GameObjects.Image, x: number, y: number, width: number): void {
    const source = this.scene.textures.get(image.texture.key).getSourceImage();
    image.setPosition(x, y).setDisplaySize(width, source.height * (width / source.width));
  }

  private renderToolSelection(): void {
    this.spatula.setAlpha(this.spatulaSelected ? 1 : 0.86);
    this.spatula.setScale(this.spatulaSelected ? 1.08 : 1);
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
