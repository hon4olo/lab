import Phaser from 'phaser';
import { getProductionAssets } from '../../assets/assetManifest';
import { resolveShiftAssetBundle } from '../../assets/AssetBundleResolver';
import { SNACK_LAB_CONTENT_REGISTRIES } from '../../content/registries';
import { validateSnackLabContent } from '../../content/validateSnackLabContent';
import type { CampaignSession } from '../../game/campaign/CampaignSession';
import { APP_EVENTS } from '../appEvents';

export class PreloadScene extends Phaser.Scene {
  public constructor(private readonly campaign: CampaignSession) {
    super('PreloadScene');
  }

  public create(): void {
    void this.loadProductionAssets();
  }

  private async loadProductionAssets(): Promise<void> {
    try {
      const manifestUrl = new URL(`${import.meta.env.BASE_URL}assets/manifest.json`, document.baseURI);
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`Asset manifest request failed with status ${response.status}.`);
      }

      const manifest: unknown = await response.json();
      const validation = validateSnackLabContent(SNACK_LAB_CONTENT_REGISTRIES, manifest);
      if (!validation.valid) throw new Error(`Snack Lab content validation failed: ${validation.issues.join(' ')}`);
      const productionAssets = getProductionAssets(manifest);
      const bundle = resolveShiftAssetBundle(productionAssets, {
        getOrderContent: (id) => this.campaign.getOrderContent(id),
        getCustomerDefinition: (id) => this.campaign.getCustomerDefinition(id),
        transformations: SNACK_LAB_CONTENT_REGISTRIES.transformations.all,
      }, this.campaign.getLoadingShiftDefinition());
      if (bundle.assets.length === 0) throw new Error(`Asset bundle ${bundle.id} has no production-approved assets.`);

      for (const asset of bundle.assets) {
        this.load.image(asset.id, `${import.meta.env.BASE_URL}${asset.path}`);
      }

      let failedAsset: string | null = null;
      this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
        failedAsset = `Failed to load production asset "${file.key}" from "${file.src}".`;
      });
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        if (failedAsset) this.fail(new Error(failedAsset));
        else this.startOrderScene();
      });
      this.load.start();
    } catch (error) {
      this.fail(error);
    }
  }

  private fail(error: unknown): void {
    this.game.events.emit(APP_EVENTS.gameFailed, error);
  }

  private startOrderScene(): void {
    this.scene.start('OrderScene');
  }
}
