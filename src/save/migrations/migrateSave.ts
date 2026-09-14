import {
  CURRENT_SAVE_SCHEMA_VERSION,
  type CurrentSaveData,
  type SavedOrderResult,
  type ShiftCompletionRecord,
  type UnlockSaveData,
} from '../SaveSchema';
import type { PaymentTransaction } from '../../game/economy/PaymentTransaction';

type UnknownRecord = Record<string, unknown>;
type Migration = (save: UnknownRecord) => UnknownRecord;

const migrations: Readonly<Record<number, Migration>> = { 1: migrateV1ToV2 };

export function migrateSave(input: unknown): CurrentSaveData {
  if (!isRecord(input)) throw new Error('Save data must be an object.');
  let save: UnknownRecord = structuredClone(input);
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

function migrateV1ToV2(save: UnknownRecord): UnknownRecord {
  const campaign = requireRecord(save.campaign, 'campaign');
  const economy = requireRecord(save.economy, 'economy');
  return {
    ...save,
    campaign: {
      ...campaign,
      activeShiftId: null,
      activeRunId: null,
      runSequence: 0,
      activeShiftSnapshot: null,
      activeOrderResults: [],
      lastCompletion: null,
      discoveredTransformationIds: [],
    },
    economy: { ...economy, appliedPaymentIds: [] },
  };
}

function readVersion(save: UnknownRecord): number {
  if (!Number.isInteger(save.schemaVersion) || Number(save.schemaVersion) < 1) {
    throw new Error('Save schemaVersion must be a positive integer');
  }
  return Number(save.schemaVersion);
}

function assertCurrentSave(save: UnknownRecord): asserts save is UnknownRecord & CurrentSaveData {
  if (save.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION) throw new Error('Save schema did not migrate.');
  requireSafeInteger(save.revision, 'revision');
  requireString(save.savedAt, 'savedAt');
  requireString(save.buildVersion, 'buildVersion');
  const campaign = requireRecord(save.campaign, 'campaign');
  const economy = requireRecord(save.economy, 'economy');
  const unlocks = requireRecord(save.unlocks, 'unlocks');
  const settings = requireRecord(save.settings, 'settings');

  requireString(campaign.chapterId, 'campaign.chapterId');
  requireUniqueStringArray(campaign.completedShiftIds, 'campaign.completedShiftIds');
  requireNullableString(campaign.activeShiftId, 'campaign.activeShiftId');
  requireNullableString(campaign.activeRunId, 'campaign.activeRunId');
  requireSafeInteger(campaign.runSequence, 'campaign.runSequence');
  if (campaign.activeShiftSnapshot !== null && !isShiftSnapshot(campaign.activeShiftSnapshot)) {
    throw new Error('Save campaign.activeShiftSnapshot is invalid.');
  }
  if (campaign.activeOrderResults === undefined || !isOrderResults(campaign.activeOrderResults)) {
    throw new Error('Save campaign.activeOrderResults is invalid.');
  }
  if (campaign.lastCompletion !== null && !isShiftCompletion(campaign.lastCompletion)) {
    throw new Error('Save campaign.lastCompletion is invalid.');
  }
  requireUniqueStringArray(campaign.discoveredTransformationIds, 'campaign.discoveredTransformationIds');

  requireSafeInteger(economy.coins, 'economy.coins');
  requireUniqueStringArray(economy.appliedPaymentIds, 'economy.appliedPaymentIds');
  assertUnlocks(unlocks);
  assertSettings(settings);
  assertCampaignConsistency(campaign);
  assertResultTransactions(campaign, economy);
}

function assertUnlocks(unlocks: UnknownRecord): asserts unlocks is UnknownRecord & UnlockSaveData {
  for (const key of ['ingredientIds', 'recipeIds', 'transformationIds', 'upgradeIds', 'decorationIds']) {
    requireUniqueStringArray(unlocks[key], `unlocks.${key}`);
  }
}

function assertSettings(settings: UnknownRecord): void {
  requireNullableString(settings.locale, 'settings.locale');
  if (typeof settings.masterVolume !== 'number' || !Number.isFinite(settings.masterVolume) ||
      settings.masterVolume < 0 || settings.masterVolume > 1) {
    throw new Error('Save settings.masterVolume must be between 0 and 1.');
  }
  if (typeof settings.reducedMotion !== 'boolean' || typeof settings.reducedFlashing !== 'boolean') {
    throw new Error('Save accessibility settings are invalid.');
  }
}

function assertCampaignConsistency(campaign: UnknownRecord): void {
  const activeId = campaign.activeShiftId;
  const runId = campaign.activeRunId;
  const snapshot = campaign.activeShiftSnapshot;
  const hasActiveState = activeId !== null || runId !== null || snapshot !== null;
  if (hasActiveState && (typeof activeId !== 'string' || typeof runId !== 'string' || !isRecord(snapshot))) {
    throw new Error('Save active shift identity is incomplete.');
  }
  const activeResults = campaign.activeOrderResults as readonly SavedOrderResult[];
  if (snapshot === null && activeResults.length > 0) {
    throw new Error('Save contains settled orders without an active shift.');
  }
  if (snapshot !== null) {
    const activeSnapshot = snapshot as {
      readonly shiftId: string;
      readonly completedOrders: readonly string[];
      readonly earnings: number;
    };
    if (activeSnapshot.shiftId !== activeId) throw new Error('Save active shift ID does not match its snapshot.');
    if (activeResults.length !== activeSnapshot.completedOrders.length ||
        activeResults.some((result, index) => result.slotId !== activeSnapshot.completedOrders[index])) {
      throw new Error('Save active shift results do not match its completed slots.');
    }
    const earnings = activeResults.reduce((total, result) => total + result.snapshot.payment!.total, 0);
    if (activeSnapshot.earnings !== earnings) throw new Error('Save active shift earnings do not match its payments.');
  }
}

function isShiftSnapshot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (typeof value.shiftId !== 'string' || !Number.isSafeInteger(value.earnings) || Number(value.earnings) < 0 ||
      !isUniqueStringArray(value.completedOrders)) return false;
  if (value.phase === 'ready') {
    return value.activeOrderIndex === 0 && value.completedOrders.length === 0 && value.earnings === 0;
  }
  if (value.phase === 'in-progress') {
    return Number.isSafeInteger(value.activeOrderIndex) && Number(value.activeOrderIndex) >= 0 &&
      value.activeOrderIndex === value.completedOrders.length;
  }
  return false;
}

