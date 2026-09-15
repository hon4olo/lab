import Phaser from 'phaser';
import type { FoodAssemblySnapshot, PlacedIngredient, SauceStroke } from '../../game/assembly/AssemblySession';
import { assemblyPointToScreen, type AssemblyWorkspaceRect } from './AssemblyWorkspaceMapper';
import {
  BURGER_BUILD_ASSET_IDS,
  HOTDOG_BUILD_ASSET_IDS,
  STREET_STATION_ASSET_IDS,
} from './StationAssetContract';

interface IngredientVisual {
  readonly assetKey: string;
  readonly widthRatio: number;
  readonly maxWidth: number;
}

const BURGER_VISUALS: Readonly<Record<string, IngredientVisual>> = {
  'ingredient.bun-bottom': { assetKey: BURGER_BUILD_ASSET_IDS.bottomBun, widthRatio: 0.44, maxWidth: 310 },
  'ingredient.patty': { assetKey: BURGER_BUILD_ASSET_IDS.patty, widthRatio: 0.40, maxWidth: 285 },
  'ingredient.cheese': { assetKey: BURGER_BUILD_ASSET_IDS.cheese, widthRatio: 0.42, maxWidth: 300 },
  'ingredient.extra-spicy': { assetKey: BURGER_BUILD_ASSET_IDS.chiliPiece, widthRatio: 0.075, maxWidth: 54 },
  'ingredient.bun-top': { assetKey: BURGER_BUILD_ASSET_IDS.topBun, widthRatio: 0.44, maxWidth: 310 },
};

const HOTDOG_VISUALS: Readonly<Record<string, IngredientVisual>> = {
  'ingredient.hotdog-bun': { assetKey: HOTDOG_BUILD_ASSET_IDS.bun, widthRatio: 0.50, maxWidth: 340 },
  'ingredient.sausage': { assetKey: HOTDOG_BUILD_ASSET_IDS.sausage, widthRatio: 0.38, maxWidth: 270 },
  'ingredient.hotdog-cheese': { assetKey: HOTDOG_BUILD_ASSET_IDS.cheese, widthRatio: 0.38, maxWidth: 270 },
  'ingredient.pickle': { assetKey: HOTDOG_BUILD_ASSET_IDS.picklePiece, widthRatio: 0.070, maxWidth: 50 },
};

const SAUCE_ASSETS: Readonly<Record<string, string>> = {
  'ingredient.sauce': BURGER_BUILD_ASSET_IDS.sauceStamp,
  'ingredient.mustard': HOTDOG_BUILD_ASSET_IDS.mustardStamp,
  'ingredient.glow-sauce': HOTDOG_BUILD_ASSET_IDS.glowStamp,
};

