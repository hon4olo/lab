import { SNACK_LAB_CONTENT_REGISTRIES } from '../content/registries';
import { DEFAULT_BALANCE_CONFIG } from '../game/balance/BalanceConfig';
import { CampaignSession } from '../game/campaign/CampaignSession';
import type { CampaignContent, CampaignRestoreState } from '../game/campaign/CampaignContracts';
import { ShiftController } from '../game/shifts/ShiftController';
import type { CustomerDefinition } from '../game/customers/CustomerDefinition';
import type { IngredientDefinition } from '../game/ingredients/IngredientDefinition';
import type { OrderContent } from '../game/orders/OrderContent';
import { resolveOrderAvailableIngredientIds } from '../game/orders/OrderRequirements';
import type { CurrentSaveData, SavedOrderResult, ShiftCompletionRecord } from '../save/SaveSchema';
import { FIRST_CHAPTER } from '../content/chapters/firstChapter';

export function createCampaignSession(save: CurrentSaveData): CampaignSession {
  const ingredientById = SNACK_LAB_CONTENT_REGISTRIES.ingredients.toMap();
  const recipeById = SNACK_LAB_CONTENT_REGISTRIES.recipes.toMap();
  const orders = new Map(SNACK_LAB_CONTENT_REGISTRIES.orders.all.map((definition) => {
    const availableIngredientIds = resolveOrderAvailableIngredientIds(definition);
    const ingredients = availableIngredientIds
      .map((id) => ingredientById.get(id))
      .filter((ingredient): ingredient is IngredientDefinition => ingredient !== undefined);
    if (ingredients.length !== availableIngredientIds.length) {
      throw new Error(`Order ${definition.id} references an ingredient missing from the registry.`);
    }
    const recipe = recipeById.get(definition.recipeId);
    if (!recipe) throw new Error(`Order ${definition.id} references missing recipe ${definition.recipeId}.`);
    return [definition.id, {
      definition,
      availableIngredientIds,
      ingredients,
      ...(recipe.assembly ? { assembly: recipe.assembly } : {}),
    }] as const;
  }));
  const chapters = SNACK_LAB_CONTENT_REGISTRIES.chapters.toMap();
  const shifts = SNACK_LAB_CONTENT_REGISTRIES.shifts.toMap();
  const customers = SNACK_LAB_CONTENT_REGISTRIES.customers.toMap();
  const campaignContent: CampaignContent = {
    chapters,
    shifts,
    orders,
    customers,
    createShiftController: ({ definition, runId, economy, progression, restoredShift }) => new ShiftController({
      definition,
      orders,
      customers,
      transformations: SNACK_LAB_CONTENT_REGISTRIES.transformations.all,
      economy,
      progression,
      balance: DEFAULT_BALANCE_CONFIG,
      runId,
      ...(restoredShift ? { restoredShift } : {}),
    }),
  };

  return new CampaignSession(campaignContent, reconcileSave(save, chapters, shifts, orders, customers));
}

