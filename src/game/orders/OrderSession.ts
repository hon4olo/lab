import type { TransformationDefinition } from '../transformations/TransformationDefinition';
import type { FoodInstance } from '../cooking/FoodInstance';
import { GrillSession, type GrillResult, type GrillSnapshot } from '../cooking/GrillSession';
import type { IngredientDefinition } from '../ingredients/IngredientDefinition';
import { createFoodInstance } from '../cooking/createFoodInstance';
import { PrepBoardSession } from '../cooking/PrepBoardSession';
import type { CustomerInstance } from '../customers/CustomerInstance';
import { CustomerPatienceSession, type CustomerPatienceSnapshot } from '../customers/CustomerPatienceSession';
import { CustomerLifecycle } from '../customers/CustomerLifecycle';
import { calculatePayment } from '../economy/PaymentCalculator';
import { IngredientSelection } from '../ingredients/IngredientSelection';
import { assembleFood } from '../recipes/FoodAssembler';
import type { ScoreResult } from '../scoring/OrderScoring';
import { scoreOrder } from '../scoring/OrderScoring';
import type { OrderDefinition } from './OrderDefinition';
import {
  allRequiredModifiersSelected,
  hasAppliedVariation,
  hasModifiers,
  modifierIngredientIds,
  orderVariationAssetKey,
  selectableBaseIngredientIds,
} from './OrderRequirements';
import { resolveTransformation } from '../transformations/resolveTransformation';
import type { ProgressionContext } from '../progression/ProgressionContext';
import type { BalanceConfig } from '../balance/BalanceConfig';
import type { PaymentTransaction } from '../economy/PaymentTransaction';
import type { OrderPhase, OrderSnapshot } from './OrderSnapshot';

export type {
  FoodInstanceSnapshot,
  OrderPhase,
  OrderSnapshot,
  TransformationSnapshot,
} from './OrderSnapshot';

export interface OrderSessionOptions {
  readonly transactionId: string;
  readonly progression: ProgressionContext;
  readonly balance: BalanceConfig;
}

export class OrderSession {
  private phase: OrderPhase = 'customer-entering';
  private readonly selection: IngredientSelection;
  private readonly prepBoard: PrepBoardSession;
  private readonly grillSession: GrillSession;
  private readonly lifecycle = new CustomerLifecycle();
  private readonly patience: CustomerPatienceSession;
  private grillResult: GrillResult | null = null;
  private food: FoodInstance | null = null;
  private assembled = false;
  private scores: ScoreResult | null = null;
  private transformation: TransformationDefinition | null = null;
  private payment: PaymentTransaction | null = null;

  public constructor(
    private readonly order: OrderDefinition,
    private readonly customer: CustomerInstance,
    private readonly ingredients: readonly IngredientDefinition[],
    private readonly transformations: readonly TransformationDefinition[],
    private readonly options: OrderSessionOptions,
  ) {
    this.grillSession = new GrillSession(order.grillTiming);
    this.selection = new IngredientSelection(ingredients);
    this.prepBoard = new PrepBoardSession(ingredients);
    this.patience = new CustomerPatienceSession(customer.patienceMs);
    this.lifecycle.beginEntry();
  }

  public customerEntered(): void {
    this.requirePhase('customer-entering');
    this.lifecycle.finishEntry();
    this.phase = 'ingredient-selection';
  }

  public advancePatience(deltaMs: number): CustomerPatienceSnapshot {
    if (this.isCustomerWaiting()) return this.patience.advance(deltaMs);
    return this.patience.snapshot();
  }

  public pausePatience(): void {
    this.patience.pause();
  }

  public resumePatience(): void {
    this.patience.resume();
  }

  public toggleIngredient(ingredientId: string): void {
    this.requirePhase('ingredient-selection');
    if (modifierIngredientIds(this.order).includes(ingredientId)) {
      throw new Error('The order modifier is added after food assembly.');
    }
    if (!selectableBaseIngredientIds(this.order).includes(ingredientId)) {
      throw new Error(`Ingredient ${ingredientId} is not available for this order.`);
    }
    this.selection.toggle(ingredientId);
    this.refreshFood();
  }

  public openPrepBoard(): void {
    this.requirePhase('ingredient-selection');
    this.phase = 'prep-board';
  }

  public prepareIngredient(ingredientId: string): void {
    this.requirePhase('prep-board');
    this.prepBoard.prepare(ingredientId, this.selection.getSelected());
    this.refreshFood();
  }

  public continueToGrill(): void {
    this.requirePhase('prep-board');
    this.phase = 'grilling';
    this.refreshFood();
  }

  public startGrill(): void {
    this.requirePhase('grilling');
    this.grillSession.start(this.order.grillIngredientId);
  }

  public advanceGrill(deltaMs: number): GrillSnapshot {
    if (this.phase !== 'grilling') return this.grillSession.snapshot();
    return this.grillSession.advance(deltaMs);
  }

  public stopGrill(): GrillResult {
    this.requirePhase('grilling');
    this.grillResult = this.grillSession.stop();
    this.refreshFood();
    this.phase = 'assembly';
    return this.grillResult;
  }

