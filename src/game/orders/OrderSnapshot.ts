import type { AssemblyEvaluation } from '../assembly/AssemblyEvaluation';
import type { FoodAssemblySnapshot } from '../assembly/AssemblySession';
import type { FoodInstance } from '../cooking/FoodInstance';
import type { GrillSnapshot } from '../cooking/GrillSession';
import type { CustomerPatienceSnapshot } from '../customers/CustomerPatienceSession';
import type { PaymentTransaction } from '../economy/PaymentTransaction';
import type { ScoreResult } from '../scoring/OrderScoring';

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
  readonly patience: CustomerPatienceSnapshot;
  readonly selectedIngredients: readonly string[];
  readonly preparedIngredients: readonly string[];
  readonly food: FoodInstanceSnapshot | null;
  readonly grill: GrillSnapshot;
  readonly assembled: boolean;
  /** Present when the recipe owns a spatial Build Station contract. */
  readonly assembly?: FoodAssemblySnapshot;
  /** True when all minimum authored spatial assembly rules are satisfied. */
  readonly assemblyReady?: boolean;
  /** Present after a spatial assembly has been completed/evaluated. */
  readonly assemblyEvaluation?: AssemblyEvaluation;
  readonly scores: ScoreResult | null;
  readonly transformationResult: TransformationSnapshot | null;
  readonly payment: PaymentTransaction | null;
}

export interface FoodInstanceSnapshot extends Omit<FoodInstance, 'tags'> {
  readonly tags: readonly string[];
}

export interface TransformationSnapshot {
  readonly id: string;
  readonly resultAppearance: string;
  /** Optional for compatibility with v2 saves written before Batch 02. */
  readonly appearanceAssets: readonly string[];
  readonly appearanceMode?: 'overlay' | 'full';
  readonly effectAssets?: readonly string[];
  readonly reactionSequence: string;
}
