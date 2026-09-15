import Phaser from 'phaser';
import {
  BURGER_BUILD_ASSET_IDS,
  HOTDOG_BUILD_ASSET_IDS,
} from './StationAssetContract';
import { calculateBuildShelfLayout, type AssemblyWorkspaceRect } from './AssemblyWorkspaceMapper';

export type BuildToolMode = 'ingredient' | 'sauce';

export interface BuildToolDefinition {
  readonly ingredientId: string;
  readonly mode: BuildToolMode;
  readonly assetKey: string;
}

const BURGER_TOOLS: readonly BuildToolDefinition[] = [
  { ingredientId: 'ingredient.bun-bottom', mode: 'ingredient', assetKey: BURGER_BUILD_ASSET_IDS.bottomBun },
  { ingredientId: 'ingredient.patty', mode: 'ingredient', assetKey: BURGER_BUILD_ASSET_IDS.patty },
  { ingredientId: 'ingredient.cheese', mode: 'ingredient', assetKey: BURGER_BUILD_ASSET_IDS.cheese },
  { ingredientId: 'ingredient.sauce', mode: 'sauce', assetKey: BURGER_BUILD_ASSET_IDS.sauceBottle },
  { ingredientId: 'ingredient.extra-spicy', mode: 'ingredient', assetKey: BURGER_BUILD_ASSET_IDS.chiliPiece },
  { ingredientId: 'ingredient.bun-top', mode: 'ingredient', assetKey: BURGER_BUILD_ASSET_IDS.topBun },
] as const;

const HOTDOG_TOOLS: readonly BuildToolDefinition[] = [
  { ingredientId: 'ingredient.hotdog-bun', mode: 'ingredient', assetKey: HOTDOG_BUILD_ASSET_IDS.bun },
  { ingredientId: 'ingredient.sausage', mode: 'ingredient', assetKey: HOTDOG_BUILD_ASSET_IDS.sausage },
  { ingredientId: 'ingredient.hotdog-cheese', mode: 'ingredient', assetKey: HOTDOG_BUILD_ASSET_IDS.cheese },
  { ingredientId: 'ingredient.pickle', mode: 'ingredient', assetKey: HOTDOG_BUILD_ASSET_IDS.picklePiece },
  { ingredientId: 'ingredient.mustard', mode: 'sauce', assetKey: HOTDOG_BUILD_ASSET_IDS.mustardBottle },
  { ingredientId: 'ingredient.glow-sauce', mode: 'sauce', assetKey: HOTDOG_BUILD_ASSET_IDS.glowBottle },
] as const;

interface ToolVisual {
  readonly definition: BuildToolDefinition;
  readonly slot: Phaser.GameObjects.Image;
  readonly image: Phaser.GameObjects.Image;
}

export function buildToolsForRecipe(recipeId: string): readonly BuildToolDefinition[] {
  switch (recipeId) {
    case 'recipe.hot-cheese-burger': return BURGER_TOOLS;
    case 'recipe.cheesy-street-hot-dog': return HOTDOG_TOOLS;
    default: return [];
  }
}

export class BuildStationShelfPresenter {
  private readonly visuals: readonly ToolVisual[];
  private selectedSauceId: string | null = null;

  public constructor(
    scene: Phaser.Scene,
    recipeId: string,
    onToolPointerDown: (tool: BuildToolDefinition, pointer: Phaser.Input.Pointer) => void,
  ) {
    this.visuals = buildToolsForRecipe(recipeId).map((definition) => {
      const slot = scene.add.image(0, 0, 'ui.ingredient-slot')
        .setDepth(21)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => onToolPointerDown(definition, pointer));
      const image = scene.add.image(0, 0, definition.assetKey)
        .setDepth(22);
      return { definition, slot, image };
    });
  }

  public layout(
    screenWidth: number,
    screenHeight: number,
    workspace: AssemblyWorkspaceRect,
  ): void {
    if (this.visuals.length === 0) return;
    const shelf = calculateBuildShelfLayout(screenWidth, screenHeight, workspace, this.visuals.length);

    this.visuals.forEach((visual, index) => {
      const slot = shelf.slots[index];
      if (!slot) return;
      visual.slot.setPosition(slot.x, slot.y).setDisplaySize(slot.size, slot.size);
      const source = visual.image.scene.textures.get(visual.definition.assetKey).getSourceImage();
      const maxWidth = visual.definition.mode === 'sauce' ? slot.size * 0.72 : slot.size * 0.84;
      const maxHeight = visual.definition.mode === 'sauce' ? slot.size * 0.84 : slot.size * 0.72;
      const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
      visual.image.setPosition(slot.x, slot.y).setDisplaySize(source.width * scale, source.height * scale);
    });
  }

  public selectSauce(ingredientId: string | null): void {
    this.selectedSauceId = ingredientId;
    for (const visual of this.visuals) {
      const selected = visual.definition.mode === 'sauce' && visual.definition.ingredientId === ingredientId;
      visual.slot.setAlpha(this.selectedSauceId === null || selected ? 1 : 0.62);
      visual.image.setAlpha(this.selectedSauceId === null || selected ? 1 : 0.72);
    }
  }

  public setVisible(visible: boolean): void {
    for (const visual of this.visuals) {
      visual.slot.setVisible(visible);
      visual.image.setVisible(visible);
      if (visual.image.input) visual.image.input.enabled = visible;
      if (visual.slot.input) visual.slot.input.enabled = visible;
    }
  }

  public destroy(): void {
    for (const visual of this.visuals) {
      visual.slot.destroy();
      visual.image.destroy();
    }
  }
}
