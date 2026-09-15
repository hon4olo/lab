import Phaser from 'phaser';
import type { IngredientDefinition } from '../../game/ingredients/IngredientDefinition';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { CustomerDefinition } from '../../game/customers/CustomerDefinition';
import type { ShiftPhase } from '../../game/shifts/ShiftSession';
import type { TranslationKey } from '../../localization/createTranslator';
import { CustomerPresenter } from './CustomerPresenter';
import { FoodPresenter } from './FoodPresenter';
import { IngredientTrayPresenter } from './IngredientTrayPresenter';
import { OrderHudPresenter } from './OrderHudPresenter';
import { StationRailPresenter } from './StationRailPresenter';
import type { OrderAction } from './orderActions';
import { calculateOrderLayout, finalizeOrderLayout, type OrderLayout } from './orderLayout';
import { modifierIngredientIds, selectableBaseIngredientIds } from '../../game/orders/OrderRequirements';
import {
  createStationPresentation,
  stationModeForPhase,
  type StationPresentationMode,
} from './stationPresentation';
import { BuildStationController } from '../stations/BuildStationController';
import { GrillStationController } from '../stations/GrillStationController';
import type { AssemblyWorkspaceRect } from '../stations/AssemblyWorkspaceMapper';
import {
  requiredStationAssetIds,
  stationGroupsForRecipe,
  STREET_STATION_ASSET_IDS,
} from '../stations/StationAssetContract';

const LEGACY_BACKGROUND_ASSET = 'background.street-snack-bar';

