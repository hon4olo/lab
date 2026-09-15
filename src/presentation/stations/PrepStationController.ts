import Phaser from 'phaser';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { OrderAction } from '../order/orderActions';
import { STREET_STATION_ASSET_IDS } from './StationAssetContract';
import { prepStationGeometry } from './cookingStationGeometry';

export { prepStationGeometry, type PrepStationGeometry } from './cookingStationGeometry';

/**
 * Direct-manipulation Prep interaction for the first Street Snack Bar recipes.
 * The player drags the cookable ingredient from stock onto the authored prep
 * surface. The drag target preview reuses the authored food sprite so the
 * player can see where the object will land without adding programmer art.
 */
export class PrepStationController {
  private readonly source: Phaser.GameObjects.Image;
  private readonly placed: Phaser.GameObjects.Image;
  private readonly dragPreview: Phaser.GameObjects.Image;
  private readonly targetPreview: Phaser.GameObjects.Image;
  private readonly knife: Phaser.GameObjects.Image | null;
  private visible = false;
  private dragging = false;
  private prepared = false;
  private previouslyPrepared = false;
  private target = new Phaser.Geom.Rectangle();
  private sourceX = 0;
  private sourceY = 0;
  private sourceWidth = 120;
  private placedWidth = 150;

  private readonly pointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible || !this.dragging) return;
    this.dragPreview.setPosition(pointer.x, pointer.y - (pointer.wasTouch ? 36 : 0));
  };

  private readonly pointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible || !this.dragging) return;
    this.dragging = false;
    this.dragPreview.setVisible(false);
    this.targetPreview.setVisible(false);
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
    this.targetPreview = scene.add.image(0, 0, sourceAssetKey)
      .setDepth(14)
      .setAlpha(0.24)
      .setVisible(false);
    this.knife = scene.textures.exists(STREET_STATION_ASSET_IDS.prepKnife)
      ? scene.add.image(0, 0, STREET_STATION_ASSET_IDS.prepKnife).setDepth(17)
      : null;

    this.source.setInteractive({ useHandCursor: true }).on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.visible || this.prepared) return;
      this.dragging = true;
      this.source.setVisible(false);
      this.dragPreview.setVisible(true).setPosition(pointer.x, pointer.y - (pointer.wasTouch ? 36 : 0));
      this.targetPreview.setVisible(true);
    });

    scene.input.on('pointermove', this.pointerMove);
    scene.input.on('pointerup', this.pointerUp);
    this.setVisible(false);
  }

  public layout(width: number, height: number): void {
    const geometry = prepStationGeometry(width, height);
    this.sourceWidth = geometry.sourceWidth;
    this.sourceX = geometry.sourceX;
    this.sourceY = geometry.sourceY;
    this.target.setTo(geometry.target.x, geometry.target.y, geometry.target.width, geometry.target.height);
    this.placedWidth = geometry.placedWidth;

    this.layoutImage(this.source, this.sourceX, this.sourceY, this.sourceWidth);
    this.layoutImage(this.dragPreview, this.dragPreview.x, this.dragPreview.y, this.sourceWidth);
    this.layoutImage(
      this.targetPreview,
      geometry.target.x + geometry.target.width / 2,
      geometry.target.y + geometry.target.height / 2,
      this.placedWidth,
    );
    this.layoutImage(
      this.placed,
      geometry.target.x + geometry.target.width / 2,
      geometry.target.y + geometry.target.height / 2,
      this.placedWidth,
    );
    if (this.knife) {
      this.layoutImage(this.knife, geometry.knifeX, geometry.knifeY, geometry.knifeWidth);
      this.knife.setAngle(-8);
    }
  }

  public render(snapshot: OrderSnapshot): void {
    this.prepared = snapshot.preparedIngredients.includes(this.ingredientId);
    if (this.prepared && !this.previouslyPrepared && this.knife) {
      this.scene.tweens.add({
        targets: this.knife,
        angle: 8,
        duration: 170,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }
    this.previouslyPrepared = this.prepared;
    this.renderVisibility();
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      this.dragging = false;
      this.dragPreview.setVisible(false);
      this.targetPreview.setVisible(false);
    }
    this.renderVisibility();
  }

  public destroy(): void {
    this.scene.input.off('pointermove', this.pointerMove);
    this.scene.input.off('pointerup', this.pointerUp);
    this.source.destroy();
    this.placed.destroy();
    this.dragPreview.destroy();
    this.targetPreview.destroy();
    this.knife?.destroy();
  }

  private renderVisibility(): void {
    this.source.setVisible(this.visible && !this.prepared && !this.dragging);
    this.placed.setVisible(this.visible && this.prepared);
    this.targetPreview.setVisible(this.visible && this.dragging && !this.prepared);
    this.knife?.setVisible(this.visible);
    if (!this.visible || !this.dragging) this.dragPreview.setVisible(false);
  }

  private layoutImage(image: Phaser.GameObjects.Image, x: number, y: number, width: number): void {
    const source = this.scene.textures.get(this.sourceAssetKey).getSourceImage();
    image.setPosition(x, y).setDisplaySize(width, source.height * (width / source.width));
  }
}
