import type { BalanceConfig } from '../balance/BalanceConfig';
import type { CustomerDefinition } from '../customers/CustomerDefinition';
import { createCustomerInstance } from '../customers/createCustomerInstance';
import type { EconomySession, EconomySnapshot } from '../economy/EconomySession';
import type { OrderContent } from '../orders/OrderContent';
import { OrderSession, type OrderSnapshot } from '../orders/OrderSession';
import type { ProgressionContextProvider } from '../progression/ProgressionContext';
import type { TransformationDefinition } from '../transformations/TransformationDefinition';
import type { ShiftDefinition, ShiftOrderSlot } from './ShiftDefinition';
import { ShiftSession, type ShiftSnapshot } from './ShiftSession';

export interface ShiftControllerOptions {
  readonly definition: ShiftDefinition;
  readonly orders: ReadonlyMap<string, OrderContent>;
  readonly customers: ReadonlyMap<string, CustomerDefinition>;
  readonly transformations: readonly TransformationDefinition[];
  readonly economy: EconomySession;
  readonly progression: ProgressionContextProvider;
  readonly balance: BalanceConfig;
  readonly runId?: string;
  readonly restoredShift?: ShiftSnapshot;
}

export interface ShiftControllerSnapshot {
  readonly runId: string;
  readonly shift: ShiftSnapshot;
  readonly order: OrderSnapshot | null;
  readonly economy: EconomySnapshot;
}

export class ShiftController {
  private readonly session: ShiftSession;
  private readonly runId: string;
  private activeSession: OrderSession | null = null;
  private currentSlot: ShiftOrderSlot | null = null;

  public constructor(private readonly options: ShiftControllerOptions) {
    this.runId = options.runId ?? 'run-standalone';
    if (!this.runId) throw new Error('Shift run ID must not be empty.');
    this.session = new ShiftSession(options.definition, options.restoredShift);
    for (const slot of options.definition.orderSequence) {
      if (!options.orders.has(slot.orderId)) throw new Error(`Missing order content: ${slot.orderId}`);
      if (!options.customers.has(slot.customerId)) throw new Error(`Missing customer content: ${slot.customerId}`);
    }
  }

  public start(): void {
    if (this.activeSession) throw new Error('The shift has already started.');
    if (this.session.snapshot().phase === 'ready') this.session.start();
    else if (this.session.snapshot().phase === 'completed') {
      throw new Error('A completed shift cannot be started again.');
    }
    const slot = this.session.activeSlot();
    if (!slot) throw new Error('Started shift has no active order.');
    this.activate(slot);
  }

  public get orderSession(): OrderSession {
    if (!this.activeSession) throw new Error('The shift has not started.');
    return this.activeSession;
  }

  public get orderContent(): OrderContent {
    const slot = this.requireCurrentSlot();
    const content = this.options.orders.get(slot.orderId);
    if (!content) throw new Error(`Missing order content: ${slot.orderId}`);
    return content;
  }

  public get customerDefinition(): CustomerDefinition {
    const slot = this.requireCurrentSlot();
    const definition = this.options.customers.get(slot.customerId);
    if (!definition) throw new Error(`Missing customer content: ${slot.customerId}`);
    return definition;
  }

  public get economy(): EconomySession {
    return this.options.economy;
  }

  public get definition(): ShiftDefinition {
    return this.options.definition;
  }

  public get shiftSnapshot(): ShiftSnapshot {
    return this.session.snapshot();
  }

  public completeActiveOrder(): void {
    const slot = this.requireCurrentSlot();
    const order = this.orderSession.snapshot();
    const payment = order.payment;
    if (order.phase !== 'next-order-ready' || !payment) {
      throw new Error('An order must finish its customer exit before shift completion.');
    }
    if (!this.session.canComplete(slot.id, payment)) {
      throw new Error('Order payment has already been applied or does not match this shift slot.');
    }
    if (!this.options.economy.applyPayment(payment)) {
      throw new Error(`Payment transaction already applied: ${payment.transactionId}`);
    }
    this.session.completeOrder(slot.id, payment);

    const next = this.session.activeSlot();
    if (next) this.activate(next);
  }

  public snapshot(): ShiftControllerSnapshot {
    return {
      runId: this.runId,
      shift: this.session.snapshot(),
      order: this.activeSession?.snapshot() ?? null,
      economy: this.options.economy.snapshot(),
    };
  }

  private activate(slot: ShiftOrderSlot): void {
    const orderContent = this.options.orders.get(slot.orderId);
    const customer = this.options.customers.get(slot.customerId);
    if (!orderContent || !customer) throw new Error(`Incomplete content for shift order ${slot.id}.`);
    this.currentSlot = slot;
    this.activeSession = new OrderSession(
      orderContent.definition,
      createCustomerInstance(slot.customerInstanceId, customer),
      orderContent.ingredients,
      this.options.transformations,
      {
        transactionId: `${this.options.definition.id}:${this.runId}:${slot.id}`,
        progression: this.options.progression.getContext(),
        balance: this.options.balance,
      },
    );
  }

  private requireCurrentSlot(): ShiftOrderSlot {
    if (!this.currentSlot) throw new Error('The shift has not started.');
    return this.currentSlot;
  }
}
