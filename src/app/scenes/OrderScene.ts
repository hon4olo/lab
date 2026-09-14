import Phaser from 'phaser';
import type { CampaignSession, CampaignSnapshot } from '../../game/campaign/CampaignSession';
import type { ShiftController } from '../../game/shifts/ShiftController';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { TranslationKey } from '../../localization/createTranslator';
import { APP_EVENTS } from '../appEvents';
import { FeedbackDirector } from '../../presentation/order/FeedbackDirector';
import { OrderSceneView } from '../../presentation/order/OrderSceneView';
import type { OrderAction } from '../../presentation/order/orderActions';

export class OrderScene extends Phaser.Scene {
  private view!: OrderSceneView;
  private feedback!: FeedbackDirector;
  private shiftCompletePresented = false;
  private replayInProgress = false;

  public constructor(
    private readonly translate: (key: TranslationKey) => string,
    private readonly campaign: CampaignSession,
    private readonly flushSave: () => Promise<void>,
    private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ) {
    super('OrderScene');
  }

  private get shift(): ShiftController {
    const active = this.campaign.activeShift;
    if (!active) throw new Error('The campaign has no active shift.');
    return active;
  }

  private get order(): OrderDefinition {
    return this.shift.orderContent.definition;
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.feedback = new FeedbackDirector(this, this.reducedMotion);
    this.createCurrentView();
    this.renderCurrentOrder();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.view.destroy();
    });

    if (this.campaign.activeShift) this.playCustomerEntry();
    this.game.events.emit(APP_EVENTS.gameReady);
  }

  public update(_time: number, delta: number): void {
    this.campaign.advanceActiveOrder(delta);
    const shift = this.campaign.activeShift;
    if (!shift) return;
    const before = shift.orderSession.snapshot();
    this.view.updatePatience(before);
    if (before.phase !== 'grilling' || !before.grill.active) return;
    const grill = shift.orderSession.advanceGrill(delta);
    if (grill.state !== before.grill.state) {
      const layout = this.viewLayout();
      this.feedback.grillStateChanged(grill.state, layout.x, layout.y);
    }
    this.renderCurrentOrder();
  }

  public getDiagnosticsSnapshot(): CampaignSnapshot {
    return this.campaign.snapshot();
  }

  public getLocalizedShiftCompleteLabel(): string | null {
    return this.shiftCompletePresented ? this.translate('shift.completed') : null;
  }

  private createCurrentView(): void {
    const active = this.campaign.activeShift;
    const finalOrder = this.campaign.lastShiftCompletion?.orderResults.at(-1);
    const orderId = active?.orderContent.definition.id ?? finalOrder?.orderId;
    const customerId = active?.customerDefinition.id ?? finalOrder?.customerId;
    if (!orderId || !customerId) throw new Error('Campaign has no active order or completed shift result.');
    const orderContent = active?.orderContent ?? this.campaign.getOrderContent(orderId);
    const customer = active?.customerDefinition ?? this.campaign.getCustomerDefinition(customerId);
    this.view = new OrderSceneView(
      this,
      orderContent.definition,
      customer,
      orderContent.ingredients,
      this.translate,
      (action) => this.handleAction(action),
      this.reducedMotion,
    );
  }

  private playCustomerEntry(): void {
    this.view.playEntry(() => {
      const active = this.campaign.activeShift;
      if (!active) return;
      active.orderSession.customerEntered();
      this.renderCurrentOrder();
    });
  }

  private renderCurrentOrder(): void {
    const snapshot = this.campaign.snapshot();
    const active = this.campaign.activeShift;
    if (active) {
      this.shiftCompletePresented = false;
      this.view.render(active.orderSession.snapshot(), snapshot.economy.coins, active.shiftSnapshot.phase);
      return;
    }
    const finalOrder = snapshot.lastCompletion?.orderResults.at(-1);
    if (finalOrder) {
      this.view.render(finalOrder.snapshot, snapshot.economy.coins, 'completed');
      this.shiftCompletePresented = true;
    }
  }

  private handleAction(action: OrderAction): void {
    if (action.type === 'replay-shift') {
      if (!this.replayInProgress) {
        this.replayInProgress = true;
        void this.replayShift().catch((error: unknown) => {
          this.replayInProgress = false;
          console.error('Could not start the replayed shift.', error);
        });
      }
      return;
    }
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
    this.time.delayedCall(this.reducedMotion ? 300 : 850, () => void this.revealReaction());
  }

  private async revealReaction(): Promise<void> {
    const { snapshot } = this.campaign.resolveActiveReaction();
    await this.flushSave();
    this.renderCurrentOrder();
    const customer = this.view.customerPosition();
    if (snapshot.transformationResult) this.feedback.transformation(customer.x, customer.y);
    this.feedback.payment(customer.x, customer.y + 28);
    this.time.delayedCall(this.reducedMotion ? 500 : 1250, () => this.beginCustomerExit());
  }

  private beginCustomerExit(): void {
    this.shift.orderSession.beginCustomerLeaving();
    this.renderCurrentOrder();
    this.view.playCustomerExit(() => void this.finishCustomerExit());
  }

  private async finishCustomerExit(): Promise<void> {
    this.shift.orderSession.customerLeft();
    this.campaign.completeActiveOrder();
    await this.flushSave();
    if (this.campaign.activeShift) {
      this.view.destroy();
      this.createCurrentView();
      this.renderCurrentOrder();
      this.playCustomerEntry();
    } else {
      this.renderCurrentOrder();
    }
  }

  private async replayShift(): Promise<void> {
    this.campaign.replayCompletedShift();
    await this.flushSave();
    this.view.destroy();
    this.createCurrentView();
    this.renderCurrentOrder();
    this.playCustomerEntry();
    this.replayInProgress = false;
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
