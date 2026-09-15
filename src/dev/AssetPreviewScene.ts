import Phaser from 'phaser';
import { getManifestAssets } from '../assets/assetManifest';

const NEUTRAL_BUSINESS_CAT_LAYERS = [
  'customer.business-cat.body',
  'customer.business-cat.head',
  'customer.business-cat.eyes',
  'customer.business-cat.pupils',
  'customer.business-cat.mouth',
  'customer.business-cat.arms',
  'customer.business-cat.hands',
  'customer.business-cat.accessories',
];
const NEUTRAL_PICKY_PIGEON_LAYERS = [
  'customer.picky-pigeon.body',
  'customer.picky-pigeon.head',
  'customer.picky-pigeon.eyes',
  'customer.picky-pigeon.pupils',
  'customer.picky-pigeon.mouth',
  'customer.picky-pigeon.arms',
  'customer.picky-pigeon.feet',
  'customer.picky-pigeon.accessories',
];
const PICKY_PIGEON_VARIANTS = [
  { label: 'NEUTRAL', layers: NEUTRAL_PICKY_PIGEON_LAYERS },
  {
    label: 'SKEPTICAL',
    layers: NEUTRAL_PICKY_PIGEON_LAYERS.map((id) => id === 'customer.picky-pigeon.head'
      ? 'customer.picky-pigeon.reaction.skeptical' : id),
  },
  {
    label: 'SHOCKED',
    layers: NEUTRAL_PICKY_PIGEON_LAYERS.map((id) => id === 'customer.picky-pigeon.head'
      ? 'customer.picky-pigeon.reaction.shocked' : id),
  },
  { label: 'NEON', layers: ['customer.picky-pigeon.mutation.neon'] },
] as const;

