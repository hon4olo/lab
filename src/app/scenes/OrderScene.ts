import Phaser from 'phaser';
import type { ShiftController } from '../../game/shifts/ShiftController';
import type { ShiftControllerSnapshot } from '../../game/shifts/ShiftController';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { TranslationKey } from '../../localization/createTranslator';
import { APP_EVENTS } from '../appEvents';
import { FeedbackDirector } from '../../presentation/order/FeedbackDirector';
import { OrderSceneView } from '../../presentation/order/OrderSceneView';
import type { OrderAction } from '../../presentation/order/orderActions';

export class OrderScene extends Phaser.Scene {
  private view!: OrderSceneView;
  private feedback!: FeedbackDirector;
  private readonly translate: (key: TranslationKey) => string;
  private readonly reducedMotion: boolean;

  public constructor(
    translate: (key: TranslationKey) => string,
    private readonly shift: ShiftController,
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ) {
    super('OrderScene');
    this.translate = translate;
    this.reducedMotion = reducedMotion;
  }

  private get order(): OrderDefinition {
    return this.shift.orderContent.definition;
  }

  private get orderSnapshot(): OrderSnapshot {
    return this.shift.orderSession.snapshot();
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.shift.start();
    this.feedback = new FeedbackDirector(this, this.reducedMotion);
    this.createCurrentView();
    this.renderCurrentOrder();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.view.destroy();
    });

    this.playCustomerEntry();
    this.game.events.emit(APP_EVENTS.gameReady);
  }

  public update(_time: number, delta: number): void {
    const before = this.orderSnapshot;
    if (before.phase !== 'grilling' || !before.grill.active) return;
    const grill = this.shift.orderSession.advanceGrill(delta);
    if (grill.state !== before.grill.state) {
      const layout = this.viewLayout();
      this.feedback.grillStateChanged(grill.state, layout.x, layout.y);
    }
    this.renderCurrentOrder();
  }

  public getDiagnosticsSnapshot(): ShiftControllerSnapshot | null {
    if (!import.meta.env.DEV) return null;
    return this.shift.snapshot();
  }

  private createCurrentView(): void {
    this.view = new OrderSceneView(
      this,
      this.order,
      this.shift.customerDefinition,
      this.shift.orderContent.ingredients,
      this.translate,
      (action) => this.handleAction(action),
      this.reducedMotion,
    );
  }

  private playCustomerEntry(): void {
    this.view.playEntry(() => {
      this.shift.orderSession.customerEntered();
      this.renderCurrentOrder();
    });
  }

  private renderCurrentOrder(): void {
    this.view.render(this.orderSnapshot, this.shift.economy.snapshot().coins, this.shift.shiftSnapshot.phase);
  }

  private handleAction(action: OrderAction): void {
    const session = this.shift.orderSession;
    switch (action.type) {
      case 'ingredient':
        session.toggleIngredient(action.ingredientId);
        this.feedback.ingredientSelected(action.x, action.y);
        break;
      case 'open-prep':
        session.openPrepBoard();
        break;
      case 'prepare-ingredient':
        session.prepareIngredient(action.ingredientId);
        break;
      case 'continue-grill':
        session.continueToGrill();
        break;
      case 'toggle-grill':
        this.toggleGrill();
        break;
      case 'assemble':
        session.assemble();
        this.view.assembledBurger(this.order.baseAssembledAssetKey);
        break;
      case 'add-modifier':
        session.addModifier(action.ingredientId);
        this.view.assembledBurger(this.order.assembledAssetKey);
        this.feedback.ingredientSelected(this.scale.width * 0.5, this.scale.height * 0.72);
        break;
      case 'serve':
        this.serveOrder();
        break;
    }
    this.renderCurrentOrder();
  }

  private toggleGrill(): void {
    const session = this.shift.orderSession;
    const snapshot = session.snapshot();
    if (snapshot.grill.active) {
      const result = session.stopGrill();
      this.feedback.grillStateChanged(result.state, this.viewLayout().x, this.viewLayout().y);
      return;
    }
    session.startGrill();
  }

  private serveOrder(): void {
    this.shift.orderSession.serve();
    this.view.anticipate();
    this.renderCurrentOrder();
    this.time.delayedCall(this.reducedMotion ? 300 : 850, () => this.revealReaction());
  }

  private revealReaction(): void {
    this.shift.orderSession.resolveReaction();
    const snapshot = this.orderSnapshot;
    this.renderCurrentOrder();
    const customer = this.view.customerPosition();
    if (snapshot.transformationResult) this.feedback.transformation(customer.x, customer.y);
    this.feedback.payment(customer.x, customer.y + 28);
    this.time.delayedCall(this.reducedMotion ? 500 : 1250, () => this.beginCustomerExit());
  }

  private beginCustomerExit(): void {
    this.shift.orderSession.beginCustomerLeaving();
    this.renderCurrentOrder();
    this.view.playCustomerExit(() => {
      this.shift.orderSession.customerLeft();
      this.shift.completeActiveOrder();
      if (this.shift.shiftSnapshot.phase === 'in-progress') {
        this.view.destroy();
        this.createCurrentView();
        this.renderCurrentOrder();
        this.playCustomerEntry();
      } else {
        this.renderCurrentOrder();
      }
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.view.layout(gameSize.width, gameSize.height);
    this.renderCurrentOrder();
  }

  private viewLayout(): { x: number; y: number } {
    const size = this.scale.gameSize;
    return { x: size.width * 0.40, y: size.height * 0.72 };
  }
}
