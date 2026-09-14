import { CURRENT_SAVE_SCHEMA_VERSION, type CurrentSaveData } from '../SaveSchema';

type UnknownSave = Record<string, unknown> & { schemaVersion?: unknown };
type Migration = (save: UnknownSave) => UnknownSave;

const migrations: Readonly<Record<number, Migration>> = {};

export function migrateSave(input: UnknownSave): CurrentSaveData {
  let save = structuredClone(input);
  let version = readVersion(save);

  if (version > CURRENT_SAVE_SCHEMA_VERSION) {
    throw new Error(`Save schema ${version} is newer than supported schema ${CURRENT_SAVE_SCHEMA_VERSION}`);
  }

  while (version < CURRENT_SAVE_SCHEMA_VERSION) {
    const migration = migrations[version];
    if (!migration) throw new Error(`Missing save migration ${version} -> ${version + 1}`);
    save = migration(save);
    version += 1;
    save.schemaVersion = version;
  }

  assertCurrentSave(save);
  return save;
}

function readVersion(save: UnknownSave): number {
  if (!Number.isInteger(save.schemaVersion) || Number(save.schemaVersion) < 1) {
    throw new Error('Save schemaVersion must be a positive integer');
  }
  return Number(save.schemaVersion);
}

function assertCurrentSave(save: UnknownSave): asserts save is UnknownSave & CurrentSaveData {
  if (save.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION) {
    throw new Error('Save did not migrate to the current schema');
  }
  if (typeof save.revision !== 'number' || typeof save.savedAt !== 'string') {
    throw new Error('Save metadata is invalid');
  }
  if (!isRecord(save.economy) || typeof save.economy.coins !== 'number') {
    throw new Error('Save economy is invalid');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
