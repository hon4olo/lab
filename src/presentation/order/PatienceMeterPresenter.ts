import Phaser from 'phaser';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { OrderLayout } from './orderLayout';

const WAITING_PHASES = new Set(['ingredient-selection', 'prep-board', 'grilling', 'assembly', 'modifier-selection']);

export class PatienceMeterPresenter {
  private readonly frame: Phaser.GameObjects.Image;
  private readonly depletedTrack: Phaser.GameObjects.Graphics;
  private x = 0;
  private y = 0;
  private width = 0;
  private height = 0;
  private lastRenderSignature = '';

  public constructor(scene: Phaser.Scene) {
    this.frame = scene.add.image(0, 0, 'ui.patience-indicator').setDepth(30);
    this.depletedTrack = scene.add.graphics().setDepth(31);
  }

  public layout(layout: OrderLayout): void {
    this.width = Math.min(190, layout.width * 0.46);
    this.height = this.width / 3;
    this.x = layout.customerX;
    this.y = Math.max(this.height * 0.62, layout.customerY - layout.customerSize * 0.54);
    this.frame.setPosition(this.x, this.y).setDisplaySize(this.width, this.height);
  }

  public render(snapshot: OrderSnapshot): void {
    // The meter is a small HUD affordance, while the station background and
    // food sprites are the expensive full-frame work.  Keep the authored bar
    // responsive without rebuilding its Graphics geometry on every Phaser
    // tick; a tenth-of-a-percent change is still substantially finer than a
    // human can perceive at gameplay scale.
    const signature = `${snapshot.phase}:${Math.round(snapshot.patience.ratio * 1000)}`;
    if (signature === this.lastRenderSignature) return;
    this.lastRenderSignature = signature;
    const visible = WAITING_PHASES.has(snapshot.phase);
    this.frame.setVisible(visible);
    this.depletedTrack.clear();
    if (!visible || snapshot.patience.ratio >= 1) return;

    const left = this.x - this.width / 2 + this.width * 0.235;
    const right = this.x + this.width / 2 - this.width * 0.045;
    const cutoff = left + (right - left) * snapshot.patience.ratio;
    const top = this.y - this.height * 0.115;
    this.depletedTrack.fillStyle(0x241332, 0.76)
      .fillRoundedRect(cutoff, top, Math.max(0, right - cutoff), this.height * 0.23, this.height * 0.09);
  }

  public destroy(): void {
    this.frame.destroy();
    this.depletedTrack.destroy();
  }
}