  public assemble(): void {
    this.requirePhase('assembly');
    this.refreshFood();
    if (!this.food) throw new Error('Food cannot be assembled before ingredients are selected.');
    const result = assembleFood(this.food, this.order.expectedIngredientOrder, this.order.baseAssembledAssetKey);
    this.food = result.food;
    this.assembled = true;
    this.phase = hasModifiers(this.order) ? 'modifier-selection' : 'assembly';
  }

  public addModifier(ingredientId: string): void {
    this.requirePhase('modifier-selection');
    if (!modifierIngredientIds(this.order).includes(ingredientId)) {
      throw new Error(`Unsupported modifier for this order: ${ingredientId}`);
    }
    this.selection.toggle(ingredientId);
    this.refreshFood();
  }

  public serve(): void {
    if (this.phase === 'modifier-selection') {
      if (!allRequiredModifiersSelected(this.order, this.selection.getSelected())) {
        throw new Error('The order requires additional modifiers before serving.');
      }
    } else {
      this.requirePhase('assembly');
    }
    if (!this.assembled) throw new Error('Assemble the burger before serving it.');
    this.lifecycle.serveOrder();
    this.phase = 'anticipation';
  }

  public resolveReaction(): void {
    this.requirePhase('anticipation');
    if (!this.food) throw new Error('Cannot resolve a reaction without food.');
    this.scores = scoreOrder({
      order: this.order,
      selectedIngredients: this.selection.getSelected(),
      preparedIngredients: this.prepBoard.getPrepared(),
      assembled: this.assembled,
      food: this.food,
    }, this.options.balance);
    this.transformation = resolveTransformation(
      this.food,
      this.customer,
      this.options.progression,
      this.transformations,
    );
    const result = calculatePayment({
      basePayment: this.order.basePayment,
      baseTip: this.order.baseTip,
      score: this.scores,
      transformationRewardModifier: this.transformation?.rewardModifier ?? 1,
    }, this.options.balance);
    this.payment = {
      ...result,
      transactionId: this.options.transactionId,
      orderId: this.order.id,
    };
    this.lifecycle.completeReaction();
    this.phase = 'payment';
  }

  public beginCustomerLeaving(): void {
    this.requirePhase('payment');
    this.lifecycle.beginLeaving();
    this.phase = 'customer-leaving';
  }

  public customerLeft(): void {
    this.requirePhase('customer-leaving');
    this.lifecycle.finishLeaving();
    this.phase = 'next-order-ready';
  }

  public snapshot(): OrderSnapshot {
    const transformation = this.transformation;
    return {
      orderId: this.order.id,
      phase: this.phase,
      customerPhase: this.lifecycle.snapshot(),
      patience: this.patience.snapshot(),
      selectedIngredients: this.selection.getSelected(),
      preparedIngredients: this.prepBoard.getPrepared(),
      food: this.food ? { ...this.food, tags: [...this.food.tags] } : null,
      grill: this.grillSession.snapshot(),
      assembled: this.assembled,
      scores: this.scores ? { ...this.scores } : null,
      transformationResult: transformation
        ? {
            id: transformation.id,
            resultAppearance: transformation.resultAppearance,
            appearanceAssets: [...transformation.appearanceAssets],
            appearanceMode: transformation.appearanceMode ?? 'overlay',
            effectAssets: [...(transformation.effectAssets ?? [])],
            reactionSequence: transformation.reactionSequence,
          }
        : null,
      payment: this.payment ? { ...this.payment } : null,
    };
  }

  private refreshFood(): void {
    const history: readonly { stationId: string; result: string; quality: number }[] = [
      ...(this.prepBoard.getPrepared().length > 0
        ? [{ stationId: 'station.prep-board.street', result: 'prepared', quality: 1 }]
        : []),
      ...(this.grillResult
        ? [{ stationId: 'station.grill.street', result: this.grillResult.state, quality: this.grillResult.quality }]
        : []),
    ];
    const foodBuildInput = {
      id: this.order.foodInstanceId,
      selectedIds: this.selection.getSelected(),
      preparedIds: this.prepBoard.getPrepared(),
      ingredients: this.ingredients,
      grillResult: this.grillResult,
      stationHistory: history,
    };
    this.food = createFoodInstance(foodBuildInput);
    if (this.assembled) {
      const variationAsset = orderVariationAssetKey(this.order);
      const visualAsset = hasAppliedVariation(this.order, this.selection.getSelected()) && variationAsset
        ? variationAsset
        : this.order.baseAssembledAssetKey;
      this.food = assembleFood(this.food, this.order.expectedIngredientOrder, visualAsset).food;
    }
  }

  private isCustomerWaiting(): boolean {
    return ['ingredient-selection', 'prep-board', 'grilling', 'assembly', 'modifier-selection'].includes(this.phase);
  }
  private requirePhase(expected: OrderPhase): void {
    if (this.phase !== expected) throw new Error(`Order is in ${this.phase}; expected ${expected}.`);
  }
}
