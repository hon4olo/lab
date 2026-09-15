import { describe, expect, it } from 'vitest';
import { createCampaignSession } from '../../src/app/createCampaignSession';
import { FIRST_CHAPTER } from '../../src/content/chapters/firstChapter';
import { CHEESY_STREET_HOT_DOG_ORDER, HOTDOG_GRILL_TIMING } from '../../src/content/orders/cheesyStreetHotDog';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { CampaignSaveCoordinator } from '../../src/save/CampaignSaveCoordinator';
import { createDefaultSaveData, type SaveDataV1 } from '../../src/save/SaveSchema';
import { migrateSave } from '../../src/save/migrations/migrateSave';
import { SaveRepository, type SaveStoragePort } from '../../src/save/SaveRepository';

describe('campaign runtime persistence', () => {
  it('restarts an unsettled active order from its safe checkpoint with the same run identity', async () => {
    const storage = new MemoryStorage();
    const repository = new SaveRepository(storage);
    const fallback = createDefaultSaveData(FIRST_CHAPTER.id);
    const initial = await repository.load(fallback);
    const campaign = createCampaignSession(initial.save);
    campaign.startOrRestore();
    const coordinator = new CampaignSaveCoordinator(repository, campaign, initial.save.settings, '0.1.0');
    coordinator.start();
    await coordinator.flush();

    const runId = campaign.snapshot().activeRunId;
    campaign.activeShift!.orderSession.customerEntered();
    campaign.activeShift!.orderSession.toggleIngredient('ingredient.bun-bottom');
    await coordinator.flush();

    const restored = createCampaignSession((await repository.load(fallback)).save);
    restored.startOrRestore();
    expect(restored.snapshot().activeRunId).toBe(runId);
    expect(restored.activeShift!.orderSession.snapshot()).toMatchObject({
      phase: 'customer-entering',
      selectedIngredients: [],
    });
    expect(restored.snapshot().economy.coins).toBe(0);
    coordinator.stop();
  });

  it('settles two authored orders, persists discoveries, and replays without duplicating settlement', async () => {
    const storage = new MemoryStorage();
    const repository = new SaveRepository(storage);
    const fallback = createDefaultSaveData(FIRST_CHAPTER.id);
    const initial = await repository.load(fallback);
    const firstRun = createCampaignSession(initial.save);
    firstRun.startOrRestore();
    const firstSave = new CampaignSaveCoordinator(repository, firstRun, initial.save.settings, '0.1.0');
    firstSave.start();
    await firstSave.flush();

    const burger = completeBurgerOrder(firstRun);
    expect(burger.payment?.total).toBe(55);
    expect(firstRun.snapshot().economy.coins).toBe(55);
    expect(firstRun.snapshot().activeShift?.shift).toMatchObject({
      phase: 'in-progress',
      activeOrderIndex: 1,
      completedOrders: ['shift.street-snack-bar.first.order-01'],
      earnings: 55,
    });
    expect(firstRun.activeShift?.orderContent.definition.id).toBe(CHEESY_STREET_HOT_DOG_ORDER.id);

    let firstNeonDiscovery = false;
    const neon = completeHotDogOrder(firstRun, true, (newlyDiscovered) => {
      firstNeonDiscovery = newlyDiscovered;
    });
    expect(neon.scores).toEqual({ order: 100, cook: 100, chaos: 100 });
    expect(neon.payment?.total).toBe(49);
    expect(firstNeonDiscovery).toBe(true);
    expect(firstRun.snapshot().economy.coins).toBe(104);
    expect(firstRun.snapshot().phase).toBe('shift-complete');
    expect(firstRun.lastShiftCompletion?.earnings).toBe(104);
    expect(firstRun.lastShiftCompletion?.orderResults).toHaveLength(2);
    expect(firstRun.snapshot().discoveredTransformationIds).toEqual([
      'transformation.business-cat.flaming',
      'transformation.picky-pigeon.neon',
    ]);
    await firstSave.flush();

    const completedSave = await repository.load(fallback);
    expect(completedSave.save.economy.coins).toBe(104);
    expect(completedSave.save.economy.appliedPaymentIds).toHaveLength(2);

    const preBatch02Save = structuredClone(completedSave.save);
    for (const result of preBatch02Save.campaign.lastCompletion?.orderResults ?? []) {
      if (result.snapshot.transformationResult) {
        const transformation = result.snapshot.transformationResult as unknown as Record<string, unknown>;
        delete transformation.appearanceMode;
        delete transformation.effectAssets;
      }
    }
    const compatible = createCampaignSession(migrateSave(preBatch02Save));
    compatible.startOrRestore();
    expect(compatible.phaseSnapshot).toBe('shift-complete');

    const restored = createCampaignSession(completedSave.save);
    restored.startOrRestore();
    expect(restored.phaseSnapshot).toBe('shift-complete');
    expect(restored.snapshot().economy.coins).toBe(104);
    expect(restored.snapshot().discoveredTransformationIds).toHaveLength(2);

    const replaySave = new CampaignSaveCoordinator(repository, restored, completedSave.save.settings, '0.1.0');
    replaySave.start();
    restored.replayCompletedShift();
    expect(restored.snapshot().activeRunId).not.toBe(completedSave.save.campaign.lastCompletion!.runId);
    expect(completeBurgerOrder(restored).payment?.total).toBe(55);
    let replayNeonDiscovery = true;
    const replayNeon = completeHotDogOrder(restored, true, (newlyDiscovered) => {
      replayNeonDiscovery = newlyDiscovered;
    });
    expect(replayNeon.transformationResult?.id).toBe('transformation.picky-pigeon.neon');
    expect(replayNeonDiscovery).toBe(false);
    expect(replayNeon.payment?.total).toBe(49);
    expect(restored.snapshot().economy.coins).toBe(208);
    expect(restored.snapshot().phase).toBe('shift-complete');
    await replaySave.flush();

    const replayed = await repository.load(fallback);
    expect(replayed.save.economy.coins).toBe(208);
    expect(replayed.save.economy.appliedPaymentIds).toHaveLength(4);
    expect(new Set(replayed.save.economy.appliedPaymentIds).size).toBe(4);
    expect(replayed.save.campaign.discoveredTransformationIds).toHaveLength(2);
    replaySave.stop();
    firstSave.stop();
  });

  it('recovers an old fully-completed save with no result by keeping wallet and replaying safely', () => {
    const legacy = {
      ...createDefaultSaveData(FIRST_CHAPTER.id),
      schemaVersion: 1,
      campaign: { chapterId: FIRST_CHAPTER.id, completedShiftIds: ['shift.street-snack-bar.first'] },
      economy: { coins: 55 },
    } as unknown as SaveDataV1;
    const recovered = createCampaignSession(migrateSave(legacy));
    recovered.startOrRestore();

    expect(recovered.snapshot().economy.coins).toBe(55);
    expect(recovered.activeShift?.definition.id).toBe('shift.street-snack-bar.first');
  });

  it('recovers a schema-valid in-progress snapshot that has no remaining authored order', () => {
    const fallback = createDefaultSaveData(FIRST_CHAPTER.id);
    const campaign = createCampaignSession(fallback);
    campaign.startOrRestore();
    completeBurgerOrder(campaign);
    completeHotDogOrder(campaign, true);
    const save = createSaveFromCampaign(campaign, fallback);
    const completion = save.campaign.lastCompletion!;
    const staleActiveSave = migrateSave({
      ...save,
      campaign: {
        ...save.campaign,
        activeShiftId: completion.shiftId,
        activeRunId: 'run-000003',
        runSequence: 3,
        activeShiftSnapshot: {
          shiftId: completion.shiftId,
          phase: 'in-progress',
          activeOrderIndex: completion.orderResults.length,
          earnings: completion.earnings,
          completedOrders: completion.orderResults.map((result) => result.slotId),
        },
        activeOrderResults: completion.orderResults,
        lastCompletion: null,
        completedShiftIds: [],
      },
    });

    const restored = createCampaignSession(staleActiveSave);
    restored.startOrRestore();

    expect(restored.snapshot().economy.coins).toBe(104);
    expect(restored.snapshot().activeRunId).toBe('run-000004');
    expect(restored.activeShift!.snapshot().shift.activeOrderIndex).toBe(0);
    expect(restored.activeShift!.orderSession.snapshot().phase).toBe('customer-entering');
  });
});

