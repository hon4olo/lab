import type { CampaignSession, CampaignSnapshot } from '../game/campaign/CampaignSession';
import type { SettingsSaveData } from './SaveSchema';
import { SaveRepository, type SaveDraft } from './SaveRepository';

export class CampaignSaveCoordinator {
  private pending: Promise<void> = Promise.resolve();
  private unsubscribe: (() => void) | null = null;
  private lastError: unknown = null;

  public constructor(
    private readonly repository: SaveRepository,
    private readonly campaign: CampaignSession,
    private readonly settings: SettingsSaveData,
    private readonly buildVersion: string,
  ) {}

  public start(): void {
    if (this.unsubscribe) throw new Error('Campaign save coordinator is already listening.');
    this.unsubscribe = this.campaign.subscribe((snapshot) => this.schedule(snapshot));
    this.schedule(this.campaign.snapshot());
  }

  public async flush(): Promise<void> {
    await this.pending;
    if (this.lastError) {
      const error = this.lastError;
      this.lastError = null;
      throw error;
    }
  }

  public stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private schedule(snapshot: CampaignSnapshot): void {
    const draft = toSaveDraft(snapshot, this.settings, this.buildVersion);
    const operation = this.pending.then(async () => {
      await this.repository.save(draft);
      this.lastError = null;
    });
    this.pending = operation.catch((error: unknown) => {
      this.lastError = error;
    });
  }
}

function toSaveDraft(
  snapshot: CampaignSnapshot,
  settings: SettingsSaveData,
  buildVersion: string,
): SaveDraft {
  return {
    buildVersion,
    campaign: {
      chapterId: snapshot.chapterId,
      completedShiftIds: snapshot.completedShiftIds,
      activeShiftId: snapshot.activeShiftId,
      activeRunId: snapshot.activeRunId,
      runSequence: snapshot.runSequence,
      activeShiftSnapshot: snapshot.activeShift?.shift ?? null,
      activeOrderResults: snapshot.activeOrderResults,
      lastCompletion: snapshot.lastCompletion,
      discoveredTransformationIds: snapshot.discoveredTransformationIds,
    },
    economy: {
      coins: snapshot.economy.coins,
      appliedPaymentIds: snapshot.economy.appliedPaymentIds,
    },
    unlocks: snapshot.unlocks,
    settings,
  };
}
