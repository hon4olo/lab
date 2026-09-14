import { describe, expect, it } from 'vitest';
import { createDefaultSaveData } from '../../src/save/SaveSchema';
import { SaveRepository, type SaveDraft, type SaveStoragePort } from '../../src/save/SaveRepository';

const FALLBACK = createDefaultSaveData('street-snack-bar');

describe('SaveRepository', () => {
  it('loads a default save when all storage copies are absent or corrupt', async () => {
    const storage = new MemoryStorage();
    const repository = new SaveRepository(storage);
    expect(await repository.load(FALLBACK)).toMatchObject({ save: FALLBACK, source: 'default', recovered: false });

    storage.values.set('snack-lab.save.primary', '{broken');
    storage.values.set('snack-lab.save.backup', JSON.stringify({ schemaVersion: 3 }));
    expect(await repository.load(FALLBACK)).toMatchObject({ save: FALLBACK, source: 'default', recovered: false });
  });

  it('round-trips wallet state and recovers the last verified backup', async () => {
    const storage = new MemoryStorage();
    const repository = new SaveRepository(storage);
    await repository.load(FALLBACK);
    await repository.save(draft(55, ['shift:run-1:order-1']));
    await repository.save(draft(110, ['shift:run-1:order-1', 'shift:run-2:order-1']));

    storage.values.set('snack-lab.save.primary', '{corrupt current copy');
    const recovered = await new SaveRepository(storage).load(FALLBACK);
    expect(recovered).toMatchObject({ source: 'backup', recovered: true });
    expect(recovered.save.revision).toBe(1);
    expect(recovered.save.economy).toEqual({ coins: 55, appliedPaymentIds: ['shift:run-1:order-1'] });
  });

  it('prefers a complete verified staging write after an interrupted primary update', async () => {
    const storage = new MemoryStorage();
    const save = { ...FALLBACK, revision: 3, economy: { coins: 75, appliedPaymentIds: ['payment-3'] } };
    storage.values.set('snack-lab.save.staging', JSON.stringify(save));

    const loaded = await new SaveRepository(storage).load(FALLBACK);
    expect(loaded).toMatchObject({ source: 'staging', recovered: true });
    expect(loaded.save.economy.coins).toBe(75);
  });
});

function draft(coins: number, appliedPaymentIds: readonly string[]): SaveDraft {
  const { schemaVersion: _schemaVersion, revision: _revision, savedAt: _savedAt, ...base } = FALLBACK;
  return {
    ...base,
    economy: { coins, appliedPaymentIds },
  };
}

class MemoryStorage implements SaveStoragePort {
  public readonly values = new Map<string, string>();

  public async storageGet(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async storageSet(key: string, value: string): Promise<void> {
    if (value) this.values.set(key, value);
    else this.values.delete(key);
  }
}
