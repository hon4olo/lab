export type CookState = 'raw' | 'cooked' | 'perfect' | 'burned';

export interface GrillResult {
  readonly ingredientId: string;
  readonly state: CookState;
  readonly elapsedMs: number;
  readonly quality: number;
  /** Authored grill position used by the hands-on station. */
  readonly slotId?: string;
  /** Present when the player used the hands-on flip interaction. */
  readonly flippedAtMs?: number;
  /** 0-100 timing quality for the flip. Legacy no-flip cooking omits this field. */
  readonly flipQuality?: number;
}

export interface GrillSnapshot {
  readonly active: boolean;
  readonly elapsedMs: number;
  readonly state: CookState;
  readonly progress: number;
  readonly result: GrillResult | null;
  /** Null until an ingredient has been physically placed on the grill. */
  readonly slotId: string | null;
  /** Null until a hands-on grill item is flipped. */
  readonly flippedAtMs: number | null;
  readonly flipped: boolean;
  readonly idealFlipAtMs: number;
}

export interface GrillTiming {
  readonly cookedAtMs: number;
  readonly perfectAtMs: number;
  readonly burnedAtMs: number;
  readonly idealStopAtMs: number;
}

export const GRILL_TIMING: GrillTiming = {
  cookedAtMs: 1200,
  perfectAtMs: 2500,
  burnedAtMs: 6000,
  idealStopAtMs: 3600,
} as const;

export class GrillSession {
  private active = false;
  private ingredientId: string | null = null;
  private slotId: string | null = null;
  private elapsedMs = 0;
  private flippedAtMs: number | null = null;
  private result: GrillResult | null = null;

  public constructor(private readonly timing: GrillTiming = GRILL_TIMING) {
    validateTiming(timing);
  }

  public start(ingredientId: string, slotId: string = 'slot-1'): void {
    if (this.active) throw new Error('The grill is already running.');
    this.active = true;
    this.ingredientId = ingredientId;
    this.slotId = slotId;
    this.elapsedMs = 0;
    this.flippedAtMs = null;
    this.result = null;
  }

  public advance(deltaMs: number): GrillSnapshot {
    if (this.active) this.elapsedMs += Math.max(0, deltaMs);
    return this.snapshot();
  }

  /**
   * Records the player's physical flip timing. The legacy start/stop route can
   * still omit flipping so old saves/tests and non-hands-on fallback remain stable.
   */
  public flip(): GrillSnapshot {
    if (!this.active || !this.ingredientId) throw new Error('The grill is not running.');
    if (this.flippedAtMs !== null) throw new Error('The grill item has already been flipped.');
    this.flippedAtMs = this.elapsedMs;
    return this.snapshot();
  }

  public stop(): GrillResult {
    if (!this.active || !this.ingredientId) throw new Error('The grill is not running.');
    this.active = false;
    const state = stateAt(this.elapsedMs, this.timing);
    const baseQuality = qualityAt(this.elapsedMs, state, this.timing);
    const flipQuality = this.flippedAtMs === null
      ? null
      : flipQualityAt(this.flippedAtMs, this.timing);

    const result: GrillResult = flipQuality === null
      ? {
          ingredientId: this.ingredientId,
          state,
          elapsedMs: this.elapsedMs,
          quality: baseQuality,
          ...(this.slotId ? { slotId: this.slotId } : {}),
        }
      : {
          ingredientId: this.ingredientId,
          state,
          elapsedMs: this.elapsedMs,
          quality: Math.round(baseQuality * (flipQuality / 100)),
          ...(this.slotId ? { slotId: this.slotId } : {}),
          flippedAtMs: this.flippedAtMs!,
          flipQuality,
        };
    this.result = result;
    return result;
  }

  public snapshot(): GrillSnapshot {
    const state = stateAt(this.elapsedMs, this.timing);
    return {
      active: this.active,
      elapsedMs: this.elapsedMs,
      state,
      progress: Math.min(1, this.elapsedMs / this.timing.burnedAtMs),
      result: this.result ? { ...this.result } : null,
      slotId: this.slotId,
      flippedAtMs: this.flippedAtMs,
      flipped: this.flippedAtMs !== null,
      idealFlipAtMs: idealFlipAt(this.timing),
    };
  }
}

function stateAt(elapsedMs: number, timing: GrillTiming): CookState {
  if (elapsedMs >= timing.burnedAtMs) return 'burned';
  if (elapsedMs >= timing.perfectAtMs) return 'perfect';
  if (elapsedMs >= timing.cookedAtMs) return 'cooked';
  return 'raw';
}

function qualityAt(elapsedMs: number, state: CookState, timing: GrillTiming): number {
  if (state === 'burned') return 0;
  if (state === 'raw') return 25;
  if (state === 'cooked') return 60;

  return perfectQualityAt(elapsedMs, timing);
}

function perfectQualityAt(elapsedMs: number, timing: GrillTiming): number {
  if (elapsedMs === timing.idealStopAtMs) return 100;

  // Each recipe authors its own cooking windows. Normalize the distance within
  // the appropriate side of that window so the quality curve scales with the
  // recipe timing instead of relying on a fixed milliseconds-per-point slope.
  const boundaryMs = elapsedMs < timing.idealStopAtMs
    ? timing.perfectAtMs
    : timing.burnedAtMs;
  const spanMs = Math.abs(timing.idealStopAtMs - boundaryMs);
  const distance = Math.abs(elapsedMs - timing.idealStopAtMs);
  const normalizedDistance = spanMs === 0 ? 1 : Math.min(1, distance / spanMs);

  return Math.round(100 - (40 * normalizedDistance));
}

function idealFlipAt(timing: GrillTiming): number {
  return timing.idealStopAtMs / 2;
}

function flipQualityAt(flippedAtMs: number, timing: GrillTiming): number {
  const ideal = idealFlipAt(timing);
  if (flippedAtMs === ideal) return 100;

  // A hands-on flip is intentionally forgiving: exact midpoint is perfect,
  // while a very early/late flip can reduce the cooking component to 60%.
  const distance = Math.abs(flippedAtMs - ideal);
  const normalizedDistance = ideal <= 0 ? 1 : Math.min(1, distance / ideal);
  return Math.round(100 - (40 * normalizedDistance));
}

function validateTiming(timing: GrillTiming): void {
  const values = [timing.cookedAtMs, timing.perfectAtMs, timing.burnedAtMs, timing.idealStopAtMs];
  if (!values.every((value) => Number.isFinite(value) && value >= 0) ||
      timing.cookedAtMs >= timing.perfectAtMs || timing.perfectAtMs >= timing.burnedAtMs ||
      timing.idealStopAtMs < timing.perfectAtMs || timing.idealStopAtMs >= timing.burnedAtMs) {
    throw new Error('Grill timing must progress raw → cooked → perfect → burned with a valid ideal stop.');
  }
}