function reconcileSave(
  save: CurrentSaveData,
  chapters: ReadonlyMap<string, { readonly id: string; readonly shiftIds: readonly string[] }>,
  shifts: ReadonlyMap<string, { readonly id: string; readonly orderSequence: readonly ShiftSlot[] }>,
  orders: ReadonlyMap<string, OrderContent>,
  customers: ReadonlyMap<string, CustomerDefinition>,
): CampaignRestoreState {
  const chapterId = chapters.has(save.campaign.chapterId) ? save.campaign.chapterId : FIRST_CHAPTER.id;
  const chapter = chapters.get(chapterId) ?? FIRST_CHAPTER;
  const completedShiftIds = save.campaign.completedShiftIds.filter(
    (id) => chapter.shiftIds.includes(id) && shifts.has(id),
  );
  let lastCompletion = isValidCompletion(save.campaign.lastCompletion, shifts, orders, customers);
  if (!lastCompletion || !chapter.shiftIds.includes(lastCompletion.shiftId)) lastCompletion = null;
  if (lastCompletion && !completedShiftIds.includes(lastCompletion.shiftId)) {
    completedShiftIds.push(lastCompletion.shiftId);
  }
  const activeShift = save.campaign.activeShiftId && shifts.get(save.campaign.activeShiftId);
  const activeSnapshot = save.campaign.activeShiftSnapshot;
  const activeResults = save.campaign.activeOrderResults;
  const canRestoreActive = Boolean(
    activeShift && chapter.shiftIds.includes(activeShift.id) &&
    typeof save.campaign.activeRunId === 'string' && save.campaign.activeRunId.length > 0 &&
    activeSnapshot?.shiftId === activeShift.id && activeSnapshot.phase !== 'completed' &&
    activeSnapshot.activeOrderIndex !== null &&
    activeSnapshot.activeOrderIndex < activeShift.orderSequence.length &&
    activeSnapshot.completedOrders.every((slotId, index) => activeShift.orderSequence[index]?.id === slotId) &&
    isValidActiveResults(
      activeResults,
      activeSnapshot.completedOrders,
      activeShift.orderSequence,
      orders,
      customers,
      activeShift.id,
      save.campaign.activeRunId!,
    ) &&
    activeSnapshot.earnings === activeResults.reduce((sum, result) => sum + result.snapshot.payment!.total, 0),
  );

  if (!canRestoreActive && !lastCompletion && chapter.shiftIds.every((id) => completedShiftIds.includes(id))) {
    // V1 saves have no completion snapshot. Keep the wallet, but make the shift safely replayable.
    completedShiftIds.splice(0, completedShiftIds.length);
  }

  return {
    chapterId,
    completedShiftIds,
    activeShiftId: canRestoreActive ? save.campaign.activeShiftId : null,
    activeRunId: canRestoreActive ? save.campaign.activeRunId : null,
    runSequence: Math.max(save.campaign.runSequence, highestSavedRunSequence(save)),
    activeShiftSnapshot: canRestoreActive ? activeSnapshot : null,
    activeOrderResults: canRestoreActive ? activeResults : [],
    lastCompletion,
    discoveredTransformationIds: save.campaign.discoveredTransformationIds.filter(
      (id) => SNACK_LAB_CONTENT_REGISTRIES.transformations.has(id),
    ),
    economy: save.economy,
    unlocks: save.unlocks,
  };
}

function highestSavedRunSequence(save: CurrentSaveData): number {
  const identities = [
    save.campaign.activeRunId,
    save.campaign.lastCompletion?.runId ?? null,
    ...save.economy.appliedPaymentIds,
  ];
  return identities.reduce((highest, identity) => {
    if (!identity) return highest;
    const match = /(?:^|:)run-(\d+)(?:$|:)/.exec(identity);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
}

function isValidCompletion(
  record: ShiftCompletionRecord | null,
  shifts: ReadonlyMap<string, { readonly id: string; readonly orderSequence: readonly ShiftSlot[] }>,
  orders: ReadonlyMap<string, OrderContent>,
  customers: ReadonlyMap<string, CustomerDefinition>,
): ShiftCompletionRecord | null {
  if (!record) return null;
  const shift = shifts.get(record.shiftId);
  if (!shift || !record.runId || !isValidActiveResults(
    record.orderResults,
    shift.orderSequence.map((slot) => slot.id),
    shift.orderSequence,
    orders,
    customers,
    shift.id,
    record.runId,
  )) {
    return null;
  }
  const earnings = record.orderResults.reduce((total, item) => total + (item.snapshot.payment?.total ?? 0), 0);
  return record.orderResults.length === shift.orderSequence.length && earnings === record.earnings ? record : null;
}

interface ShiftSlot {
  readonly id: string;
  readonly orderId: string;
  readonly customerId: string;
}

function isValidActiveResults(
  results: readonly SavedOrderResult[],
  completedSlotIds: readonly string[],
  slots: readonly ShiftSlot[],
  orders: ReadonlyMap<string, OrderContent>,
  customers: ReadonlyMap<string, CustomerDefinition>,
  shiftId: string,
  runId: string,
): boolean {
  if (results.length !== completedSlotIds.length) return false;
  return results.every((result, index) => {
    const slot = slots[index];
    const snapshot = result.snapshot;
    const payment = snapshot.payment;
    return Boolean(
      slot && payment && result.slotId === completedSlotIds[index] && result.slotId === slot.id &&
      result.orderId === slot.orderId && result.customerId === slot.customerId &&
      payment.transactionId === `${shiftId}:${runId}:${slot.id}` &&
      orders.has(slot.orderId) && customers.has(slot.customerId) &&
      snapshot.orderId === slot.orderId && snapshot.phase === 'next-order-ready' &&
      payment.orderId === slot.orderId && payment.transactionId.length > 0 &&
      snapshot.scores !== null,
    );
  });
}
