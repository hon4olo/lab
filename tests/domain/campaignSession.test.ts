import { describe, expect, it } from 'vitest';
import { createCampaignSession } from '../../src/app/createCampaignSession';
import { FIRST_CHAPTER } from '../../src/content/chapters/firstChapter';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../../src/content/orders/hotCheeseBurgerExtraSpicy';
import { GRILL_TIMING } from '../../src/game/cooking/GrillSession';
import { EconomySession } from '../../src/game/economy/EconomySession';
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

  it('restores completion, records first discovery once, and replays without duplicating settlement', async () => {
    const storage = new MemoryStorage();
    const repository = new SaveRepository(storage);
    const fallback = createDefaultSaveData(FIRST_CHAPTER.id);
    const initial = await repository.load(fallback);
    const firstRun = createCampaignSession(initial.save);
    firstRun.startOrRestore();
    const firstSave = new CampaignSaveCoordinator(repository, firstRun, initial.save.settings, '0.1.0');
    firstSave.start();
    await firstSave.flush();

    expect(completePerfectOrder(firstRun)).toBe(true);
    expect(firstRun.snapshot().economy.coins).toBe(55);
    expect(firstRun.lastShiftCompletion?.earnings).toBe(55);
    await firstSave.flush();

    const completedSave = await repository.load(fallback);
    expect(completedSave.save.economy.coins).toBe(55);
    expect(completedSave.save.economy.appliedPaymentIds).toHaveLength(1);
    expect(completedSave.save.campaign.discoveredTransformationIds)
      .toEqual(['transformation.business-cat.flaming']);

    const staleCompletion = {
      ...completedSave.save,
      campaign: {
        ...completedSave.save.campaign,
        lastCompletion: {
          ...completedSave.save.campaign.lastCompletion!,
          shiftId: 'shift.removed-from-content',
        },
      },
    };
    const staleRecovery = createCampaignSession(staleCompletion);
    staleRecovery.startOrRestore();
    expect(staleRecovery.snapshot().economy.coins).toBe(55);
    expect(staleRecovery.activeShift?.definition.id).toBe('shift.street-snack-bar.first');

    const mismatchedRun = createCampaignSession(migrateSave({
      ...completedSave.save,
      campaign: {
        ...completedSave.save.campaign,
        lastCompletion: {
          ...completedSave.save.campaign.lastCompletion!,
          runId: 'run-000002',
        },
      },
    }));
    mismatchedRun.startOrRestore();
    expect(mismatchedRun.phaseSnapshot).toBe('shift-in-progress');
    expect(mismatchedRun.snapshot().economy.coins).toBe(55);
    expect(mismatchedRun.activeShift!.orderSession.snapshot().phase).toBe('customer-entering');

    const lowSequenceSave = {
      ...completedSave.save,
      campaign: { ...completedSave.save.campaign, runSequence: 0 },
    };
    const repairedSequence = createCampaignSession(lowSequenceSave);
    repairedSequence.startOrRestore();
    repairedSequence.replayCompletedShift();
    expect(repairedSequence.snapshot().activeRunId).toBe('run-000002');

    const duplicateGuard = new EconomySession(
      completedSave.save.economy.coins,
      completedSave.save.economy.appliedPaymentIds,
    );
    const firstPayment = completedSave.save.campaign.lastCompletion!.orderResults[0]!.snapshot.payment!;
    expect(duplicateGuard.applyPayment(firstPayment)).toBe(false);
    expect(duplicateGuard.snapshot().coins).toBe(55);

    firstSave.stop();
    const restored = createCampaignSession(completedSave.save);
    restored.startOrRestore();
    expect(restored.phaseSnapshot).toBe('shift-complete');
    expect(restored.snapshot().economy.coins).toBe(55);

    const replaySave = new CampaignSaveCoordinator(repository, restored, completedSave.save.settings, '0.1.0');
    replaySave.start();
    restored.replayCompletedShift();
    expect(restored.snapshot().activeRunId).not.toBe(completedSave.save.campaign.lastCompletion!.runId);
    expect(completePerfectOrder(restored)).toBe(false);
    expect(restored.snapshot().economy.coins).toBe(110);
    await replaySave.flush();

    const replayed = await repository.load(fallback);
    expect(replayed.save.economy.coins).toBe(110);
    expect(replayed.save.economy.appliedPaymentIds).toHaveLength(2);
    expect(new Set(replayed.save.economy.appliedPaymentIds).size).toBe(2);
    expect(replayed.save.campaign.discoveredTransformationIds)
      .toEqual(['transformation.business-cat.flaming']);
    replaySave.stop();
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

  it('recovers a schema-valid in-progress snapshot that has no remaining authored order', async () => {
    const storage = new MemoryStorage();
    const repository = new SaveRepository(storage);
    const fallback = createDefaultSaveData(FIRST_CHAPTER.id);
    const initial = await repository.load(fallback);
    const campaign = createCampaignSession(initial.save);
    campaign.startOrRestore();
    expect(completePerfectOrder(campaign)).toBe(true);

    const completedSave = migrateSave({
      ...createDefaultSaveData(FIRST_CHAPTER.id),
      ...campaignSaveFor(campaign, initial.save),
    });
    const completion = completedSave.campaign.lastCompletion!;
    const staleActiveSave = migrateSave({
      ...completedSave,
      campaign: {
        ...completedSave.campaign,
        activeShiftId: completion.shiftId,
        activeRunId: 'run-000002',
        runSequence: 2,
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

    expect(restored.snapshot().economy.coins).toBe(55);
    expect(restored.snapshot().activeRunId).toBe('run-000003');
    expect(restored.activeShift!.snapshot().shift.activeOrderIndex).toBe(0);
    expect(restored.activeShift!.orderSession.snapshot().phase).toBe('customer-entering');
  });
});

function campaignSaveFor(
  campaign: ReturnType<typeof createCampaignSession>,
  base: ReturnType<typeof createDefaultSaveData>,
) {
  const state = campaign.snapshot();
  return {
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
  };
}

function completePerfectOrder(campaign: ReturnType<typeof createCampaignSession>): boolean {
  const shift = campaign.activeShift!;
  const order = shift.orderSession;
  order.customerEntered();
  for (const id of HOT_CHEESE_BURGER_EXTRA_SPICY.requiredIngredientIds.filter((item) => item !== 'ingredient.extra-spicy')) {
    order.toggleIngredient(id);
  }
  order.openPrepBoard();
  order.prepareIngredient('ingredient.patty');
  order.continueToGrill();
  order.startGrill();
  order.advanceGrill(GRILL_TIMING.idealStopAtMs);
  order.stopGrill();
  order.assemble();
  order.addModifier('ingredient.extra-spicy');
  order.serve();
  const reaction = campaign.resolveActiveReaction();
  expect(reaction.snapshot.scores).toEqual({ order: 100, cook: 100, chaos: 140 });
  expect(reaction.snapshot.payment?.total).toBe(55);
  order.beginCustomerLeaving();
  order.customerLeft();
  campaign.completeActiveOrder();
  return reaction.newlyDiscovered;
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
