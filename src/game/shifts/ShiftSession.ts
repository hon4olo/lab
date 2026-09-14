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

  public constructor(private readonly definition: ShiftDefinition) {
    if (definition.orderSequence.length === 0) throw new Error('A shift needs at least one order slot.');
    const slotIds = definition.orderSequence.map((slot) => slot.id);
    if (new Set(slotIds).size !== slotIds.length) throw new Error('Shift order slot IDs must be unique.');
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
}
