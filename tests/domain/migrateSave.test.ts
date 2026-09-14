import { describe, expect, it } from 'vitest';
import { createDefaultSaveData, type SaveDataV1 } from '../../src/save/SaveSchema';
import { migrateSave } from '../../src/save/migrations/migrateSave';

const legacySave: SaveDataV1 = {
  schemaVersion: 1,
  revision: 4,
  savedAt: '2026-09-13T00:00:00.000Z',
  buildVersion: '0.1.0',
  campaign: { chapterId: 'street-snack-bar', completedShiftIds: [] },
  economy: { coins: 12 },
  unlocks: {
    ingredientIds: [],
    recipeIds: [],
    transformationIds: [],
    upgradeIds: [],
    decorationIds: [],
  },
  settings: {
    locale: null,
    masterVolume: 1,
    reducedMotion: false,
    reducedFlashing: false,
  },
};

describe('migrateSave', () => {
  it('migrates a valid V1 save and preserves durable economy/settings data', () => {
    const migrated = migrateSave(legacySave);
    expect(migrated).toMatchObject({
      schemaVersion: 2,
      revision: 4,
      campaign: {
        chapterId: 'street-snack-bar',
        completedShiftIds: [],
        activeShiftId: null,
        activeRunId: null,
        runSequence: 0,
        activeShiftSnapshot: null,
        activeOrderResults: [],
        lastCompletion: null,
        discoveredTransformationIds: [],
      },
      economy: { coins: 12, appliedPaymentIds: [] },
    });
    expect(migrated).not.toBe(legacySave);
  });

  it('accepts an independent clone of a valid current save', () => {
    const save = { ...createDefaultSaveData('street-snack-bar'), revision: 2 };
    const migrated = migrateSave(save);
    expect(migrated).toEqual(save);
    expect(migrated).not.toBe(save);
  });

  it('rejects saves from a newer schema before validating their fields', () => {
    expect(() => migrateSave({ schemaVersion: 3 })).toThrow(/newer than supported/);
  });

  it('rejects duplicate or malformed durable transaction IDs', () => {
    const save = createDefaultSaveData('street-snack-bar');
    expect(() => migrateSave({
      ...save,
      economy: { coins: 55, appliedPaymentIds: ['first', 'first'] },
    })).toThrow(/appliedPaymentIds/);
  });

  it('rejects inconsistent active shift snapshots before restore', () => {
    const save = createDefaultSaveData('street-snack-bar');
    expect(() => migrateSave({
      ...save,
      campaign: {
        ...save.campaign,
        activeShiftId: 'shift.street-snack-bar.first',
        activeRunId: 'run-000001',
        runSequence: 1,
        activeShiftSnapshot: {
          shiftId: 'shift.street-snack-bar.first',
          phase: 'in-progress',
          activeOrderIndex: -1,
          earnings: 0,
          completedOrders: [],
        },
      },
    })).toThrow(/activeShiftSnapshot/);
  });
});