export class OrderSceneView {
  private readonly background: Phaser.GameObjects.Image;
  private readonly workspaceBackdrop: Phaser.GameObjects.Graphics;
  private readonly counter: Phaser.GameObjects.Image;
  private readonly station: Phaser.GameObjects.Image;
  private readonly customer: CustomerPresenter;
  private readonly customerDefinition: CustomerDefinition;
  private readonly food: FoodPresenter;
  private readonly tray: IngredientTrayPresenter;
  private readonly hud: OrderHudPresenter;
  private readonly stationRail: StationRailPresenter;
  private readonly buildController: BuildStationController | null;
  private readonly grillController: GrillStationController | null;
  private readonly handsOnShellEnabled: boolean;
  private layoutState: OrderLayout;
  private stationAsset = '';
  private backgroundAsset = LEGACY_BACKGROUND_ASSET;
  private currentPhase: OrderSnapshot['phase'] = 'customer-entering';
  private currentMode: StationPresentationMode = 'order';
  private currentSnapshot: OrderSnapshot | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly order: OrderDefinition,
    customerDefinition: CustomerDefinition,
    ingredients: readonly IngredientDefinition[],
    private readonly localize: (key: TranslationKey) => string,
    private readonly onAction: (action: OrderAction) => void,
    private readonly reducedMotion: boolean,
  ) {
    this.customerDefinition = customerDefinition;
    const width = scene.scale.width;
    const height = scene.scale.height;
    this.layoutState = finalizeOrderLayout(calculateOrderLayout(width, height));
    this.handsOnShellEnabled = this.hasHandsOnShellTextures();
    this.background = scene.add.image(0, 0, LEGACY_BACKGROUND_ASSET).setDepth(0);
    this.workspaceBackdrop = scene.add.graphics().setDepth(1);
    this.counter = scene.add.image(0, 0, 'environment.service-counter.street').setDepth(3);
    this.station = scene.add.image(0, 0, 'station.prep-board.street').setDepth(5);
    this.station.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      const action = this.hud.getStationAction();
      if (action) this.onAction(action);
    });
    this.customer = new CustomerPresenter(scene, customerDefinition);
    this.food = new FoodPresenter(scene, order.grillAssetKeys);
    const handsOnBuildEnabled = this.hasHandsOnBuildTextures();
    const handsOnGrillEnabled = this.hasHandsOnGrillTextures();
    this.hud = new OrderHudPresenter(
      scene,
      order,
      customerDefinition.displayNameKey,
      onAction,
      handsOnBuildEnabled,
    );
    this.stationRail = new StationRailPresenter(scene);
    this.tray = new IngredientTrayPresenter(scene, ingredients, (ingredientId, x, y) => {
      if (this.currentPhase === 'modifier-selection' && modifierIngredientIds(this.order).includes(ingredientId)) {
        this.onAction({ type: 'add-modifier', ingredientId });
      } else {
        this.onAction({ type: 'ingredient', ingredientId, x, y });
      }
    });
    this.buildController = handsOnBuildEnabled
      ? new BuildStationController(scene, order.recipeId, onAction)
      : null;
    this.grillController = handsOnGrillEnabled
      ? new GrillStationController(scene, order.grillAssetKeys, onAction)
      : null;
    this.layout(width, height);
  }

  public layout(width: number, height: number): void {
    this.layoutState = finalizeOrderLayout(calculateOrderLayout(width, height));
    const layout = this.layoutState;
    this.layoutBackground(this.backgroundAssetForMode(this.currentMode));
    this.hud.layout(layout);
    this.stationRail.layout(width, height);
    this.tray.layout(layout);
    this.buildController?.layout(width, height, this.buildWorkspace());
    this.grillController?.layout(width, height);
    this.applyPresentationMode(this.currentMode);
    this.stationRail.render(this.currentMode, this.localize);
    if (this.currentSnapshot) this.layoutFood(this.currentSnapshot);
    else this.food.hide();
  }

  public render(snapshot: OrderSnapshot, coins: number, shiftPhase: ShiftPhase): void {
    this.currentSnapshot = snapshot;
    this.currentPhase = snapshot.phase;
    this.currentMode = stationModeForPhase(snapshot.phase);
    this.applyPresentationMode(this.currentMode);
    this.stationRail.render(this.currentMode, this.localize);

    const handsOnBuildActive = this.isHandsOnBuildActive(snapshot);
    const handsOnGrillActive = this.grillController !== null && snapshot.phase === 'grilling';
    this.buildController?.setVisible(handsOnBuildActive);
    if (handsOnBuildActive) this.buildController?.render(snapshot);
    this.grillController?.setVisible(handsOnGrillActive);
    if (handsOnGrillActive) this.grillController?.render(snapshot.grill);

    const availableIngredients = snapshot.phase === 'ingredient-selection'
      ? selectableBaseIngredientIds(this.order)
      : snapshot.phase === 'modifier-selection' ? modifierIngredientIds(this.order) : [];
    this.tray.render(snapshot.selectedIngredients, availableIngredients, this.localize);
    this.hud.render(snapshot, coins, shiftPhase, this.localize);
    this.customer.setMutation(
      snapshot.transformationResult?.appearanceAssets ?? [],
      snapshot.transformationResult?.appearanceMode ?? 'overlay',
    );
    const reactionSequence = snapshot.transformationResult?.reactionSequence ??
      (snapshot.phase === 'payment' || snapshot.phase === 'next-order-ready'
        ? this.order.reactionSequence ?? this.customerDefinition.defaultReactionSequence ?? null
        : null);
    this.customer.setReaction(reactionSequence);

    if (handsOnBuildActive || handsOnGrillActive) {
      this.station.setVisible(false);
      if (this.station.input) this.station.input.enabled = false;
      this.workspaceBackdrop.clear();
      this.food.hide();
      return;
    }

    const showFood = ['grilling', 'assembly', 'modifier-selection', 'anticipation']
      .includes(snapshot.phase);
    if (!showFood) {
      this.food.hide();
      return;
    }

    this.layoutFood(snapshot);
    if (snapshot.phase === 'grilling') this.food.setCookState(snapshot.grill.state);
  }

  public updatePatience(snapshot: OrderSnapshot): void {
    this.hud.updatePatience(snapshot);
  }

  public playEntry(onComplete: () => void): void {
    const presentation = createStationPresentation(this.layoutState, 'order');
    this.customer.setVisible(true);
    this.customer.enter(
      presentation.customerX,
      presentation.customerY,
      this.reducedMotion,
      onComplete,
    );
  }

  public anticipate(): void {
    this.customer.anticipate(this.reducedMotion);
  }

  public playCustomerExit(onComplete: () => void): void {
    this.customer.leave(this.reducedMotion, onComplete);
  }

  public customerPosition(): { x: number; y: number } {
    return this.customer.getPosition();
  }

  public assembledFood(assetKey: string): void {
    this.food.setAssembled(assetKey);
  }

  public isHandsOnBuildEnabled(): boolean {
    return this.buildController !== null;
  }

  public isHandsOnGrillEnabled(): boolean {
    return this.grillController !== null;
  }

  public isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  public destroy(): void {
    this.buildController?.destroy();
    this.grillController?.destroy();
    this.background.destroy();
    this.workspaceBackdrop.destroy();
    this.counter.destroy();
    this.station.destroy();
    this.customer.destroy();
    this.food.destroy();
    this.tray.destroy();
    this.hud.destroy();
    this.stationRail.destroy();
  }

  private applyPresentationMode(mode: StationPresentationMode): void {
    const layout = this.layoutState;
    const presentation = createStationPresentation(layout, mode);
    const dedicatedBackground = this.backgroundAssetForMode(mode) !== LEGACY_BACKGROUND_ASSET;
    this.layoutBackground(this.backgroundAssetForMode(mode));
    this.drawWorkspace(presentation, dedicatedBackground);

    this.background.setAlpha(dedicatedBackground ? 1 : presentation.showWorkspace ? 0.78 : 1);
    this.counter.setVisible(presentation.showCounter && !dedicatedBackground)
      .setPosition(layout.width / 2, presentation.counterY)
      .setDisplaySize(presentation.counterWidth, presentation.counterHeight);

    if (this.stationAsset !== presentation.stationAsset) {
      this.stationAsset = presentation.stationAsset;
      this.station.setTexture(presentation.stationAsset);
    }
    const showLegacyStation = presentation.showStation && !dedicatedBackground;
    this.station.setVisible(showLegacyStation)
      .setPosition(presentation.stationX, presentation.stationY)
      .setDisplaySize(presentation.stationWidth, presentation.stationHeight);
    if (this.station.input) this.station.input.enabled = showLegacyStation;

    this.customer.layout(
      presentation.customerX,
      presentation.customerY,
      presentation.customerSize,
    );
    this.customer.setVisible(presentation.showCustomer);
  }

  private drawWorkspace(
    presentation: ReturnType<typeof createStationPresentation>,
    dedicatedBackground: boolean,
  ): void {
    this.workspaceBackdrop.clear();
    if (!presentation.showWorkspace || dedicatedBackground) return;
    const { width, height } = this.layoutState;
    const left = presentation.workspaceX - presentation.workspaceWidth / 2;
    const top = presentation.workspaceY - presentation.workspaceHeight / 2;
    this.workspaceBackdrop
      .fillStyle(0x160e22, 0.54)
      .fillRect(0, 0, width, height)
      .fillStyle(0x2b1b37, 0.88)
      .fillRoundedRect(left, top, presentation.workspaceWidth, presentation.workspaceHeight, 26)
      .lineStyle(2, 0xfff1d0, 0.72)
      .strokeRoundedRect(left, top, presentation.workspaceWidth, presentation.workspaceHeight, 26);
  }

  private layoutFood(snapshot: OrderSnapshot): void {
    const presentation = createStationPresentation(this.layoutState, this.currentMode);
    const assembled = snapshot.assembled;
    let x = presentation.stationX;
    let y = presentation.stationY;
    let width = Math.min(presentation.stationWidth * 0.28, 180);

    if (this.currentMode === 'build') {
      width = assembled
        ? Math.min(presentation.stationWidth * 0.38, 260)
        : Math.min(presentation.stationWidth * 0.26, 180);
      y = presentation.stationY - presentation.stationHeight * 0.02;
    } else if (this.currentMode === 'serve') {
      x = this.layoutState.width * (this.layoutState.wide ? 0.43 : 0.34);
      y = presentation.counterY - presentation.counterHeight * 0.29;
      width = Math.min(presentation.customerSize * 0.52, 185);
    }

    const assetKey = snapshot.food?.visualVariant ?? this.order.baseAssembledAssetKey;
    this.food.layout(x, y, width, assembled, assetKey);
  }

  private hasHandsOnShellTextures(): boolean {
    return requiredStationAssetIds('hands-on-shell').every((id) => this.scene.textures.exists(id));
  }

  private hasHandsOnGrillTextures(): boolean {
    if (!this.handsOnShellEnabled) return false;
    return Object.values(this.order.grillAssetKeys).every((id) => this.scene.textures.exists(id));
  }

  private hasHandsOnBuildTextures(): boolean {
    const ids = new Set(
      stationGroupsForRecipe(this.order.recipeId).flatMap((group) => requiredStationAssetIds(group)),
    );
    return ids.size > 0 && [...ids].every((id) => this.scene.textures.exists(id));
  }

  private isHandsOnBuildActive(snapshot: OrderSnapshot): boolean {
    return this.buildController !== null && snapshot.phase === 'assembly' && snapshot.assembly !== undefined;
  }

  private backgroundAssetForMode(mode: StationPresentationMode): string {
    if (!this.handsOnShellEnabled) return LEGACY_BACKGROUND_ASSET;
    switch (mode) {
      case 'prep': return STREET_STATION_ASSET_IDS.prepBackground;
      case 'grill': return STREET_STATION_ASSET_IDS.grillBackground;
      case 'build': return STREET_STATION_ASSET_IDS.buildBackground;
      case 'order':
      case 'serve':
      case 'results': return STREET_STATION_ASSET_IDS.orderBackground;
    }
  }

  private layoutBackground(assetKey: string): void {
    if (this.backgroundAsset !== assetKey) {
      this.backgroundAsset = assetKey;
      this.background.setTexture(assetKey);
    }
    const source = this.scene.textures.get(assetKey).getSourceImage();
    const { width, height } = this.layoutState;
    const coverScale = Math.max(width / source.width, height / source.height);
    this.background.setPosition(width / 2, height / 2)
      .setDisplaySize(source.width * coverScale, source.height * coverScale);
  }

  private buildWorkspace(): AssemblyWorkspaceRect {
    const presentation = createStationPresentation(this.layoutState, 'build');
    const width = presentation.workspaceWidth * (this.layoutState.wide ? 0.62 : 0.78);
    const height = presentation.workspaceHeight * (this.layoutState.wide ? 0.56 : 0.48);
    const centerY = presentation.workspaceY - presentation.workspaceHeight * (this.layoutState.wide ? 0.06 : 0.10);
    return {
      x: presentation.workspaceX - width / 2,
      y: centerY - height / 2,
      width,
      height,
    };
  }
}
