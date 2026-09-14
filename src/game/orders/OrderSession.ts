import type { TransformationDefinition } from '../transformations/TransformationDefinition';
import type { FoodInstance } from '../cooking/FoodInstance';
import type { GrillResult, GrillSnapshot } from '../cooking/GrillSession';
import type { IngredientDefinition } from '../ingredients/IngredientDefinition';
import { GrillSession } from '../cooking/GrillSession';
import { createFoodInstance } from '../cooking/createFoodInstance';
import { PrepBoardSession } from '../cooking/PrepBoardSession';
import type { CustomerInstance } from '../customers/CustomerInstance';
import { CustomerLifecycle } from '../customers/CustomerLifecycle';
import { calculatePayment, type PaymentResult } from '../economy/PaymentCalculator';
import { IngredientSelection } from '../ingredients/IngredientSelection';
import { assembleBurger } from '../recipes/BurgerAssembler';
import type { ScoreResult } from '../scoring/OrderScoring';
import { scoreOrder } from '../scoring/OrderScoring';
import type { OrderDefinition } from './OrderDefinition';
import { resolveTransformation } from '../transformations/resolveTransformation';

export type OrderPhase =
  | 'customer-entering'
  | 'ingredient-selection'
  | 'prep-board'
  | 'grilling'
  | 'assembly'
  | 'modifier-selection'
  | 'anticipation'
  | 'payment'
  | 'customer-leaving'
  | 'next-order-ready';

export interface OrderSnapshot {
  readonly orderId: string;
  readonly phase: OrderPhase;
  readonly customerPhase: string;
  readonly selectedIngredients: readonly string[];
  readonly preparedIngredients: readonly string[];
  readonly food: FoodInstanceSnapshot | null;
  readonly grill: GrillSnapshot;
  readonly assembled: boolean;
  readonly scores: ScoreResult | null;
  readonly transformationResult: TransformationSnapshot | null;
  readonly payment: PaymentResult | null;
  readonly coins: number;
}

export interface FoodInstanceSnapshot extends Omit<FoodInstance, 'tags'> {
  readonly tags: readonly string[];
}

export interface TransformationSnapshot {
  readonly id: string;
  readonly resultAppearance: string;
  readonly appearanceAssets: readonly string[];
  readonly reactionSequence: string;
}

export class OrderSession {
  private phase: OrderPhase = 'customer-entering';
  private readonly selection: IngredientSelection;
  private readonly prepBoard: PrepBoardSession;
  private readonly grillSession = new GrillSession();
  private readonly lifecycle = new CustomerLifecycle();
  private grillResult: GrillResult | null = null;
  private food: FoodInstance | null = null;
  private assembled = false;
  private scores: ScoreResult | null = null;
  private transformation: TransformationDefinition | null = null;
  private payment: PaymentResult | null = null;
  private coins = 0;

  public constructor(
    private readonly order: OrderDefinition,
    private readonly customer: CustomerInstance,
    private readonly ingredients: readonly IngredientDefinition[],
    private readonly transformations: readonly TransformationDefinition[],
  ) {
    this.selection = new IngredientSelection(ingredients);
    this.prepBoard = new PrepBoardSession(ingredients);
    this.lifecycle.beginEntry();
  }

  public customerEntered(): void {
    this.requirePhase('customer-entering');
    this.lifecycle.finishEntry();
    this.phase = 'ingredient-selection';
  }

  public toggleIngredient(ingredientId: string): void {
    this.requirePhase('ingredient-selection');
    if (ingredientId === this.order.modifierIngredientId) {
      throw new Error('The order modifier is added after burger assembly.');
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
    const result = assembleBurger(this.food, this.order.expectedIngredientOrder, this.order.baseAssembledAssetKey);
    this.food = result.food;
    this.assembled = true;
    this.phase = 'modifier-selection';
  }

  public addModifier(ingredientId: string): void {
    this.requirePhase('modifier-selection');
    if (ingredientId !== this.order.modifierIngredientId) {
      throw new Error(`Unsupported modifier for this order: ${ingredientId}`);
    }
    this.selection.toggle(ingredientId);
    this.refreshFood();
    this.phase = 'assembly';
  }

  public serve(): void {
    this.requirePhase('assembly');
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
    });
    this.transformation = resolveTransformation(
      this.food,
      this.customer,
      { unlockedIds: new Set() },
      this.transformations,
    );
    this.payment = calculatePayment({
      basePayment: this.order.basePayment,
      baseTip: this.order.baseTip,
      score: this.scores,
      transformationRewardModifier: this.transformation?.rewardModifier ?? 1,
    });
    this.coins += this.payment.total;
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
      selectedIngredients: this.selection.getSelected(),
      preparedIngredients: this.prepBoard.getPrepared(),
      food: this.food ? toFoodSnapshot(this.food) : null,
      grill: this.grillSession.snapshot(),
      assembled: this.assembled,
      scores: this.scores ? { ...this.scores } : null,
      transformationResult: transformation
        ? {
            id: transformation.id,
            resultAppearance: transformation.resultAppearance,
            appearanceAssets: [...transformation.appearanceAssets],
            reactionSequence: transformation.reactionSequence,
          }
        : null,
      payment: this.payment ? { ...this.payment } : null,
      coins: this.coins,
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
      const visualAsset = this.selection.includes(this.order.modifierIngredientId)
        ? this.order.assembledAssetKey
        : this.order.baseAssembledAssetKey;
      this.food = assembleBurger(this.food, this.order.expectedIngredientOrder, visualAsset).food;
    }
  }

  private requirePhase(expected: OrderPhase): void {
    if (this.phase !== expected) throw new Error(`Order is in ${this.phase}; expected ${expected}.`);
  }
}

function toFoodSnapshot(food: FoodInstance): FoodInstanceSnapshot {
  const { tags, ...rest } = food;
  return { ...rest, tags: [...tags] };
}
