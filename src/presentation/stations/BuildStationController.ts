import Phaser from 'phaser';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { OrderAction } from '../order/orderActions';
import {
  assemblyPointToScreen,
  type AssemblyWorkspaceRect,
  type PointerKind,
} from './AssemblyWorkspaceMapper';
import { BuildStationInputSession } from './BuildStationInputSession';
import { BuildStationPresenter } from './BuildStationPresenter';
import {
  BuildStationShelfPresenter,
  type BuildToolDefinition,
} from './BuildStationShelfPresenter';
import { BURGER_BUILD_ASSET_IDS, HOTDOG_BUILD_ASSET_IDS } from './StationAssetContract';

const EMPTY_ASSEMBLY = { placements: [], sauceStrokes: [] } as const;

export class BuildStationController {
  private readonly presenter: BuildStationPresenter;
  private readonly shelf: BuildStationShelfPresenter;
  private readonly input: BuildStationInputSession;
  private workspace: AssemblyWorkspaceRect = { x: 0, y: 0, width: 1, height: 1 };
  private visible = false;
  private selectedSauceId: string | null = null;
  private dragPreview: Phaser.GameObjects.Image | null = null;
  private liveSauceImages: Phaser.GameObjects.Image[] = [];
  private lastLiveSaucePoint: { x: number; y: number } | null = null;

  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible || !this.selectedSauceId || !this.contains(pointer.x, pointer.y)) return;
    this.clearLiveSauce();
    this.input.beginSauceStroke(this.selectedSauceId, pointer.x, pointer.y);
    this.addLiveSauceStamp(pointer.x, pointer.y, this.selectedSauceId);
  };

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible) return;
    if (this.input.isDraggingIngredient()) {
      const preview = this.input.previewIngredientDrag(pointer.x, pointer.y, pointerKind(pointer));
      this.dragPreview?.setPosition(preview.visualX, preview.visualY);
      return;
    }
    if (!this.input.isDrawingSauce()) return;
    this.input.extendSauceStroke(pointer.x, pointer.y);
    if (this.contains(pointer.x, pointer.y) && this.selectedSauceId) {
      this.addLiveSauceStamp(pointer.x, pointer.y, this.selectedSauceId);
    }
  };

  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible) return;
    if (this.input.isDraggingIngredient()) {
      if (this.contains(pointer.x, pointer.y)) this.input.dropIngredient(pointer.x, pointer.y);
      else this.input.cancelIngredientDrag();
      this.destroyDragPreview();
      return;
    }
    if (!this.input.isDrawingSauce()) return;
    const completed = this.input.finishSauceStroke(pointer.x, pointer.y);
    this.clearLiveSauce();
    if (completed) {
      this.selectedSauceId = null;
      this.shelf.selectSauce(null);
    }
  };

  public constructor(
    private readonly scene: Phaser.Scene,
    recipeId: string,
    onAction: (action: OrderAction) => void,
  ) {
    this.presenter = new BuildStationPresenter(scene, recipeId);
    this.input = new BuildStationInputSession({
      placeIngredient: (ingredientId, point, rotation) => {
        onAction({ type: 'build-place', ingredientId, point, rotation });
      },
      moveIngredient: (instanceId, point, rotation) => {
        onAction({ type: 'build-move', instanceId, point, ...(rotation === undefined ? {} : { rotation }) });
      },
      addSauceStroke: (ingredientId, points) => {
        onAction({ type: 'build-sauce', ingredientId, points });
      },
    }, this.workspace);
    this.shelf = new BuildStationShelfPresenter(scene, recipeId, (tool, pointer) => {
      this.beginTool(tool, pointer);
    });
    this.shelf.setVisible(false);
    scene.input.on('pointerdown', this.handlePointerDown);
    scene.input.on('pointermove', this.handlePointerMove);
    scene.input.on('pointerup', this.handlePointerUp);
  }

  public layout(screenWidth: number, screenHeight: number, workspace: AssemblyWorkspaceRect): void {
    this.workspace = workspace;
    this.input.setWorkspace(workspace);
    this.presenter.layout(screenWidth, screenHeight, workspace);
    this.shelf.layout(screenWidth, screenHeight, workspace);
  }

  public render(snapshot: OrderSnapshot): void {
    this.presenter.render(snapshot.assembly ?? EMPTY_ASSEMBLY);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.presenter.setVisible(visible);
    this.shelf.setVisible(visible);
    if (visible) return;
    this.selectedSauceId = null;
    this.shelf.selectSauce(null);
    this.input.cancelIngredientDrag();
    this.input.cancelSauceStroke();
    this.destroyDragPreview();
    this.clearLiveSauce();
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown);
    this.scene.input.off('pointermove', this.handlePointerMove);
    this.scene.input.off('pointerup', this.handlePointerUp);
    this.destroyDragPreview();
    this.clearLiveSauce();
    this.shelf.destroy();
    this.presenter.destroy();
  }

  private beginTool(tool: BuildToolDefinition, pointer: Phaser.Input.Pointer): void {
    if (!this.visible) return;
    if (tool.mode === 'sauce') {
      this.destroyDragPreview();
      this.input.cancelIngredientDrag();
      this.selectedSauceId = tool.ingredientId;
      this.shelf.selectSauce(tool.ingredientId);
      return;
    }

    this.selectedSauceId = null;
    this.shelf.selectSauce(null);
    this.input.cancelSauceStroke();
    this.input.beginIngredientDrag(tool.ingredientId);
    this.destroyDragPreview();
    this.dragPreview = this.scene.add.image(pointer.x, pointer.y, tool.assetKey).setDepth(40);
    const source = this.scene.textures.get(tool.assetKey).getSourceImage();
    const width = ingredientPreviewWidth(tool.ingredientId, this.workspace.width);
    this.dragPreview.setDisplaySize(width, source.height * (width / source.width));
    const preview = this.input.previewIngredientDrag(pointer.x, pointer.y, pointerKind(pointer));
    this.dragPreview.setPosition(preview.visualX, preview.visualY);
  }

  private contains(x: number, y: number): boolean {
    return x >= this.workspace.x && x <= this.workspace.x + this.workspace.width &&
      y >= this.workspace.y && y <= this.workspace.y + this.workspace.height;
  }

  private addLiveSauceStamp(screenX: number, screenY: number, ingredientId: string): void {
    const previous = this.lastLiveSaucePoint;
    const minDistance = Math.max(9, this.workspace.width * 0.018);
    if (previous && Phaser.Math.Distance.Between(previous.x, previous.y, screenX, screenY) < minDistance) return;
    const assetKey = sauceStampForIngredient(ingredientId);
    if (!assetKey) return;
    const point = assemblyPointToScreen(this.workspace, {
      x: (screenX - this.workspace.x) / this.workspace.width,
      y: (screenY - this.workspace.y) / this.workspace.height,
    });
    const width = Math.min(this.workspace.width * 0.055, 42);
    const source = this.scene.textures.get(assetKey).getSourceImage();
    const image = this.scene.add.image(point.x, point.y, assetKey)
      .setDisplaySize(width, source.height * (width / source.width))
      .setDepth(19);
    this.liveSauceImages.push(image);
    this.lastLiveSaucePoint = { x: screenX, y: screenY };
  }

  private destroyDragPreview(): void {
    this.dragPreview?.destroy();
    this.dragPreview = null;
  }

  private clearLiveSauce(): void {
    for (const image of this.liveSauceImages) image.destroy();
    this.liveSauceImages = [];
    this.lastLiveSaucePoint = null;
  }
}

function pointerKind(pointer: Phaser.Input.Pointer): PointerKind {
  return pointer.wasTouch ? 'touch' : 'mouse';
}

function ingredientPreviewWidth(ingredientId: string, workspaceWidth: number): number {
  if (ingredientId === 'ingredient.extra-spicy' || ingredientId === 'ingredient.pickle') {
    return Math.min(workspaceWidth * 0.075, 54);
  }
  return Math.min(workspaceWidth * 0.26, 190);
}

function sauceStampForIngredient(ingredientId: string): string | null {
  switch (ingredientId) {
    case 'ingredient.sauce': return BURGER_BUILD_ASSET_IDS.sauceStamp;
    case 'ingredient.mustard': return HOTDOG_BUILD_ASSET_IDS.mustardStamp;
    case 'ingredient.glow-sauce': return HOTDOG_BUILD_ASSET_IDS.glowStamp;
    default: return null;
  }
}
