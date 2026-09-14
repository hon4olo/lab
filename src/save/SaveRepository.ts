import { migrateSave } from './migrations/migrateSave';
import type { CurrentSaveData, SaveDataV2 } from './SaveSchema';

export interface SaveStoragePort {
  storageGet(key: string): Promise<string | null>;
  storageSet(key: string, value: string): Promise<void>;
}

export type SaveDraft = Omit<SaveDataV2, 'schemaVersion' | 'revision' | 'savedAt'>;
export type SaveSource = 'primary' | 'backup' | 'staging' | 'default';

export interface SaveLoadResult {
  readonly save: CurrentSaveData;
  readonly source: SaveSource;
  readonly recovered: boolean;
}

interface Candidate {
  readonly source: Exclude<SaveSource, 'default'>;
  readonly priority: number;
  readonly save: CurrentSaveData;
}

const DEFAULT_KEYS = {
  primary: 'snack-lab.save.primary',
  backup: 'snack-lab.save.backup',
  staging: 'snack-lab.save.staging',
} as const;

export class SaveRepository {
  private revision = 0;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(
    private readonly storage: SaveStoragePort,
    private readonly keys: typeof DEFAULT_KEYS = DEFAULT_KEYS,
  ) {}

  public async load(fallback: CurrentSaveData): Promise<SaveLoadResult> {
    const candidates: Candidate[] = [];
    const locations: readonly [Exclude<SaveSource, 'default'>, string, number][] = [
      ['primary', this.keys.primary, 0],
      ['backup', this.keys.backup, 1],
      ['staging', this.keys.staging, 2],
    ];

    for (const [source, key, priority] of locations) {
      try {
        const raw = await this.storage.storageGet(key);
        if (!raw) continue;
        const save = migrateSave(JSON.parse(raw));
        candidates.push({ source, priority, save });
      } catch {
        // A malformed or inaccessible copy must not prevent trying the other save locations.
      }
    }

    candidates.sort((left, right) => right.save.revision - left.save.revision || left.priority - right.priority);
    const selected = candidates[0];
    if (!selected) {
      this.revision = fallback.revision;
      return { save: structuredClone(fallback), source: 'default', recovered: false };
    }
    this.revision = selected.save.revision;
    return {
      save: structuredClone(selected.save),
      source: selected.source,
      recovered: selected.source !== 'primary',
    };
  }

  public save(draft: SaveDraft, now = new Date()): Promise<CurrentSaveData> {
    const operation = this.writeQueue.then(() => this.writeNext(draft, now));
    this.writeQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async writeNext(draft: SaveDraft, now: Date): Promise<CurrentSaveData> {
    const next: CurrentSaveData = {
      ...structuredClone(draft),
      schemaVersion: 2,
      revision: this.revision + 1,
      savedAt: now.toISOString(),
    };
    const raw = JSON.stringify(next);
    await this.storage.storageSet(this.keys.staging, raw);
    await this.assertStored(this.keys.staging, next.revision);

    const oldPrimary = await this.readValid(this.keys.primary);
    if (oldPrimary) await this.storage.storageSet(this.keys.backup, oldPrimary.raw);
    await this.storage.storageSet(this.keys.primary, raw);
    await this.assertStored(this.keys.primary, next.revision);
    await this.storage.storageSet(this.keys.staging, '');
    this.revision = next.revision;
    return structuredClone(next);
  }

  private async assertStored(key: string, expectedRevision: number): Promise<void> {
    const stored = await this.readValid(key);
    if (!stored || stored.save.revision !== expectedRevision) {
      throw new Error(`Save verification failed for ${key}.`);
    }
  }

  private async readValid(key: string): Promise<{ readonly raw: string; readonly save: CurrentSaveData } | null> {
    try {
      const raw = await this.storage.storageGet(key);
      if (!raw) return null;
      return { raw, save: migrateSave(JSON.parse(raw)) };
    } catch {
      return null;
    }
  }
}
