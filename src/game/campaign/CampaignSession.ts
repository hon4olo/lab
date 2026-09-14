import { EconomySession } from '../economy/EconomySession';
import type { OrderContent } from '../orders/OrderContent';
import type { OrderSnapshot } from '../orders/OrderSession';
import type { CustomerDefinition } from '../customers/CustomerDefinition';
import type { ProgressionContext } from '../progression/ProgressionContext';
import { createProgressionContext } from '../progression/ProgressionContext';
import type { CampaignContent, CampaignPhase, CampaignRestoreState, CampaignSnapshot } from './CampaignContracts';
import type { ChapterDefinition } from './ChapterDefinition';
import type { ShiftController } from '../shifts/ShiftController';
import type { ShiftDefinition } from '../shifts/ShiftDefinition';
import type { ShiftSnapshot } from '../shifts/ShiftSession';
import type { SavedOrderResult, ShiftCompletionRecord, UnlockSaveData } from '../../save/SaveSchema';

export type { CampaignContent, CampaignPhase, CampaignRestoreState, CampaignSnapshot } from './CampaignContracts';

export class CampaignSession {
  private readonly economy: EconomySession;
  private readonly completedShiftIds: Set<string>;
  private readonly discoveredTransformationIds: Set<string>;
  private readonly listeners = new Set<(snapshot: CampaignSnapshot) => void>();
  private readonly unlocks: {
    ingredientIds: Set<string>;
    recipeIds: Set<string>;
    transformationIds: Set<string>;
    upgradeIds: Set<string>;
    decorationIds: Set<string>;
  };
  private phase: CampaignPhase = 'ready';
  private chapterId: string;
  private activeShiftId: string | null;
  private activeRunId: string | null;
  private runSequence: number;
  private activeShiftSnapshot: ShiftSnapshot | null;
  private activeOrderResults: SavedOrderResult[];
  private lastCompletion: ShiftCompletionRecord | null;
  private activeShiftController: ShiftController | null = null;
  private started = false;

  public constructor(private readonly content: CampaignContent, restore: CampaignRestoreState) {
    this.economy = new EconomySession(restore.economy.coins, restore.economy.appliedPaymentIds);
    this.completedShiftIds = new Set(restore.completedShiftIds);
    this.discoveredTransformationIds = new Set(restore.discoveredTransformationIds);
    this.unlocks = {
      ingredientIds: new Set(restore.unlocks.ingredientIds),
      recipeIds: new Set(restore.unlocks.recipeIds),
      transformationIds: new Set(restore.unlocks.transformationIds),
      upgradeIds: new Set(restore.unlocks.upgradeIds),
      decorationIds: new Set(restore.unlocks.decorationIds),
    };
    this.chapterId = restore.chapterId;
    this.activeShiftId = restore.activeShiftId;
    this.activeRunId = restore.activeRunId;
    this.runSequence = restore.runSequence;
    this.activeShiftSnapshot = restore.activeShiftSnapshot;
    this.activeOrderResults = [...restore.activeOrderResults];
    this.lastCompletion = restore.lastCompletion;
  }

  public startOrRestore(): void {
    if (this.started) throw new Error('Campaign has already started.');
    const chapter = this.requireChapter(this.chapterId);
    this.started = true;
    if (this.activeShiftId) {
      const definition = this.requireShiftInChapter(chapter, this.activeShiftId);
      if (!this.activeRunId || !this.activeShiftSnapshot) throw new Error('Active shift save is incomplete.');
      this.activate(definition, this.activeRunId, this.activeShiftSnapshot);
      this.activeShiftController!.start();
      this.phase = 'shift-in-progress';
      this.notify();
      return;
    }
    if (this.lastCompletion && chapter.shiftIds.includes(this.lastCompletion.shiftId)) {
      this.phase = 'shift-complete';
      return;
    }
    this.startNextShift();
  }

  public get activeShift(): ShiftController | null {
    return this.activeShiftController;
  }

  public get phaseSnapshot(): CampaignPhase {
    return this.phase;
  }

  public get lastShiftCompletion(): ShiftCompletionRecord | null {
    return this.lastCompletion ? structuredClone(this.lastCompletion) : null;
  }

  public getOrderContent(id: string): OrderContent {
    const content = this.content.orders.get(id);
    if (!content) throw new Error(`Unknown order content: ${id}`);
    return content;
  }

  public getCustomerDefinition(id: string): CustomerDefinition {
    const customer = this.content.customers.get(id);
    if (!customer) throw new Error(`Unknown customer content: ${id}`);
    return customer;
  }

  public progressionContext(): ProgressionContext {
    return createProgressionContext([
      ...this.unlocks.ingredientIds,
      ...this.unlocks.recipeIds,
      ...this.unlocks.transformationIds,
      ...this.unlocks.upgradeIds,
      ...this.unlocks.decorationIds,
    ]);
  }

  public resolveActiveReaction(): { readonly snapshot: OrderSnapshot; readonly newlyDiscovered: boolean } {
    const shift = this.requireActiveShift();
    shift.orderSession.resolveReaction();
    const snapshot = shift.orderSession.snapshot();
    const transformationId = snapshot.transformationResult?.id;
    const newlyDiscovered = transformationId ? this.discoverTransformation(transformationId) : false;
    return { snapshot, newlyDiscovered };
  }