function completeBurgerOrder(campaign: ReturnType<typeof createCampaignSession>) {
  const order = campaign.activeShift!.orderSession;
  expect(campaign.activeShift!.orderContent.definition.id).toBe(HOT_CHEESE_BURGER_EXTRA_SPICY.id);
  order.customerEntered();
  for (const id of HOT_CHEESE_BURGER_EXTRA_SPICY.requiredIngredientIds.filter((item) => item !== 'ingredient.extra-spicy')) {
    order.toggleIngredient(id);
  }
  order.openPrepBoard();
  order.prepareIngredient('ingredient.patty');
  order.continueToGrill();
  order.startGrill();
  order.advanceGrill(HOT_CHEESE_BURGER_EXTRA_SPICY.grillTiming!.idealStopAtMs);
  order.stopGrill();
  order.assemble();
  order.addModifier('ingredient.extra-spicy');
  order.serve();
  const reaction = campaign.resolveActiveReaction().snapshot;
  order.beginCustomerLeaving();
  order.customerLeft();
  campaign.completeActiveOrder();
  return reaction;
}

function completeHotDogOrder(
  campaign: ReturnType<typeof createCampaignSession>,
  withGlow: boolean,
  onDiscovery?: (newlyDiscovered: boolean) => void,
) {
  const order = campaign.activeShift!.orderSession;
  expect(campaign.activeShift!.orderContent.definition.id).toBe(CHEESY_STREET_HOT_DOG_ORDER.id);
  order.customerEntered();
  for (const id of CHEESY_STREET_HOT_DOG_ORDER.requiredIngredientIds) order.toggleIngredient(id);
  order.openPrepBoard();
  order.prepareIngredient('ingredient.sausage');
  order.continueToGrill();
  order.startGrill();
  order.advanceGrill(HOTDOG_GRILL_TIMING.idealStopAtMs);
  order.stopGrill();
  order.assemble();
  if (withGlow) order.addModifier('ingredient.glow-sauce');
  order.serve();
  const resolution = campaign.resolveActiveReaction();
  onDiscovery?.(resolution.newlyDiscovered);
  const reaction = resolution.snapshot;
  order.beginCustomerLeaving();
  order.customerLeft();
  campaign.completeActiveOrder();
  return reaction;
}

function createSaveFromCampaign(
  campaign: ReturnType<typeof createCampaignSession>,
  base: ReturnType<typeof createDefaultSaveData>,
) {
  const state = campaign.snapshot();
  return migrateSave({
    ...base,
    campaign: {
      ...base.campaign,
      chapterId: state.chapterId,
      completedShiftIds: [...state.completedShiftIds],
      activeShiftId: state.activeShiftId,
      activeRunId: state.activeRunId,
      runSequence: state.runSequence,
      activeShiftSnapshot: null,
      activeOrderResults: [],
      lastCompletion: campaign.lastShiftCompletion,
      discoveredTransformationIds: [...state.discoveredTransformationIds],
    },
    economy: state.economy,
    unlocks: state.unlocks,
  });
}

class MemoryStorage implements SaveStoragePort {
  private readonly values = new Map<string, string>();

  public async storageGet(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async storageSet(key: string, value: string): Promise<void> {
    if (value) this.values.set(key, value);
    else this.values.delete(key);
  }
}
