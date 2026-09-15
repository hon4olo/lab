import Phaser from 'phaser';
import type { FoodAssemblySnapshot, PlacedIngredient, SauceStroke } from '../../game/assembly/AssemblySession';
import {
  assemblyPointToScreen,
  buildIngredientDisplayWidth,
  type AssemblyWorkspaceRect,
} from './AssemblyWorkspaceMapper';
import {
  BURGER_BUILD_ASSET_IDS,
  HOTDOG_BUILD_ASSET_IDS,
} from './StationAssetContract';

interface IngredientVisual {
  readonly assetKey: string;
}

export type BuildPlacementPointerDown = (
  placement: PlacedIngredient,
  pointer: Phaser.Input.Pointer,
) => void;

const BURGER_VISUALS: Readonly<Record<string, IngredientVisual>> = {
  'ingredient.bun-bottom': { assetKey: BURGER_BUILD_ASSET_IDS.bottomBun },
  'ingredient.patty': { assetKey: BURGER_BUILD_ASSET_IDS.patty },
  'ingredient.cheese': { assetKey: BURGER_BUILD_ASSET_IDS.cheese },
  'ingredient.extra-spicy': { assetKey: BURGER_BUILD_ASSET_IDS.chiliPiece },
  'ingredient.bun-top': { assetKey: BURGER_BUILD_ASSET_IDS.topBun },
};

const HOTDOG_VISUALS: Readonly<Record<string, IngredientVisual>> = {
  'ingredient.hotdog-bun': { assetKey: HOTDOG_BUILD_ASSET_IDS.bun },
  'ingredient.sausage': { assetKey: HOTDOG_BUILD_ASSET_IDS.sausage },
  'ingredient.hotdog-cheese': { assetKey: HOTDOG_BUILD_ASSET_IDS.cheese },
  'ingredient.pickle': { assetKey: HOTDOG_BUILD_ASSET_IDS.picklePiece },
};

const SAUCE_ASSETS: Readonly<Record<string, string>> = {
  'ingredient.sauce': BURGER_BUILD_ASSET_IDS.sauceStamp,
  'ingredient.mustard': HOTDOG_BUILD_ASSET_IDS.mustardStamp,
  'ingredient.glow-sauce': HOTDOG_BUILD_ASSET_IDS.glowStamp,
};

