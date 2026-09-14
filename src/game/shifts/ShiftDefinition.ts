export interface ShiftOrderSlot {
  readonly id: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly customerInstanceId: string;
}

export interface ShiftDefinition {
  readonly id: string;
  readonly orderSequence: readonly ShiftOrderSlot[];
}
