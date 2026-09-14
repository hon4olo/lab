import Phaser from 'phaser';
import type { IngredientDefinition } from '../../game/ingredients/IngredientDefinition';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { CustomerDefinition } from '../../game/customers/CustomerDefinition';
import type { ShiftPhase } from '../../game/shifts/ShiftSession';
import type { TranslationKey } from '../../localization/createTranslator';
import { CustomerPresenter } from './CustomerPresenter';
import { BurgerPresenter } from './BurgerPresenter';
import { IngredientTrayPresenter } from './IngredientTrayPresenter';
import { OrderHudPresenter } from './OrderHudPresenter';
import type { OrderAction } from './orderActions';
import { calculateOrderLayout, finalizeOrderLayout, type OrderLayout } from './orderLayout';

export class OrderSceneView {
  private readonly background: Phaser.GameObjects.Image;
  private readonly counter: Phaser.GameObjects.Image;
  private readonly station: Phaser.GameObjects.Image;
  private readonly customer: CustomerPresenter;
  private readonly burger: BurgerPresenter;
  private readonly tray: IngredientTrayPresenter;
  private readonly hud: OrderHudPresenter;
  private layoutState: OrderLayout;
  private stationAsset = '';
  private currentPhase: OrderSnapshot['phase'] = 'customer-entering';

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly order: OrderDefinition,
    customerDefinition: CustomerDefinition,
    ingredients: readonly IngredientDefinition[],
    private readonly localize: (key: TranslationKey) => string,
    private readonly onAction: (action: OrderAction) => void,
    private readonly reducedMotion: boolean,
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    this.layoutState = finalizeOrderLayout(calculateOrderLayout(width, height));
    this.background = scene.add.image(0, 0, 'background.street-snack-bar').setDepth(0);
    this.counter = scene.add.image(0, 0, 'environment.service-counter.street').setDepth(3);
    this.station = scene.add.image(0, 0, 'station.prep-board.street').setDepth(5);
    this.station.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      const action = this.hud.getStationAction();
      if (action) this.onAction(action);
    });
    this.customer = new CustomerPresenter(scene, customerDefinition.appearanceAssets);
    this.burger = new BurgerPresenter(scene);
    this.hud = new OrderHudPresenter(scene, order, customerDefinition.displayNameKey, onAction);
    this.tray = new IngredientTrayPresenter(scene, ingredients, (ingredientId, x, y) => {
      if (this.currentPhase === 'modifier-selection' && ingredientId === this.order.modifierIngredientId) {
        this.onAction({ type: 'add-modifier', ingredientId });
      } else {
        this.onAction({ type: 'ingredient', ingredientId, x, y });
      }
    });
    this.layout(width, height);
  }

  public layout(width: number, height: number): void {
    this.layoutState = finalizeOrderLayout(calculateOrderLayout(width, height));
    const layout = this.layoutState;
    const source = this.scene.textures.get('background.street-snack-bar').getSourceImage();
    const coverScale = Math.max(width / source.width, height / source.height);
    this.background.setPosition(width / 2, height / 2)
      .setDisplaySize(source.width * coverScale, source.height * coverScale);
    this.counter.setPosition(width / 2, layout.counterY)
      .setDisplaySize(layout.counterWidth, layout.counterHeight);
    this.station.setPosition(layout.stationX, layout.stationY)
      .setDisplaySize(layout.stationWidth, layout.stationHeight);
    this.customer.layout(layout.customerX, layout.customerY, layout.customerSize);
    this.hud.layout(layout);
    this.tray.layout(layout);
    this.layoutFood();
  }

  public render(snapshot: OrderSnapshot, coins: number, shiftPhase: ShiftPhase): void {
    this.currentPhase = snapshot.phase;
    const isGrilling = snapshot.phase === 'grilling';
    const showStation = ['ingredient-selection', 'prep-board', 'grilling'].includes(snapshot.phase);
    const desiredStation = isGrilling ? 'station.grill.street' : 'station.prep-board.street';
    if (this.stationAsset !== desiredStation) {
      this.stationAsset = desiredStation;
      this.station.setTexture(desiredStation);
    }
    this.station.setVisible(showStation);
    const availableIngredients = snapshot.phase === 'ingredient-selection'
      ? this.order.requiredIngredientIds.filter((id) => id !== this.order.modifierIngredientId)
      : snapshot.phase === 'modifier-selection' ? [this.order.modifierIngredientId] : [];
    this.tray.render(snapshot.selectedIngredients, availableIngredients, this.localize);
    this.hud.render(snapshot, coins, shiftPhase, this.localize);
    this.customer.setMutation(snapshot.transformationResult?.appearanceAssets ?? []);

    const showFood = ['grilling', 'assembly', 'modifier-selection', 'anticipation']
      .includes(snapshot.phase);
    if (!showFood) {
      this.burger.hide();
      return;
    }

    this.layoutFood(snapshot);
    if (isGrilling) this.burger.setCookState(snapshot.grill.state);
  }

  public playEntry(onComplete: () => void): void {
    const { customerX, customerY } = this.layoutState;
    this.customer.enter(customerX, customerY, this.reducedMotion, onComplete);
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

  public assembledBurger(assetKey: string): void {
    this.burger.setAssembled(assetKey);
  }

  public isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  public destroy(): void {
    this.background.destroy();
    this.counter.destroy();
    this.station.destroy();
    this.customer.destroy();
    this.burger.destroy();
    this.tray.destroy();
    this.hud.destroy();
  }

  private layoutFood(snapshot?: OrderSnapshot): void {
    const layout = this.layoutState;
    const assembled = snapshot?.assembled ?? false;
    const finalPhase = ['anticipation', 'payment', 'customer-leaving', 'next-order-ready'].includes(snapshot?.phase ?? '');
    const modifierPhase = snapshot?.phase === 'modifier-selection';
    const x = finalPhase ? layout.customerX - layout.customerSize * 0.54 : layout.stationX;
    const y = finalPhase
      ? layout.customerY + layout.customerSize * 0.55
      : modifierPhase ? layout.height * 0.59 : layout.stationY - layout.stationHeight * 0.08;
    const size = finalPhase ? layout.customerSize * 0.62 : layout.stationWidth * (assembled ? 0.58 : 0.38);
    const assetKey = snapshot?.food?.visualVariant ?? this.order.baseAssembledAssetKey;
    this.burger.layout(x, y, size, assembled, assetKey);
  }
}