const DARK_PREVIEW = 0x241332;
const LIGHT_PREVIEW = 0xf6f1e6;

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
      delete document.documentElement.dataset.snackLabAssetQaStatus;
      delete document.documentElement.dataset.snackLabAssetQaFailed;
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

    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('OrderScene'));
  }

  private renderPreview(assets: ReturnType<typeof getManifestAssets>): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(DARK_PREVIEW);

    this.add.text(24, 14, 'Snack Lab · Asset QA', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fff1d0',
    });
    this.add.text(24, 43, 'Every image is shown on dark and light backgrounds · Escape to return', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#b8a8c8',
    });
    this.add.text(width - 24, 22, 'Development only', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#b8a8c8',
    }).setOrigin(1, 0);

    const neutralIds = new Set([...NEUTRAL_BUSINESS_CAT_LAYERS, ...NEUTRAL_PICKY_PIGEON_LAYERS]);
    const otherAssets = assets.filter((asset) => !neutralIds.has(asset.id));
    const panelWidth = Math.max(270, Math.floor(width * (width < 800 ? 0.44 : 0.34)));
    const dividerX = panelWidth + 14;
    const panelX = Math.floor(panelWidth / 2) + 8;
    const stackWidth = (panelWidth - 56) / 2;
    const stackSize = Math.max(48, Math.min(stackWidth - 12, (height - 300) / 2, 300));
    const stackCenters = [panelX - stackWidth / 2 - 5, panelX + stackWidth / 2 + 5];

    this.add.rectangle(panelX, height * 0.52, panelWidth - 20, height - 106, 0x352144, 1)
      .setStrokeStyle(1, 0x5b456e);
    this.renderCharacterStack(
      'Business Cat · neutral',
      NEUTRAL_BUSINESS_CAT_LAYERS,
      panelX,
      Math.max(150, stackSize + 48),
      stackSize,
      stackCenters,
    );
    this.renderCharacterStack(
      'Picky Pigeon · neutral',
      NEUTRAL_PICKY_PIGEON_LAYERS,
      panelX,
      Math.max(150, stackSize + 48) + stackSize + 76,
      stackSize,
      stackCenters,
    );
    this.renderPickyVariantStrip(panelX, height - 92, Math.min(88, stackWidth / 2 - 8));

    this.add.rectangle(dividerX, height / 2, 1, height - 80, 0x5b456e);
    this.add.text(dividerX + 14, 73, `All other assets · ${otherAssets.length} files`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#5df2c6',
    });

    const gridX = dividerX + 10;
    const gridY = 98;
    const gridWidth = width - gridX - 12;
    const gridHeight = height - gridY - 16;
    const columns = width < 760 ? 3 : width < 1100 ? 4 : 6;
    const rows = Math.ceil(otherAssets.length / columns);
    const cellWidth = gridWidth / columns;
    const cellHeight = gridHeight / Math.max(rows, 1);
    const previewMaxHeight = Math.max(24, cellHeight - 38);
    const previewHalfWidth = Math.max(18, (cellWidth - 22) / 2);

    otherAssets.forEach((asset, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const centerX = gridX + column * cellWidth + cellWidth / 2;
      const centerY = gridY + row * cellHeight + cellHeight / 2;
      const failed = this.failedAssets.has(asset.id) || !this.textures.exists(asset.id);

      this.add.rectangle(centerX, centerY, cellWidth - 6, cellHeight - 6, 0x352144, 1)
        .setStrokeStyle(1, failed ? 0xff5c70 : 0x5b456e);

      for (const previewIndex of [0, 1]) {
        const isLightPreview = previewIndex === 1;
        const halfX = centerX + (previewIndex === 0 ? -cellWidth / 4 : cellWidth / 4);
        this.add.rectangle(halfX, centerY - 7, cellWidth / 2 - 9, cellHeight - 30,
          isLightPreview ? LIGHT_PREVIEW : DARK_PREVIEW, 1);
        if (failed) continue;

        const source = this.textures.get(asset.id).getSourceImage();
        const fitted = fitWithin(source.width, source.height, previewHalfWidth, previewMaxHeight);
        this.add.image(halfX, centerY - 8, asset.id).setDisplaySize(fitted.width, fitted.height);
      }

      this.add.text(centerX, centerY + cellHeight / 2 - 20, shortLabel(asset.id), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        color: failed ? '#ff5c70' : '#fff1d0',
        align: 'center',
        wordWrap: { width: cellWidth - 12 },
      }).setOrigin(0.5, 0);
    });

    if (this.failedAssets.size > 0) {
      this.add.text(width - 24, height - 24, `Failed to load: ${[...this.failedAssets].join(', ')}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#ff5c70',
      }).setOrigin(1, 1);
    }
    document.documentElement.dataset.snackLabAssetQaStatus = this.failedAssets.size === 0 ? 'passed' : 'failed';
    document.documentElement.dataset.snackLabAssetQaFailed = [...this.failedAssets].join(',');
  }

  private renderCharacterStack(
    label: string,
    layers: readonly string[],
    centerX: number,
    centerY: number,
    stackSize: number,
    stackCenters: readonly number[],
  ): void {
    this.add.text(centerX, centerY - stackSize / 2 - 25, `${label} · ${layers.length} layers`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#5df2c6',
    }).setOrigin(0.5, 0);
    stackCenters.forEach((x, previewIndex) => {
      const isLightPreview = previewIndex === 1;
      const panelColor = isLightPreview ? LIGHT_PREVIEW : DARK_PREVIEW;
      const labelColor = isLightPreview ? '#241332' : '#fff1d0';
      this.add.rectangle(x, centerY, stackSize, stackSize + 34, panelColor, 1)
        .setStrokeStyle(1, isLightPreview ? 0xd3cbbd : 0x5b456e);
      this.add.text(x, centerY - stackSize / 2 - 9, isLightPreview ? 'LIGHT' : 'DARK', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: labelColor,
      }).setOrigin(0.5, 0.5);
      layers.forEach((id, index) => {
        if (!this.failedAssets.has(id) && this.textures.exists(id)) {
          this.add.image(x, centerY, id).setDisplaySize(stackSize, stackSize).setDepth(index + 1);
        }
      });
    });
  }

  private renderPickyVariantStrip(centerX: number, centerY: number, size: number): void {
    this.add.text(centerX, centerY - size / 2 - 23, 'Picky Pigeon · authored variants', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#5df2c6',
    }).setOrigin(0.5, 0);
    const spacing = Math.min(size + 8, 104);
    const startX = centerX - spacing * (PICKY_PIGEON_VARIANTS.length - 1) / 2;
    PICKY_PIGEON_VARIANTS.forEach((variant, variantIndex) => {
      const x = startX + variantIndex * spacing;
      this.add.rectangle(x, centerY, size, size + 18, DARK_PREVIEW, 1)
        .setStrokeStyle(1, 0x5b456e);
      variant.layers.forEach((id, layerIndex) => {
        if (!this.failedAssets.has(id) && this.textures.exists(id)) {
          this.add.image(x, centerY, id).setDisplaySize(size, size).setDepth(layerIndex + 1);
        }
      });
      this.add.text(x, centerY + size / 2 + 3, variant.label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '7px',
        fontStyle: 'bold',
        color: '#fff1d0',
      }).setOrigin(0.5, 0);
    });
  }
}

function fitWithin(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}

function shortLabel(id: string): string {
  return id
    .replace(/^customer\.business-cat\./, 'cat · ')
    .replace(/^customer\.picky-pigeon\./, 'pigeon · ')
    .replace(/^food\.burger\./, 'burger · ')
    .replace(/^food\.hotdog\./, 'hot-dog · ')
    .replace(/^station\./, 'station · ')
    .replace(/^background\./, 'background · ')
    .replace(/^environment\./, 'environment · ')
    .replace(/^ui\./, 'ui · ')
    .replace(/^fx\./, 'fx · ');
}
