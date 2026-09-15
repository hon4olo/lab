import Phaser from 'phaser';
import type { TranslationKey } from '../../localization/createTranslator';
import type { StationPresentationMode } from './stationPresentation';

const STAGES: readonly {
  readonly mode: Exclude<StationPresentationMode, 'results'>;
  readonly label: TranslationKey;
}[] = [
  { mode: 'order', label: 'station.order' },
  { mode: 'prep', label: 'station.prep' },
  { mode: 'grill', label: 'station.grill' },
  { mode: 'build', label: 'station.build' },
  { mode: 'serve', label: 'station.serve' },
];

const FALLBACK_STAGE = { mode: 'order', label: 'station.order' } as const;

export class StationRailPresenter {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.Text[];
  private width = 0;
  private height = 0;

  public constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(26);
    this.labels = STAGES.map(() => scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
      fontSize: '11px',
      color: '#fff7e8',
      align: 'center',
    }).setOrigin(0.5).setDepth(27));
  }

  public layout(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public render(mode: StationPresentationMode, localize: (key: TranslationKey) => string): void {
    const compact = this.width < 640 || this.height < 500;
    this.graphics.clear();

    if (mode === 'results') {
      this.renderSingle(localize('station.results'), compact);
      return;
    }

    if (compact) {
      const stage = STAGES.find((item) => item.mode === mode) ?? FALLBACK_STAGE;
      this.renderSingle(localize(stage.label), true);
      return;
    }

    const totalWidth = Math.min(480, this.width * 0.43);
    const tabWidth = totalWidth / STAGES.length;
    const tabHeight = 30;
    const y = 25;
    const left = this.width / 2 - totalWidth / 2;

    STAGES.forEach((stage, index) => {
      const label = this.labels[index];
      if (!label) return;
      const active = stage.mode === mode;
      const x = left + tabWidth * index;
      this.graphics
        .fillStyle(active ? 0x5df2c6 : 0x25123d, active ? 0.98 : 0.82)
        .fillRoundedRect(x + 2, y - tabHeight / 2, tabWidth - 4, tabHeight, 10)
        .lineStyle(1, active ? 0xfff1d0 : 0x725f7d, active ? 0.95 : 0.72)
        .strokeRoundedRect(x + 2, y - tabHeight / 2, tabWidth - 4, tabHeight, 10);
      label.setVisible(true)
        .setPosition(x + tabWidth / 2, y)
        .setText(localize(stage.label))
        .setColor(active ? '#241332' : '#fff7e8')
        .setFontSize('11px');
    });
  }

  public destroy(): void {
    this.graphics.destroy();
    for (const label of this.labels) label.destroy();
  }

  private renderSingle(text: string, compact: boolean): void {
    const width = Math.min(compact ? 170 : 220, this.width * 0.54);
    const height = compact ? 28 : 32;
    const x = this.width / 2;
    const y = compact ? 20 : 25;
    this.graphics
      .fillStyle(0x25123d, 0.92)
      .fillRoundedRect(x - width / 2, y - height / 2, width, height, 11)
      .lineStyle(2, 0x5df2c6, 0.92)
      .strokeRoundedRect(x - width / 2, y - height / 2, width, height, 11);

    this.labels.forEach((label, index) => label.setVisible(index === 0));
    this.labels[0]?.setPosition(x, y).setText(text).setColor('#fff7e8').setFontSize(compact ? '10px' : '12px');
  }
}
