import Phaser from 'phaser';
import { getProductionAssets } from '../../assets/assetManifest';
import { SNACK_LAB_CONTENT_REGISTRIES } from '../../content/registries';
import { validateSnackLabContent } from '../../content/validateSnackLabContent';
import { APP_EVENTS } from '../appEvents';

export class PreloadScene extends Phaser.Scene {
  public constructor() {
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
      if (productionAssets.length === 0) throw new Error('No production-approved assets are available.');

      for (const asset of productionAssets) {
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