  public completeActiveOrder(): void {
    const shift = this.requireActiveShift();
    const before = shift.snapshot();
    const order = before.order;
    const activeIndex = before.shift.activeOrderIndex;
    const slot = activeIndex === null ? null : shift.definition.orderSequence[activeIndex] ?? null;
    if (!order || !slot || order.phase !== 'next-order-ready' || !order.payment) {
      throw new Error('The active order is not ready to settle.');
    }
    this.activeOrderResults.push({
      slotId: slot.id,
      customerId: slot.customerId,
      orderId: slot.orderId,
      snapshot: structuredClone(order),
    });
    shift.completeActiveOrder();
    this.activeShiftSnapshot = shift.shiftSnapshot;
    if (this.activeShiftSnapshot.phase === 'completed') {
      this.completedShiftIds.add(this.activeShiftSnapshot.shiftId);
      this.lastCompletion = {
        shiftId: this.activeShiftSnapshot.shiftId,
        runId: before.runId,
        earnings: this.activeShiftSnapshot.earnings,
        orderResults: [...this.activeOrderResults],
      };
      this.activeShiftController = null;
      this.activeShiftId = null;
      this.activeRunId = null;
      this.activeShiftSnapshot = null;
      this.activeOrderResults = [];
      this.phase = 'shift-complete';
    }
    this.notify();
  }

  public replayCompletedShift(): void {
    if (this.phase !== 'shift-complete' || !this.lastCompletion) {
      throw new Error('Only a completed shift can be replayed.');
    }
    const chapter = this.requireChapter(this.chapterId);
    const definition = this.requireShiftInChapter(chapter, this.lastCompletion.shiftId);
    this.beginShiftRun(definition);
  }

  public startNextShift(): void {
    if (this.phase === 'shift-in-progress') throw new Error('A shift is already in progress.');
    const chapter = this.requireChapter(this.chapterId);
    const nextShiftId = chapter.shiftIds.find((id) => !this.completedShiftIds.has(id));
    if (!nextShiftId) throw new Error(`Chapter ${chapter.id} has no unfinished shift.`);
    this.beginShiftRun(this.requireShiftInChapter(chapter, nextShiftId));
  }

  public pauseActiveOrder(): void {
    this.activeShiftController?.orderSession.pausePatience();
  }

  public resumeActiveOrder(): void {
    this.activeShiftController?.orderSession.resumePatience();
  }

  public advanceActiveOrder(deltaMs: number): void {
    this.activeShiftController?.orderSession.advancePatience(deltaMs);
  }

  public recordUnlock(category: keyof UnlockSaveData, id: string): boolean {
    if (!id) throw new Error('Unlock ID must not be empty.');
    const collection = this.unlocks[category] as Set<string>;
    if (collection.has(id)) return false;
    collection.add(id);
    this.notify();
    return true;
  }

  public snapshot(): CampaignSnapshot {
    return {
      phase: this.phase,
      chapterId: this.chapterId,
      completedShiftIds: [...this.completedShiftIds],
      activeShiftId: this.activeShiftId,
      activeRunId: this.activeRunId,
      runSequence: this.runSequence,
      activeShift: this.activeShiftController?.snapshot() ?? null,
      activeOrderResults: structuredClone(this.activeOrderResults),
      lastCompletion: this.lastCompletion ? structuredClone(this.lastCompletion) : null,
      economy: this.economy.snapshot(),
      unlocks: {
        ingredientIds: [...this.unlocks.ingredientIds],
        recipeIds: [...this.unlocks.recipeIds],
        transformationIds: [...this.unlocks.transformationIds],
        upgradeIds: [...this.unlocks.upgradeIds],
        decorationIds: [...this.unlocks.decorationIds],
      },
      discoveredTransformationIds: [...this.discoveredTransformationIds],
    };
  }

  public subscribe(listener: (snapshot: CampaignSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private discoverTransformation(id: string): boolean {
    if (this.discoveredTransformationIds.has(id)) return false;
    this.discoveredTransformationIds.add(id);
    this.notify();
    return true;
  }

  private beginShiftRun(definition: ShiftDefinition): void {
    this.runSequence += 1;
    const runId = `run-${String(this.runSequence).padStart(6, '0')}`;
    this.activeOrderResults = [];
    this.activeShiftSnapshot = null;
    this.activate(definition, runId);
    this.activeShiftController!.start();
    this.phase = 'shift-in-progress';
    this.notify();
  }

  private activate(definition: ShiftDefinition, runId: string, restored?: ShiftSnapshot): void {
    const controller = this.content.createShiftController({
      definition,
      runId,
      economy: this.economy,
      progression: this.progressionContext(),
      ...(restored ? { restoredShift: restored } : {}),
    });
    this.activeShiftController = controller;
    this.activeShiftId = definition.id;
    this.activeRunId = runId;
  }

  private requireChapter(id: string): ChapterDefinition {
    const chapter = this.content.chapters.get(id);
    if (!chapter) throw new Error(`Unknown campaign chapter: ${id}`);
    return chapter;
  }

  private requireShiftInChapter(chapter: ChapterDefinition, shiftId: string): ShiftDefinition {
    if (!chapter.shiftIds.includes(shiftId)) throw new Error(`Shift ${shiftId} is not in chapter ${chapter.id}.`);
    const shift = this.content.shifts.get(shiftId);
    if (!shift) throw new Error(`Unknown campaign shift: ${shiftId}`);
    return shift;
  }

  private requireActiveShift(): ShiftController {
    if (!this.activeShiftController || this.phase !== 'shift-in-progress') {
      throw new Error('There is no active shift.');
    }
    return this.activeShiftController;
  }

  private notify(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}
