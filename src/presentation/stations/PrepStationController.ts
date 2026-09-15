import Phaser from 'phaser';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { OrderAction } from '../order/orderActions';

/**
 * Direct-manipulation Prep interaction for the first Street Snack Bar recipes.
 * The player drags the cookable ingredient from stock onto the authored prep
 * surface. No synthetic target graphics are rendered; the production
 * background itself communicates the work surface.
 */
export class PrepStationController {
  private readonly source: Phaser.GameObjects.Image;
  private readonly placed: Phaser.GameObjects.Image;
  private readonly dragPreview: Phaser.GameObjects.Image;
  private visible = false;
  private dragging = false;
  private prepared = false;
  private target = new Phaser.Geom.Rectangle();
  private sourceX = 0;
  private sourceY = 0;
  private sourceWidth = 120;

  private readonly pointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible || !this.dragging) return;
    this.dragPreview.setPosition(pointer.x, pointer.y - (pointer.wasTouch ? 36 : 0));
  };

  private readonly pointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible || !this.dragging) return;
    this.dragging = false;
    this.dragPreview.setVisible(false);
    if (!this.prepared && Phaser.Geom.Rectangle.Contains(this.target, pointer.x, pointer.y)) {
      this.onAction({ type: 'prepare-ingredient', ingredientId: this.ingredientId });
    }
    this.renderVisibility();
  };

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly ingredientId: string,
    private readonly sourceAssetKey: string,
    private readonly onAction: (action: OrderAction) => void,
  ) {
    this.source = scene.add.image(0, 0, sourceAssetKey).setDepth(18);
    this.placed = scene.add.image(0, 0, sourceAssetKey).setDepth(16);
    this.dragPreview = scene.add.image(0, 0, sourceAssetKey).setDepth(40).setVisible(false);

    this.source.setInteractive({ useHandCursor: true }).on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.visible || this.prepared) return;
      this.dragging = true;
      this.source.setVisible(false);
      this.dragPreview.setVisible(true).setPosition(pointer.x, pointer.y - (pointer.wasTouch ? 36 : 0));
    });

    scene.input.on('pointermove', this.pointerMove);
    scene.input.on('pointerup', this.pointerUp);
    this.setVisible(false);
  }

  public layout(width: number, height: number): void {
    const portrait = width < height;
    this.sourceWidth = Math.min(width * (portrait ? 0.30 : 0.15), 170);
    this.sourceX = width * (portrait ? 0.20 : 0.14);
    this.sourceY = height * (portrait ? 0.86 : 0.85);

    // The approved Prep background already contains the authored wooden work board.
    // Keep the invisible drop target on that board instead of the old generic
    // mid-screen workspace so the interaction reads as part of the environment.
    const targetWidth = width * (portrait ? 0.82 : 0.56);
    const targetHeight = height * (portrait ? 0.28 : 0.30);
    const centerX = width * 0.5;
    const centerY = height * (portrait ? 0.68 : 0.69);
    this.target.setTo(
      centerX - targetWidth / 2,
      centerY - targetHeight / 2,
      targetWidth,
      targetHeight,
    );

    this.layoutImage(this.source, this.sourceX, this.sourceY, this.sourceWidth);
    this.layoutImage(this.dragPreview, this.dragPreview.x, this.dragPreview.y, this.sourceWidth);
    this.layoutImage(this.placed, centerX, centerY, Math.min(this.sourceWidth * 1.18, 190));
  }

  public render(snapshot: OrderSnapshot): void {
    this.prepared = snapshot.preparedIngredients.includes(this.ingredientId);
    this.renderVisibility();
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      this.dragging = false;
      this.dragPreview.setVisible(false);
    }
    this.renderVisibility();
  }

  public destroy(): void {
    this.scene.input.off('pointermove', this.pointerMove);
    this.scene.input.off('pointerup', this.pointerUp);
    this.source.destroy();
    this.placed.destroy();
    this.dragPreview.destroy();
  }

  private renderVisibility(): void {
    this.source.setVisible(this.visible && !this.prepared && !this.dragging);
    this.placed.setVisible(this.visible && this.prepared);
    if (!this.visible || !this.dragging) this.dragPreview.setVisible(false);
  }

  private layoutImage(image: Phaser.GameObjects.Image, x: number, y: number, width: number): void {
    const source = this.scene.textures.get(this.sourceAssetKey).getSourceImage();
    image.setPosition(x, y).setDisplaySize(width, source.height * (width / source.width));
  }
}
