import { describe, expect, it } from 'vitest';
import { CustomerPatienceSession } from '../../src/game/customers/CustomerPatienceSession';

describe('CustomerPatienceSession', () => {
  it('tracks immutable remaining, elapsed, and normalized patience snapshots', () => {
    const patience = new CustomerPatienceSession(10_000);
    expect(patience.snapshot()).toEqual({
      remainingMs: 10_000,
      elapsedMs: 0,
      ratio: 1,
      expired: false,
      paused: false,
    });

    const partial = patience.advance(2_500);
    expect(partial).toEqual({
      remainingMs: 7_500,
      elapsedMs: 2_500,
      ratio: 0.75,
      expired: false,
      paused: false,
    });
    expect(Object.isFrozen(partial)).toBe(true);
    expect(patience.snapshot().remainingMs).toBe(7_500);
  });

  it('pauses and resumes idempotently without advancing while paused', () => {
    const patience = new CustomerPatienceSession(1_000);
    patience.advance(100);
    patience.pause();
    patience.pause();

    expect(patience.advance(700)).toMatchObject({ remainingMs: 900, elapsedMs: 100, paused: true });
    patience.resume();
    patience.resume();
    expect(patience.advance(200)).toMatchObject({ remainingMs: 700, elapsedMs: 300, paused: false });
  });

  it('clamps at zero without throwing or deciding order completion', () => {
    const patience = new CustomerPatienceSession(100);
    expect(patience.advance(150)).toEqual({
      remainingMs: 0,
      elapsedMs: 100,
      ratio: 0,
      expired: true,
      paused: false,
    });

    expect(patience.advance(50)).toMatchObject({ remainingMs: 0, expired: true });
    patience.pause();
    patience.resume();
    expect(patience.snapshot()).toMatchObject({ remainingMs: 0, expired: true, paused: false });
  });

  it('rejects invalid durations and deltas', () => {
    expect(() => new CustomerPatienceSession(0)).toThrow(/positive finite/);
    expect(() => new CustomerPatienceSession(Number.POSITIVE_INFINITY)).toThrow(/positive finite/);
    const patience = new CustomerPatienceSession(500);
    expect(() => patience.advance(-1)).toThrow(/non-negative finite/);
    expect(() => patience.advance(Number.NaN)).toThrow(/non-negative finite/);
  });
});
