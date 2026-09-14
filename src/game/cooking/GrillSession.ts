export type CookState = 'raw' | 'cooked' | 'perfect' | 'burned';

export interface GrillResult {
  readonly ingredientId: string;
  readonly state: CookState;
  readonly elapsedMs: number;
  readonly quality: number;
}

export interface GrillSnapshot {
  readonly active: boolean;
  readonly elapsedMs: number;
  readonly state: CookState;
  readonly progress: number;
  readonly result: GrillResult | null;
}

export const GRILL_TIMING = {
  cookedAtMs: 1200,
  perfectAtMs: 2500,
  burnedAtMs: 6000,
  idealStopAtMs: 3600,
} as const;

export class GrillSession {
  private active = false;
  private ingredientId: string | null = null;
  private elapsedMs = 0;
  private result: GrillResult | null = null;

  public start(ingredientId: string): void {
    if (this.active) throw new Error('The grill is already running.');
    this.active = true;
    this.ingredientId = ingredientId;
    this.elapsedMs = 0;
    this.result = null;
  }

  public advance(deltaMs: number): GrillSnapshot {
    if (this.active) this.elapsedMs += Math.max(0, deltaMs);
    return this.snapshot();
  }

  public stop(): GrillResult {
    if (!this.active || !this.ingredientId) throw new Error('The grill is not running.');
    this.active = false;
    const state = stateAt(this.elapsedMs);
    this.result = {
      ingredientId: this.ingredientId,
      state,
      elapsedMs: this.elapsedMs,
      quality: qualityAt(this.elapsedMs, state),
    };
    return this.result;
  }

  public snapshot(): GrillSnapshot {
    const state = stateAt(this.elapsedMs);
    return {
      active: this.active,
      elapsedMs: this.elapsedMs,
      state,
      progress: Math.min(1, this.elapsedMs / GRILL_TIMING.burnedAtMs),
      result: this.result ? { ...this.result } : null,
    };
  }
}

function stateAt(elapsedMs: number): CookState {
  if (elapsedMs >= GRILL_TIMING.burnedAtMs) return 'burned';
  if (elapsedMs >= GRILL_TIMING.perfectAtMs) return 'perfect';
  if (elapsedMs >= GRILL_TIMING.cookedAtMs) return 'cooked';
  return 'raw';
}

function qualityAt(elapsedMs: number, state: CookState): number {
  if (state === 'burned') return 0;
  if (state === 'raw') return 25;
  if (state === 'cooked') return 60;
  return Math.max(60, Math.round(100 - Math.abs(elapsedMs - GRILL_TIMING.idealStopAtMs) * 0.025));
}
