export interface CustomerPatienceSnapshot {
  readonly remainingMs: number;
  readonly elapsedMs: number;
  /** Fraction of the authored patience duration that remains, from 1 to 0. */
  readonly ratio: number;
  readonly expired: boolean;
  readonly paused: boolean;
}

export class CustomerPatienceSession {
  private remainingMs: number;
  private paused = false;

  public constructor(private readonly durationMs: number) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('Customer patience duration must be a positive finite number of milliseconds.');
    }
    this.remainingMs = durationMs;
  }

  public advance(deltaMs: number): CustomerPatienceSnapshot {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      throw new Error('Customer patience delta must be a non-negative finite number of milliseconds.');
    }
    if (!this.paused && this.remainingMs > 0) {
      this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    }
    return this.snapshot();
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  public snapshot(): CustomerPatienceSnapshot {
    const elapsedMs = this.durationMs - this.remainingMs;
    return Object.freeze({
      remainingMs: this.remainingMs,
      elapsedMs,
      ratio: this.remainingMs / this.durationMs,
      expired: this.remainingMs === 0,
      paused: this.paused,
    });
  }
}
