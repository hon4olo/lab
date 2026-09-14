import Phaser from 'phaser';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../../content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../content/orders/hotCheeseBurgerExtraSpicy';
import { TRANSFORMATIONS } from '../../content/transformations';
import { OrderSession, type OrderSnapshot } from '../../game/orders/OrderSession';
import type { TranslationKey } from '../../localization/createTranslator';
import { APP_EVENTS } from '../appEvents';
import { FeedbackDirector } from '../../presentation/order/FeedbackDirector';
import { OrderSceneView } from '../../presentation/order/OrderSceneView';
import type { OrderAction } from '../../presentation/order/orderActions';

export class OrderScene extends Phaser.Scene {
  private readonly order = HOT_CHEESE_BURGER_EXTRA_SPICY;
  private session!: OrderSession;
  private view!: OrderSceneView;
  private feedback!: FeedbackDirector;
  private readonly translate: (key: TranslationKey) => string;
  private readonly reducedMotion: boolean;

  public constructor(
    translate: (key: TranslationKey) => string,
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ) {
    super('OrderScene');
    this.translate = translate;
    this.reducedMotion = reducedMotion;
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    const customer = {
      id: 'customer.business-cat.order-01',
      type: this.order.customerType,
      variantId: 'customer.business-cat.neutral',
      patience: 1,
    } as const;
    this.session = new OrderSession(
      this.order,
      customer,
      HOT_CHEESE_BURGER_INGREDIENTS,
      TRANSFORMATIONS,
    );
    this.feedback = new FeedbackDirector(this, this.reducedMotion);
    this.view = new OrderSceneView(
      this,
      this.order,
      HOT_CHEESE_BURGER_INGREDIENTS,
      this.translate,
      (action) => this.handleAction(action),
      this.reducedMotion,
    );
    this.view.render(this.session.snapshot());
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });

    this.view.playEntry(() => {
      this.session.customerEntered();
      this.view.render(this.session.snapshot());
    });
    this.game.events.emit(APP_EVENTS.gameReady);
  }

  public update(_time: number, delta: number): void {
    const before = this.session.snapshot();
    if (before.phase !== 'grilling' || !before.grill.active) return;
    const grill = this.session.advanceGrill(delta);
    if (grill.state !== before.grill.state) {
      const layout = this.viewLayout();
      this.feedback.grillStateChanged(grill.state, layout.x, layout.y);
    }
    this.view.render(this.session.snapshot());
  }

  public getDiagnosticsSnapshot(): OrderSnapshot | null {
    if (!import.meta.env.DEV || !this.session) return null;
    return this.session.snapshot();
  }

  private handleAction(action: OrderAction): void {
    switch (action.type) {
      case 'ingredient':
        this.session.toggleIngredient(action.ingredientId);
        this.feedback.ingredientSelected(action.x, action.y);
        break;
      case 'open-prep':
        this.session.openPrepBoard();
        break;
      case 'prepare-ingredient':
        this.session.prepareIngredient(action.ingredientId);
        break;
      case 'continue-grill':
        this.session.continueToGrill();
        break;
      case 'toggle-grill':
        this.toggleGrill();
        break;
      case 'assemble':
        this.session.assemble();
        this.view.assembledBurger(this.order.baseAssembledAssetKey);
        break;
      case 'add-modifier':
        this.session.addModifier(action.ingredientId);
        this.view.assembledBurger(this.order.assembledAssetKey);
        this.feedback.ingredientSelected(this.scale.width * 0.5, this.scale.height * 0.72);
        break;
      case 'serve':
        this.serveOrder();
        break;
    }
    this.view.render(this.session.snapshot());
  }

  private toggleGrill(): void {
    const snapshot = this.session.snapshot();
    if (snapshot.grill.active) {
      const result = this.session.stopGrill();
      this.feedback.grillStateChanged(result.state, this.viewLayout().x, this.viewLayout().y);
      return;
    }
    this.session.startGrill();
  }

  private serveOrder(): void {
    this.session.serve();
    this.view.anticipate();
    this.view.render(this.session.snapshot());
    this.time.delayedCall(this.reducedMotion ? 300 : 850, () => this.revealReaction());
  }

  private revealReaction(): void {
    this.session.resolveReaction();
    const snapshot = this.session.snapshot();
    this.view.render(snapshot);
    const customer = this.view.customerPosition();
    if (snapshot.transformationResult) {
      this.feedback.transformation(customer.x, customer.y);
    }
    this.feedback.payment(customer.x, customer.y + 28);
    this.time.delayedCall(this.reducedMotion ? 500 : 1250, () => this.beginCustomerExit());
  }

  private beginCustomerExit(): void {
    this.session.beginCustomerLeaving();
    this.view.render(this.session.snapshot());
    this.view.playCustomerExit(() => {
      this.session.customerLeft();
      this.view.render(this.session.snapshot());
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.view.layout(gameSize.width, gameSize.height);
    this.view.render(this.session.snapshot());
  }

  private viewLayout(): { x: number; y: number } {
    const size = this.scale.gameSize;
    return { x: size.width * 0.40, y: size.height * 0.72 };
  }
}
