import type { PaymentTransaction } from '../economy/PaymentTransaction';
import type { ShiftDefinition } from './ShiftDefinition';

export type ShiftPhase = 'ready' | 'in-progress' | 'completed';

export interface ShiftSnapshot {
  readonly shiftId: string;
  readonly phase: ShiftPhase;
  readonly activeOrderIndex: number | null;
  readonly earnings: number;
  readonly completedOrders: readonly string[];
}

export class ShiftSession {
  private phase: ShiftPhase = 'ready';
  private activeOrderIndex: number | null = 0;
  private earnings = 0;
  private readonly completedOrders: string[] = [];
  private readonly paymentIds = new Set<string>();

  public constructor(private readonly definition: ShiftDefinition, restored?: ShiftSnapshot) {
    if (definition.orderSequence.length === 0) throw new Error('A shift needs at least one order slot.');
    const slotIds = definition.orderSequence.map((slot) => slot.id);
    if (new Set(slotIds).size !== slotIds.length) throw new Error('Shift order slot IDs must be unique.');
    if (restored) this.restore(restored, slotIds);
  }

  public start(): void {
    if (this.phase !== 'ready') throw new Error(`Cannot start a shift in ${this.phase}.`);
    this.phase = 'in-progress';
  }

  public canComplete(slotId: string, transaction: PaymentTransaction): boolean {
    const slot = this.activeSlot();
    return Boolean(
      this.phase === 'in-progress' &&
      slot?.id === slotId &&
      slot.orderId === transaction.orderId &&
      !this.paymentIds.has(transaction.transactionId),
    );
  }

  public completeOrder(slotId: string, transaction: PaymentTransaction): boolean {
    if (this.paymentIds.has(transaction.transactionId)) return false;
    if (!this.canComplete(slotId, transaction)) {
      throw new Error('Payment does not match the active shift order.');
    }

    this.paymentIds.add(transaction.transactionId);
    this.completedOrders.push(slotId);
    this.earnings += transaction.total;
    const nextIndex = (this.activeOrderIndex ?? 0) + 1;
    if (nextIndex < this.definition.orderSequence.length) this.activeOrderIndex = nextIndex;
    else {
      this.activeOrderIndex = null;
      this.phase = 'completed';
    }
    return true;
  }

  public activeSlot(): ShiftDefinition['orderSequence'][number] | null {
    return this.activeOrderIndex === null
      ? null
      : this.definition.orderSequence[this.activeOrderIndex] ?? null;
  }

  public snapshot(): ShiftSnapshot {
    return {
      shiftId: this.definition.id,
      phase: this.phase,
      activeOrderIndex: this.activeOrderIndex,
      earnings: this.earnings,
      completedOrders: [...this.completedOrders],
    };
  }

  private restore(snapshot: ShiftSnapshot, slotIds: readonly string[]): void {
    if (snapshot.shiftId !== this.definition.id) throw new Error('Restored shift ID does not match its definition.');
    if (!Number.isSafeInteger(snapshot.earnings) || snapshot.earnings < 0) {
      throw new Error('Restored shift earnings must be a non-negative safe integer.');
    }
    if (snapshot.completedOrders.some((id, index) => id !== slotIds[index])) {
      throw new Error('Restored completed orders must match the authored shift sequence.');
    }
    if (new Set(snapshot.completedOrders).size !== snapshot.completedOrders.length) {
      throw new Error('Restored shift contains duplicate completed orders.');
    }
    const completedCount = snapshot.completedOrders.length;
    if (snapshot.phase === 'ready') {
      if (completedCount !== 0 || snapshot.earnings !== 0 || snapshot.activeOrderIndex !== 0) {
        throw new Error('Restored ready shift contains progress.');
      }
    } else if (snapshot.phase === 'in-progress') {
      if (completedCount >= slotIds.length || snapshot.activeOrderIndex !== completedCount) {
        throw new Error('Restored active shift has an invalid order index.');
      }
    } else if (completedCount !== slotIds.length || snapshot.activeOrderIndex !== null) {
      throw new Error('Restored completed shift is incomplete.');
    }
    this.phase = snapshot.phase;
    this.activeOrderIndex = snapshot.activeOrderIndex;
    this.earnings = snapshot.earnings;
    this.completedOrders.push(...snapshot.completedOrders);
  }
}
