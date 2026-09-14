import type { GameplayTag } from '../ingredients/GameplayTag';

export interface IngredientCookState {
  readonly ingredientId: string;
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
  readonly cookStates: readonly IngredientCookState[];
  readonly stationHistory: readonly StationVisit[];
  readonly quality: number;
  readonly tags: ReadonlySet<GameplayTag>;
  readonly chaosScore: number;
  readonly mistakes: readonly FoodMistake[];
  readonly visualVariant: string;
}
