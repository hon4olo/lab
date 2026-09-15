import type { FoodAssemblySnapshot } from '../assembly/AssemblySession';
import type { GameplayTag } from '../ingredients/GameplayTag';
import type { CookState } from './GrillSession';

export interface IngredientCookState {
  readonly ingredientId: string;
  readonly cookState: CookState;
  readonly heat: number;
  readonly cold: number;
  readonly processing: number;
  readonly burned: boolean;
}

export interface StationVisit {
  readonly stationId: string;
  readonly result: string;
  readonly quality: number;
}

export interface FoodMistake {
  readonly code: string;
  readonly severity: 'minor' | 'major';
}

export interface FoodInstance {
  readonly id: string;
  readonly ingredients: readonly string[];
  readonly ingredientOrder: readonly string[];
  /**
   * Optional hands-on Build Station result. Legacy content may omit it while migrating,
   * but completed spatial assembly should be stored here rather than reduced to a boolean.
   */
  readonly assembly?: FoodAssemblySnapshot;
  readonly cookStates: readonly IngredientCookState[];
  readonly stationHistory: readonly StationVisit[];
  readonly quality: number;
  readonly tags: ReadonlySet<GameplayTag>;
  readonly chaosScore: number;
  readonly mistakes: readonly FoodMistake[];
  readonly visualVariant: string;
}