function isOrderResults(value: unknown): value is readonly SavedOrderResult[] {
  if (!Array.isArray(value) || !value.every((item) =>
    isRecord(item) && typeof item.slotId === 'string' && typeof item.customerId === 'string' &&
    item.slotId.length > 0 && item.customerId.length > 0 &&
    typeof item.orderId === 'string' && item.orderId.length > 0 && isResultOrderSnapshot(item.snapshot, item.orderId))) {
    return false;
  }
  return new Set(value.map((item) => item.slotId)).size === value.length &&
    new Set(value.map((item) => item.snapshot.payment.transactionId)).size === value.length;
}

function isShiftCompletion(value: unknown): value is ShiftCompletionRecord {
  return isRecord(value) && typeof value.shiftId === 'string' && typeof value.runId === 'string' &&
    value.shiftId.length > 0 && value.runId.length > 0 && Number.isSafeInteger(value.earnings) &&
    Number(value.earnings) >= 0 && isOrderResults(value.orderResults) && value.orderResults.length > 0;
}

function isResultOrderSnapshot(value: unknown, orderId: unknown): boolean {
  if (!isRecord(value) || value.orderId !== orderId || value.phase !== 'next-order-ready') return false;
  if (!isRecord(value.scores) || !isPayment(value.payment)) return false;
  return Number.isFinite(value.scores.order) && Number.isFinite(value.scores.cook) &&
    Number.isFinite(value.scores.chaos) && value.payment.orderId === orderId;
}

function isPayment(value: unknown): value is PaymentTransaction {
  if (!isRecord(value) || typeof value.transactionId !== 'string' || !value.transactionId ||
      typeof value.orderId !== 'string' || !value.orderId) return false;
  const nonNegative = ['base', 'qualityBonus', 'chaosBonus', 'tip', 'total'];
  if (!nonNegative.every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0) ||
      !Number.isSafeInteger(value.transformationMultiplier)) return false;
  return value.total === Number(value.base) + Number(value.qualityBonus) + Number(value.chaosBonus) +
    Number(value.transformationMultiplier) + Number(value.tip);
}

function assertResultTransactions(campaign: UnknownRecord, economy: UnknownRecord): void {
  const appliedIds = new Set(economy.appliedPaymentIds as readonly string[]);
  const results = [
    ...(campaign.activeOrderResults as readonly SavedOrderResult[]),
    ...((campaign.lastCompletion as ShiftCompletionRecord | null)?.orderResults ?? []),
  ];
  if (results.some((result) => !appliedIds.has(result.snapshot.payment!.transactionId))) {
    throw new Error('Save result contains a payment missing from the economy ledger.');
  }
}

function requireUniqueStringArray(value: unknown, path: string): asserts value is readonly string[] {
  if (!isUniqueStringArray(value)) throw new Error(`Save ${path} must contain unique non-empty strings.`);
}

function isUniqueStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0) &&
    new Set(value).size === value.length;
}

function requireSafeInteger(value: unknown, path: string): asserts value is number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`Save ${path} must be a non-negative safe integer.`);
  }
}

function requireString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Save ${path} must be a non-empty string.`);
}

function requireNullableString(value: unknown, path: string): asserts value is string | null {
  if (value !== null && (typeof value !== 'string' || value.length === 0)) {
    throw new Error(`Save ${path} must be a non-empty string or null.`);
  }
}

function requireRecord(value: unknown, path: string): UnknownRecord {
  if (!isRecord(value)) throw new Error(`Save ${path} must be an object.`);
  return value;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
