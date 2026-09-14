import type { PaymentResult } from './PaymentCalculator';

export interface PaymentTransaction extends PaymentResult {
  readonly transactionId: string;
  readonly orderId: string;
}
