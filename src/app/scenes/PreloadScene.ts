import Phaser from 'phaser';
import { getProductionAssets } from '../../assets/assetManifest';

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

      const productionAssets = getProductionAssets(await response.json());
      if (productionAssets.length === 0) {
        this.startOrderScene();
        return;
      }

      for (const asset of productionAssets) {
        this.load.image(asset.id, `${import.meta.env.BASE_URL}${asset.path}`);
      }

      this.load.once(Phaser.Loader.Events.COMPLETE, this.startOrderScene, this);
      this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
        console.error(`Failed to load production asset "${file.key}" from "${file.src}".`);
      });
      this.load.start();
    } catch (error) {
      console.error('Could not load the production asset manifest.', error);
      this.startOrderScene();
    }
  }

  private startOrderScene(): void {
    this.scene.start('OrderScene');
  }
}
