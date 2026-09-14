import type { PaymentTransaction } from './PaymentTransaction';

export interface EconomySnapshot {
  readonly persistentCoins: number;
  readonly sessionCoins: number;
  readonly coins: number;
  readonly appliedPaymentIds: readonly string[];
}

export class EconomySession {
  private sessionCoins = 0;
  private readonly appliedPaymentIds: Set<string>;

  public constructor(
    private readonly persistentCoins = 0,
    appliedPaymentIds: readonly string[] = [],
  ) {
    if (!Number.isSafeInteger(persistentCoins) || persistentCoins < 0) {
      throw new Error('Persistent coins must be a non-negative safe integer.');
    }
    if (new Set(appliedPaymentIds).size !== appliedPaymentIds.length ||
        appliedPaymentIds.some((id) => !id)) {
      throw new Error('Applied payment IDs must be unique and non-empty.');
    }
    this.appliedPaymentIds = new Set(appliedPaymentIds);
  }

  public applyPayment(transaction: PaymentTransaction): boolean {
    if (this.appliedPaymentIds.has(transaction.transactionId)) return false;
    if (!transaction.transactionId || !Number.isSafeInteger(transaction.total) || transaction.total < 0) {
      throw new Error('Payment transaction must have an ID and a non-negative integer total.');
    }

    this.appliedPaymentIds.add(transaction.transactionId);
    this.sessionCoins += transaction.total;
    return true;
  }

  public snapshot(): EconomySnapshot {
    return {
      persistentCoins: this.persistentCoins,
      sessionCoins: this.sessionCoins,
      coins: this.persistentCoins + this.sessionCoins,
      appliedPaymentIds: [...this.appliedPaymentIds],
    };
  }
}