export class BuildStationPresenter {
  private readonly placementImages = new Map<string, Phaser.GameObjects.Image>();
  private readonly placementShadows = new Map<string, Phaser.GameObjects.Image>();
  private readonly sauceImages = new Map<string, Phaser.GameObjects.Image[]>();
  private readonly sauceSignatures = new Map<string, string>();
  private workspace: AssemblyWorkspaceRect = { x: 0, y: 0, width: 1, height: 1 };
  private lastSnapshot: FoodAssemblySnapshot | null = null;
  private visible = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly recipeId: string,
    private readonly onPlacementPointerDown?: BuildPlacementPointerDown,
  ) {
  }

  public layout(_screenWidth: number, _screenHeight: number, workspace: AssemblyWorkspaceRect): void {
    this.workspace = workspace;
    this.sauceSignatures.clear();
    if (this.lastSnapshot) {
      this.syncPlacements(this.lastSnapshot.placements);
      this.syncSauces(this.lastSnapshot.sauceStrokes);
    }
  }

  public render(snapshot: FoodAssemblySnapshot): void {
    this.lastSnapshot = snapshot;
    this.syncPlacements(snapshot.placements);
    this.syncSauces(snapshot.sauceStrokes);
  }

  public assetKeyForIngredient(ingredientId: string): string | null {
    return this.visualForIngredient(ingredientId)?.assetKey ?? null;
  }

  public setPlacementDragging(instanceId: string, dragging: boolean): void {
    const image = this.placementImages.get(instanceId);
    const shadow = this.placementShadows.get(instanceId);
    image?.setVisible(this.visible && !dragging);
    shadow?.setVisible(this.visible && !dragging);
    if (image?.input) image.input.enabled = this.visible && !dragging;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    for (const [instanceId, image] of this.placementImages) {
      image.setVisible(visible);
      if (image.input) image.input.enabled = visible;
      this.placementShadows.get(instanceId)?.setVisible(visible);
    }
    for (const images of this.sauceImages.values()) images.forEach((image) => image.setVisible(visible));
  }

  public destroy(): void {
    for (const image of this.placementImages.values()) image.destroy();
    for (const image of this.placementShadows.values()) image.destroy();
    for (const images of this.sauceImages.values()) images.forEach((image) => image.destroy());
    this.placementImages.clear();
    this.placementShadows.clear();
    this.sauceImages.clear();
    this.sauceSignatures.clear();
  }

  private syncPlacements(placements: readonly PlacedIngredient[]): void {
    const activeIds = new Set(placements.map((placement) => placement.instanceId));
    for (const [instanceId, image] of this.placementImages) {
      if (activeIds.has(instanceId)) continue;
      image.destroy();
      this.placementImages.delete(instanceId);
      this.placementShadows.get(instanceId)?.destroy();
      this.placementShadows.delete(instanceId);
    }

    for (const placement of placements) {
      const visual = this.visualForIngredient(placement.ingredientId);
      if (!visual) continue;
      const screen = assemblyPointToScreen(this.workspace, placement);
      const width = buildIngredientDisplayWidth(this.recipeId, placement.ingredientId, this.workspace.width) * placement.scale;
      let image = this.placementImages.get(placement.instanceId);
      if (!image) {
        const instanceId = placement.instanceId;
        image = this.scene.add.image(screen.x, screen.y, visual.assetKey)
          .setVisible(this.visible)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const current = this.lastSnapshot?.placements.find((candidate) => candidate.instanceId === instanceId);
            if (current && this.visible) this.onPlacementPointerDown?.(current, pointer);
          });
        this.placementImages.set(placement.instanceId, image);
      } else if (image.texture.key !== visual.assetKey) {
        image.setTexture(visual.assetKey);
      }
      const source = this.scene.textures.get(visual.assetKey).getSourceImage();
      image
        .setPosition(screen.x, screen.y)
        .setRotation(Phaser.Math.DegToRad(placement.rotation))
        .setDisplaySize(width, source.height * (width / source.width))
        .setDepth(16 + placement.sequence * 0.1);

      let shadow = this.placementShadows.get(placement.instanceId);
      if (!shadow) {
        shadow = this.scene.add.image(screen.x, screen.y, visual.assetKey)
          .setTint(0x241332)
          .setAlpha(0.22)
          .setVisible(this.visible);
        this.placementShadows.set(placement.instanceId, shadow);
      } else if (shadow.texture.key !== visual.assetKey) {
        shadow.setTexture(visual.assetKey).setTint(0x241332);
      }
      shadow
        .setPosition(screen.x + Math.max(3, this.workspace.width * 0.008), screen.y + Math.max(5, this.workspace.height * 0.018))
        .setRotation(Phaser.Math.DegToRad(placement.rotation))
        .setDisplaySize(width, source.height * (width / source.width))
        .setDepth(11 + placement.sequence * 0.1)
        .setVisible(this.visible);
    }
  }

  private syncSauces(strokes: readonly SauceStroke[]): void {
    const activeIds = new Set(strokes.map((stroke) => stroke.strokeId));
    for (const [strokeId, images] of this.sauceImages) {
      if (activeIds.has(strokeId)) continue;
      images.forEach((image) => image.destroy());
      this.sauceImages.delete(strokeId);
      this.sauceSignatures.delete(strokeId);
    }

    for (const stroke of strokes) {
      const assetKey = SAUCE_ASSETS[stroke.ingredientId];
      if (!assetKey) continue;
      const signature = sauceSignature(stroke);
      if (this.sauceSignatures.get(stroke.strokeId) === signature && this.sauceImages.has(stroke.strokeId)) continue;
      this.sauceImages.get(stroke.strokeId)?.forEach((image) => image.destroy());
      const images = this.createSauceImages(stroke, assetKey);
      this.sauceImages.set(stroke.strokeId, images);
      this.sauceSignatures.set(stroke.strokeId, signature);
    }
  }

  private createSauceImages(stroke: SauceStroke, assetKey: string): Phaser.GameObjects.Image[] {
    const points = stroke.points.map((point) => assemblyPointToScreen(this.workspace, point));
    if (points.length === 0) return [];
    const stampWidth = sauceStampWidth(this.workspace.width);
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
      .setDepth(23 + sequence * 0.1)
      .setVisible(this.visible);
  }

  private visualForIngredient(ingredientId: string): IngredientVisual | undefined {
    return this.recipeId === 'recipe.cheesy-street-hot-dog'
      ? HOTDOG_VISUALS[ingredientId]
      : BURGER_VISUALS[ingredientId];
  }
}

function sauceStampWidth(workspaceWidth: number): number {
  return Math.max(24, Math.min(workspaceWidth * 0.065, 54));
}

function sauceSignature(stroke: SauceStroke): string {
  return `${stroke.sequence}:${stroke.points.map((point) => `${point.x.toFixed(4)},${point.y.toFixed(4)}`).join(';')}`;
}
