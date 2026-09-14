import Phaser from 'phaser';
import { getManifestAssets } from '../assets/assetManifest';

const CHARACTER_LAYER_ORDER = [
  'customer.business-cat.body',
  'customer.business-cat.head',
  'customer.business-cat.arms',
  'customer.business-cat.hands',
  'customer.business-cat.accessories',
  'customer.business-cat.eyes',
  'customer.business-cat.pupils',
  'customer.business-cat.mouth',
  'customer.business-cat.mutation.fire-accents',
  'customer.business-cat.mutation.glow-eyes',
  'customer.business-cat.mutation.singed-tie',
];

const CUSTOMER_PREFIX = 'customer.business-cat.';

export class AssetPreviewScene extends Phaser.Scene {
  private readonly failedAssets = new Set<string>();

  public constructor() {
    super('AssetPreviewScene');
  }

  public preload(): void {
    const manifestUrl = new URL(`${import.meta.env.BASE_URL}assets/manifest.json`, document.baseURI);
    this.load.json('snack-lab-asset-preview-manifest', manifestUrl.toString());
  }

  public create(): void {
    document.documentElement.dataset.snackLabAssetPreview = 'active';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      delete document.documentElement.dataset.snackLabAssetPreview;
    });

    const manifest = this.cache.json.get('snack-lab-asset-preview-manifest') as unknown;
    const assets = getManifestAssets(manifest);

    for (const asset of assets) {
      this.load.image(asset.id, `${import.meta.env.BASE_URL}${asset.path}`);
    }

    const recordLoadError = (file: Phaser.Loader.File): void => {
      this.failedAssets.add(file.key);
    };
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, recordLoadError);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, recordLoadError);
      this.renderPreview(assets);
    });

    if (assets.length > 0) this.load.start();
    else this.renderPreview(assets);

    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('ShellScene'));
  }

  private renderPreview(assets: ReturnType<typeof getManifestAssets>): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#241332');

    this.add.text(24, 16, 'Snack Lab · Asset QA', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fff1d0',
    });
    this.add.text(width - 24, 22, 'Development only · Escape to return', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#b8a8c8',
    }).setOrigin(1, 0);

    const characterAssets = assets.filter((asset) => asset.id.startsWith(CUSTOMER_PREFIX));
    const characterIds = new Set(characterAssets.map((asset) => asset.id));
    const others = assets.filter((asset) => !characterIds.has(asset.id));
    const panelWidth = Math.max(250, Math.floor(width * 0.29));
    const dividerX = panelWidth + 14;
    const previewSize = Math.max(160, Math.min(panelWidth - 48, height - 180, 430));
    const characterX = Math.floor(panelWidth / 2) + 12;
    const characterY = Math.floor(height * 0.49);

    this.add.rectangle(characterX, height * 0.52, panelWidth - 20, height - 112, 0x352144, 1)
      .setStrokeStyle(1, 0x5b456e);
    this.add.text(characterX, 70, `Business Cat · ${characterAssets.length} layers`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#5df2c6',
    }).setOrigin(0.5, 0);

    CHARACTER_LAYER_ORDER.forEach((id, index) => {
      if (this.failedAssets.has(id) || !this.textures.exists(id)) return;
      this.add.image(characterX, characterY, id)
        .setDisplaySize(previewSize, previewSize)
        .setDepth(index + 1);
    });

    const layerNames = characterAssets
      .map((asset) => asset.id.replace(CUSTOMER_PREFIX, ''))
      .join(' · ');
    this.add.text(characterX, characterY + previewSize / 2 + 12, layerNames, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#d6cce0',
      align: 'center',
      wordWrap: { width: panelWidth - 40 },
    }).setOrigin(0.5, 0);

    this.add.rectangle(dividerX, height / 2, 1, height - 80, 0x5b456e);
    this.add.text(dividerX + 18, 70, `Burger · stations · environment · UI · FX (${others.length})`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#5df2c6',
    });

    const columns = width < 900 ? 4 : 6;
    const gridX = dividerX + 12;
    const gridY = 104;
    const gridWidth = width - gridX - 18;
    const gridHeight = height - gridY - 24;
    const cellWidth = gridWidth / columns;
    const rows = Math.ceil(others.length / columns);
    const cellHeight = gridHeight / Math.max(rows, 1);
    const imageSize = Math.max(30, Math.min(86, cellWidth - 16, cellHeight - 38));

    others.forEach((asset, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const centerX = gridX + column * cellWidth + cellWidth / 2;
      const centerY = gridY + row * cellHeight + cellHeight / 2;
      this.add.rectangle(centerX, centerY, cellWidth - 8, cellHeight - 8, 0x352144, 1)
        .setStrokeStyle(1, 0x5b456e);

      if (!this.failedAssets.has(asset.id) && this.textures.exists(asset.id)) {
        this.add.image(centerX, centerY - 8, asset.id)
          .setDisplaySize(imageSize, imageSize);
      }

      this.add.text(centerX, centerY + imageSize / 2 - 1, shortLabel(asset.id), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        color: this.failedAssets.has(asset.id) ? '#ff5c70' : '#fff1d0',
        align: 'center',
        wordWrap: { width: cellWidth - 14 },
      }).setOrigin(0.5, 0);
    });

    if (this.failedAssets.size > 0) {
      this.add.text(width - 24, height - 24, `Failed to load: ${[...this.failedAssets].join(', ')}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#ff5c70',
      }).setOrigin(1, 1);
    }
  }
}

function shortLabel(id: string): string {
  return id
    .replace(/^food\.burger\./, 'burger · ')
    .replace(/^station\./, 'station · ')
    .replace(/^background\./, 'background · ')
    .replace(/^environment\./, 'environment · ')
    .replace(/^ui\./, 'ui · ')
    .replace(/^fx\./, 'fx · ');
}
