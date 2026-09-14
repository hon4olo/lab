import type { SavedOrderResult, ShiftCompletionRecord, UnlockSaveData } from '../../save/SaveSchema';
import type { ChapterDefinition } from './ChapterDefinition';
import type { EconomySnapshot, EconomySession } from '../economy/EconomySession';
import type { CustomerDefinition } from '../customers/CustomerDefinition';
import type { OrderContent } from '../orders/OrderContent';
import type { OrderSnapshot } from '../orders/OrderSession';
import type { ProgressionContext } from '../progression/ProgressionContext';
import type { ShiftController, ShiftControllerSnapshot } from '../shifts/ShiftController';
import type { ShiftDefinition } from '../shifts/ShiftDefinition';
import type { ShiftSnapshot } from '../shifts/ShiftSession';

export type CampaignPhase = 'ready' | 'shift-in-progress' | 'shift-complete';

export interface CampaignContent {
  readonly chapters: ReadonlyMap<string, ChapterDefinition>;
  readonly shifts: ReadonlyMap<string, ShiftDefinition>;
  readonly orders: ReadonlyMap<string, OrderContent>;
  readonly customers: ReadonlyMap<string, CustomerDefinition>;
  createShiftController(options: {
    readonly definition: ShiftDefinition;
    readonly runId: string;
    readonly economy: EconomySession;
    readonly progression: ProgressionContext;
    readonly restoredShift?: ShiftSnapshot;
  }): ShiftController;
}

export interface CampaignSnapshot {
  readonly phase: CampaignPhase;
  readonly chapterId: string;
  readonly completedShiftIds: readonly string[];
  readonly activeShiftId: string | null;
  readonly activeRunId: string | null;
  readonly runSequence: number;
  readonly activeShift: ShiftControllerSnapshot | null;
  readonly activeOrderResults: readonly SavedOrderResult[];
  readonly lastCompletion: ShiftCompletionRecord | null;
  readonly economy: EconomySnapshot;
  readonly unlocks: UnlockSaveData;
  readonly discoveredTransformationIds: readonly string[];
}

export interface CampaignRestoreState {
  readonly chapterId: string;
  readonly completedShiftIds: readonly string[];
  readonly activeShiftId: string | null;
  readonly activeRunId: string | null;
  readonly runSequence: number;
  readonly activeShiftSnapshot: ShiftSnapshot | null;
  readonly activeOrderResults: readonly SavedOrderResult[];
  readonly lastCompletion: ShiftCompletionRecord | null;
  readonly discoveredTransformationIds: readonly string[];
  readonly economy: { readonly coins: number; readonly appliedPaymentIds: readonly string[] };
  readonly unlocks: UnlockSaveData;
}

export interface ReactionResolution {
  readonly snapshot: OrderSnapshot;
  readonly newlyDiscovered: boolean;
}
