import type { OrderSnapshot } from '../game/orders/OrderSession';
import type { ShiftSnapshot } from '../game/shifts/ShiftSession';

export const CURRENT_SAVE_SCHEMA_VERSION = 2;

export interface SaveDataV1 {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly savedAt: string;
  readonly buildVersion: string;
  readonly campaign: {
    readonly chapterId: string;
    readonly completedShiftIds: readonly string[];
  };
  readonly economy: { readonly coins: number };
  readonly unlocks: UnlockSaveData;
  readonly settings: SettingsSaveData;
}

export interface SavedOrderResult {
  readonly slotId: string;
  readonly customerId: string;
  readonly orderId: string;
  readonly snapshot: OrderSnapshot;
}

export interface ShiftCompletionRecord {
  readonly shiftId: string;
  readonly runId: string;
  readonly earnings: number;
  readonly orderResults: readonly SavedOrderResult[];
}

export interface SaveDataV2 {
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly savedAt: string;
  readonly buildVersion: string;
  readonly campaign: {
    readonly chapterId: string;
    readonly completedShiftIds: readonly string[];
    readonly activeShiftId: string | null;
    readonly activeRunId: string | null;
    readonly runSequence: number;
    readonly activeShiftSnapshot: ShiftSnapshot | null;
    readonly activeOrderResults: readonly SavedOrderResult[];
    readonly lastCompletion: ShiftCompletionRecord | null;
    readonly discoveredTransformationIds: readonly string[];
  };
  readonly economy: {
    readonly coins: number;
    readonly appliedPaymentIds: readonly string[];
  };
  readonly unlocks: UnlockSaveData;
  readonly settings: SettingsSaveData;
}

export interface UnlockSaveData {
  readonly ingredientIds: readonly string[];
  readonly recipeIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly upgradeIds: readonly string[];
  readonly decorationIds: readonly string[];
}

export interface SettingsSaveData {
  readonly locale: string | null;
  readonly masterVolume: number;
  readonly reducedMotion: boolean;
  readonly reducedFlashing: boolean;
}

export type CurrentSaveData = SaveDataV2;

export function createDefaultSaveData(chapterId: string, buildVersion = '0.1.0'): SaveDataV2 {
  return {
    schemaVersion: 2,
    revision: 0,
    savedAt: '1970-01-01T00:00:00.000Z',
    buildVersion,
    campaign: {
      chapterId,
      completedShiftIds: [],
      activeShiftId: null,
      activeRunId: null,
      runSequence: 0,
      activeShiftSnapshot: null,
      activeOrderResults: [],
      lastCompletion: null,
      discoveredTransformationIds: [],
    },
    economy: { coins: 0, appliedPaymentIds: [] },
    unlocks: {
      ingredientIds: [],
      recipeIds: [],
      transformationIds: [],
      upgradeIds: [],
      decorationIds: [],
    },
    settings: { locale: null, masterVolume: 1, reducedMotion: false, reducedFlashing: false },
  };
}