export class BuildStationPresenter {
  private readonly background: Phaser.GameObjects.Image;
  private readonly placementImages = new Map<string, Phaser.GameObjects.Image>();
  private readonly sauceImages = new Map<string, Phaser.GameObjects.Image[]>();
  private workspace: AssemblyWorkspaceRect = { x: 0, y: 0, width: 1, height: 1 };
  private visible = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly recipeId: string,
  ) {
    this.background = scene.add.image(0, 0, STREET_STATION_ASSET_IDS.buildBackground)
      .setDepth(4)
      .setVisible(false);
  }

  public layout(screenWidth: number, screenHeight: number, workspace: AssemblyWorkspaceRect): void {
    this.workspace = workspace;
    const source = this.scene.textures.get(STREET_STATION_ASSET_IDS.buildBackground).getSourceImage();
    const coverScale = Math.max(screenWidth / source.width, screenHeight / source.height);
    this.background
      .setPosition(screenWidth / 2, screenHeight / 2)
      .setDisplaySize(source.width * coverScale, source.height * coverScale);
  }

  public render(snapshot: FoodAssemblySnapshot): void {
    this.syncPlacements(snapshot.placements);
    this.syncSauces(snapshot.sauceStrokes);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.background.setVisible(visible);
    for (const image of this.placementImages.values()) image.setVisible(visible);
    for (const images of this.sauceImages.values()) images.forEach((image) => image.setVisible(visible));
  }

  public destroy(): void {
    this.background.destroy();
    for (const image of this.placementImages.values()) image.destroy();
    for (const images of this.sauceImages.values()) images.forEach((image) => image.destroy());
    this.placementImages.clear();
    this.sauceImages.clear();
  }

  private syncPlacements(placements: readonly PlacedIngredient[]): void {
    const activeIds = new Set(placements.map((placement) => placement.instanceId));
    for (const [instanceId, image] of this.placementImages) {
      if (activeIds.has(instanceId)) continue;
      image.destroy();
      this.placementImages.delete(instanceId);
    }

    for (const placement of placements) {
      const visual = this.visualForIngredient(placement.ingredientId);
      if (!visual) continue;
      const screen = assemblyPointToScreen(this.workspace, placement);
      const width = Math.min(this.workspace.width * visual.widthRatio, visual.maxWidth) * placement.scale;
      let image = this.placementImages.get(placement.instanceId);
      if (!image) {
        image = this.scene.add.image(screen.x, screen.y, visual.assetKey).setVisible(this.visible);
        this.placementImages.set(placement.instanceId, image);
      } else if (image.texture.key !== visual.assetKey) {
        image.setTexture(visual.assetKey);
      }
      const source = this.scene.textures.get(visual.assetKey).getSourceImage();
      image
        .setPosition(screen.x, screen.y)
        .setRotation(Phaser.Math.DegToRad(placement.rotation))
        .setDisplaySize(width, source.height * (width / source.width))
        .setDepth(10 + placement.sequence * 0.01);
    }
  }

  private syncSauces(strokes: readonly SauceStroke[]): void {
    const activeIds = new Set(strokes.map((stroke) => stroke.strokeId));
    for (const [strokeId, images] of this.sauceImages) {
      if (activeIds.has(strokeId)) continue;
      images.forEach((image) => image.destroy());
      this.sauceImages.delete(strokeId);
    }

    for (const stroke of strokes) {
      const assetKey = SAUCE_ASSETS[stroke.ingredientId];
      if (!assetKey) continue;
      this.sauceImages.get(stroke.strokeId)?.forEach((image) => image.destroy());
      const images = this.createSauceImages(stroke, assetKey);
      this.sauceImages.set(stroke.strokeId, images);
    }
  }

  private createSauceImages(stroke: SauceStroke, assetKey: string): Phaser.GameObjects.Image[] {
    const points = stroke.points.map((point) => assemblyPointToScreen(this.workspace, point));
    if (points.length === 0) return [];
    const stampWidth = Math.min(this.workspace.width * 0.055, 42);
    const images: Phaser.GameObjects.Image[] = [];

    for (let index = 0; index < points.length - 1; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      if (!from || !to) continue;
      const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.max(1, Math.ceil(distance / Math.max(12, stampWidth * 0.48)));
      for (let step = 0; step <= steps; step += 1) {
        if (index > 0 && step === 0) continue;
        const t = step / steps;
        images.push(this.createSauceStamp(
          assetKey,
          Phaser.Math.Linear(from.x, to.x, t),
          Phaser.Math.Linear(from.y, to.y, t),
          stampWidth,
          stroke.sequence,
        ));
      }
    }

    if (points.length === 1 && points[0]) {
      images.push(this.createSauceStamp(assetKey, points[0].x, points[0].y, stampWidth, stroke.sequence));
    }
    return images;
  }

  private createSauceStamp(
    assetKey: string,
    x: number,
    y: number,
    width: number,
    sequence: number,
  ): Phaser.GameObjects.Image {
    const source = this.scene.textures.get(assetKey).getSourceImage();
    return this.scene.add.image(x, y, assetKey)
      .setDisplaySize(width, source.height * (width / source.width))
      .setDepth(10 + sequence * 0.01)
      .setVisible(this.visible);
  }

  private visualForIngredient(ingredientId: string): IngredientVisual | undefined {
    return this.recipeId === 'recipe.cheesy-street-hot-dog'
      ? HOTDOG_VISUALS[ingredientId]
      : BURGER_VISUALS[ingredientId];
  }
}
