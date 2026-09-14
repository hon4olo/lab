import { describe, expect, it } from 'vitest';
import type { SaveDataV1 } from '../../src/save/SaveSchema';
import { migrateSave } from '../../src/save/migrations/migrateSave';

const save: SaveDataV1 = {
  schemaVersion: 1,
  revision: 1,
  savedAt: '2026-09-13T00:00:00.000Z',
  buildVersion: '0.1.0',
  campaign: { chapterId: 'street-snack-bar', completedShiftIds: [] },
  economy: { coins: 0 },
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
  it('accepts a valid current save without returning the same mutable object', () => {
    const migrated = migrateSave(save as unknown as Record<string, unknown>);
    expect(migrated).toEqual(save);
    expect(migrated).not.toBe(save);
  });

  it('rejects saves from a newer schema', () => {
    expect(() => migrateSave({ ...save, schemaVersion: 2 })).toThrow(/newer than supported/);
  });
});
