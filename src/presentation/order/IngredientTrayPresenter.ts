import Phaser from 'phaser';
import type { IngredientDefinition } from '../../game/ingredients/IngredientDefinition';
import type { TranslationKey } from '../../localization/createTranslator';
import type { OrderLayout } from './orderLayout';

export class IngredientTrayPresenter {
  private readonly tiles: IngredientTile[];
  private layoutState: OrderLayout | null = null;
  private visibleIds: readonly string[] = [];

  public constructor(
    private readonly scene: Phaser.Scene,
    ingredients: readonly IngredientDefinition[],
    onSelect: (ingredientId: string, x: number, y: number) => void,
  ) {
    this.tiles = ingredients.map((ingredient) => {
      const slot = scene.add.image(0, 0, 'ui.ingredient-slot').setDepth(20);
      const source = scene.textures.get(ingredient.assetKey).getSourceImage();
      const icon = scene.add.image(0, 0, ingredient.assetKey)
        .setDepth(21)
        .setDisplaySize(source.width > source.height ? 54 : 44, source.height > source.width ? 54 : 44);
      const label = scene.add.text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fff7e8',
        stroke: '#241332',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: 94 },
      }).setOrigin(0.5, 0).setDepth(22);
      const selected = scene.add.graphics().setDepth(23);
      slot.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        onSelect(ingredient.id, slot.x, slot.y);
      });
      return {
        id: ingredient.id,
        assetKey: ingredient.assetKey,
        displayNameKey: ingredient.displayNameKey as TranslationKey,
        slot,
        icon,
        label,
        selected,
      };
    });
  }

  public layout(layout: OrderLayout): void {
    this.layoutState = layout;
    this.positionTiles();
  }

  public render(
    selectedIds: readonly string[],
    visibleIds: readonly string[],
    localize: (key: TranslationKey) => string,
  ): void {
    const selected = new Set(selectedIds);
    this.visibleIds = visibleIds;
    this.positionTiles();
    for (const tile of this.tiles) {
      const visible = visibleIds.includes(tile.id);
      const active = selected.has(tile.id);
      tile.slot.setVisible(visible);
      tile.icon.setVisible(visible);
      tile.label.setVisible(visible).setText(localize(tile.displayNameKey));
      tile.selected.setVisible(visible && active);
      if (visible) this.drawSelected(tile, active, tile.slot.displayWidth);
    }
  }

  public destroy(): void {
    for (const tile of this.tiles) {
      tile.slot.destroy();
      tile.icon.destroy();
      tile.label.destroy();
      tile.selected.destroy();
    }
  }

  private positionTiles(): void {
    const layout = this.layoutState;
    if (!layout) return;
    const visibleTiles = this.tiles.filter((tile) => this.visibleIds.includes(tile.id));
    const centers = layout.wide
      ? visibleTiles.map((_, index) => ({
          x: layout.width * 0.34 + (index - (visibleTiles.length - 1) / 2) * Math.min(layout.width * 0.105, 96),
          y: layout.tileCenters[0]?.y ?? layout.height - 80,
        }))
      : visibleTiles.length === 1
        ? [{
            x: layout.width / 2,
            y: layout.tileCenters[4]?.y ?? layout.height - 120,
          }]
        : visibleTiles.map((_, index) => {
          const firstRowCount = Math.min(3, visibleTiles.length);
          const inFirstRow = index < firstRowCount;
          const rowIndex = inFirstRow ? index : index - firstRowCount;
          const rowCount = inFirstRow ? firstRowCount : visibleTiles.length - firstRowCount;
          const baseCenter = layout.tileCenters[inFirstRow ? 0 : 3];
          return {
            x: layout.width / 2 + (rowIndex - (rowCount - 1) / 2) * layout.width * 0.26,
            y: baseCenter?.y ?? layout.height - 120,
          };
        });
    visibleTiles.forEach((tile, index) => {
      const center = centers[index];
      if (!center) return;
      tile.slot.setPosition(center.x, center.y).setDisplaySize(layout.tileSize, layout.tileSize);
      const texture = this.scene.textures.get(tile.assetKey).getSourceImage();
      const fit = Math.min(layout.tileSize * 0.62 / texture.width, layout.tileSize * 0.62 / texture.height);
      tile.icon.setPosition(center.x, center.y - 2)
        .setDisplaySize(texture.width * fit, texture.height * fit);
      tile.label.setPosition(center.x, center.y + layout.tileSize * 0.54)
        .setFontSize(layout.wide ? (layout.compact ? '9px' : '11px') : '8px')
        .setWordWrapWidth(Math.min(layout.tileSize + 8, layout.width * 0.31));
    });
  }

  private drawSelected(tile: IngredientTile, selected: boolean, size: number): void {
    tile.selected.clear();
    if (!selected) return;
    tile.selected.lineStyle(3, 0x5df2c6, 1).strokeRoundedRect(
      tile.slot.x - size / 2,
      tile.slot.y - size / 2,
      size,
      size,
      14,
    );
  }
}

interface IngredientTile {
  readonly id: string;
  readonly assetKey: string;
  readonly displayNameKey: TranslationKey;
  readonly slot: Phaser.GameObjects.Image;
  readonly icon: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
  readonly selected: Phaser.GameObjects.Graphics;
}
