export const CURRENT_SAVE_SCHEMA_VERSION = 1;

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
  readonly unlocks: {
    readonly ingredientIds: readonly string[];
    readonly recipeIds: readonly string[];
    readonly transformationIds: readonly string[];
    readonly upgradeIds: readonly string[];
    readonly decorationIds: readonly string[];
  };
  readonly settings: {
    readonly locale: string | null;
    readonly masterVolume: number;
    readonly reducedMotion: boolean;
    readonly reducedFlashing: boolean;
  };
}

export type CurrentSaveData = SaveDataV1;
