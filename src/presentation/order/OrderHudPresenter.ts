import Phaser from 'phaser';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { TranslationKey } from '../../localization/createTranslator';
import type { OrderLayout } from './orderLayout';
import type { ShiftPhase } from '../../game/shifts/ShiftSession';
import { PatienceMeterPresenter } from './PatienceMeterPresenter';
import {
  createEmptyOrderSnapshot,
  getActionLabel,
  getOrderAction,
  hasOrderAction,
  type OrderAction,
} from './orderActions';

export class OrderHudPresenter {
  private readonly orderBubble: Phaser.GameObjects.Image;
  private readonly customerName: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly modifier: Phaser.GameObjects.Text;
  private readonly instruction: Phaser.GameObjects.Text;
  private readonly stationName: Phaser.GameObjects.Text;
  private readonly coinIcon: Phaser.GameObjects.Image;
  private readonly coinValue: Phaser.GameObjects.Text;
  private readonly actionPanel: Phaser.GameObjects.Graphics;
  private readonly actionButton: Phaser.GameObjects.Zone;
  private readonly actionLabel: Phaser.GameObjects.Text;
  private readonly cookState: Phaser.GameObjects.Text;
  private readonly heatTrack: Phaser.GameObjects.Graphics;
  private readonly resultBackdrop: Phaser.GameObjects.Graphics;
  private readonly resultCard: Phaser.GameObjects.Image;
  private readonly resultScoreLabels: readonly Phaser.GameObjects.Text[];
  private readonly resultScoreBars: Phaser.GameObjects.Graphics;
  private readonly paymentText: Phaser.GameObjects.Text;
  private readonly nextOrderText: Phaser.GameObjects.Text;
  private readonly patienceMeter: PatienceMeterPresenter;
  private layoutState: OrderLayout | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly order: OrderDefinition,
    private readonly customerNameKey: string,
    onAction: (action: OrderAction) => void,
  ) {
    this.orderBubble = scene.add.image(0, 0, 'ui.order-bubble.street').setDepth(30);
    this.customerName = this.makeText(0, 0, '', 11, '#5e3158');
    this.title = this.makeText(0, 0, '', 18, '#241332');
    this.modifier = this.makeText(0, 0, '', 13, '#bd3e53');
    this.instruction = this.makeText(0, 0, '', 11, '#5e3158');
    this.stationName = this.makeText(0, 0, '', 13, '#fff7e8');
    this.coinIcon = scene.add.image(0, 0, 'ui.coin-icon').setDepth(31);
    this.coinValue = this.makeText(0, 0, '', 15, '#fff7e8').setOrigin(0, 0.5);
    this.actionPanel = scene.add.graphics().setDepth(31);
    this.actionButton = scene.add.zone(0, 0, 180, 56).setDepth(32);
    this.actionLabel = this.makeText(0, 0, '', 15, '#fff7e8');
    this.actionButton.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      const action = getOrderAction(this.snapshot, this.order);
      if (action) onAction(action);
      else if (this.snapshot.phase === 'next-order-ready') onAction({ type: 'replay-shift' });
    });
    this.cookState = this.makeText(0, 0, '', 14, '#fff7e8');
    this.heatTrack = scene.add.graphics().setDepth(31);
    this.resultBackdrop = scene.add.graphics().setDepth(31);
    this.resultCard = scene.add.image(0, 0, 'ui.result-card.compact').setDepth(32);
    this.resultScoreLabels = [
      this.makeText(0, 0, '', 12, '#fff7e8').setDepth(33),
      this.makeText(0, 0, '', 12, '#fff7e8').setDepth(33),
      this.makeText(0, 0, '', 12, '#fff7e8').setDepth(33),
    ];
    this.resultScoreBars = scene.add.graphics().setDepth(34);
    this.paymentText = this.makeText(0, 0, '', 11, '#fff7e8').setDepth(33);
    this.nextOrderText = this.makeText(0, 0, '', 16, '#fff7e8').setDepth(33);
    this.patienceMeter = new PatienceMeterPresenter(scene);
    this.snapshot = createEmptyOrderSnapshot(order.id);
  }

  private snapshot: OrderSnapshot;

  public layout(layout: OrderLayout): void {
    this.layoutState = layout;
    const orderWidth = layout.orderWidth;
    const orderHeight = layout.orderHeight;
    this.orderBubble.setPosition(layout.orderX, layout.orderY).setDisplaySize(orderWidth, orderHeight);
    this.customerName.setPosition(layout.orderX, layout.orderY - orderHeight * 0.30);
    this.title.setPosition(layout.orderX, layout.orderY - orderHeight * 0.10).setFontSize(layout.compact ? '15px' : '18px');
    this.modifier.setPosition(layout.orderX, layout.orderY + orderHeight * 0.08).setFontSize(layout.compact ? '12px' : '13px');
    this.instruction.setPosition(layout.orderX, layout.orderY + orderHeight * 0.22)
      .setFontSize(layout.compact ? '9px' : '10px');
    this.coinIcon.setPosition(layout.width - 70, 28).setDisplaySize(28, 28);
    this.coinValue.setPosition(layout.width - 50, 28);
    this.actionButton.setPosition(layout.actionX, layout.actionY).setSize(layout.actionWidth, layout.actionHeight);
    this.actionPanel.clear()
      .fillStyle(0x25123d, 0.96)
      .fillRoundedRect(
        layout.actionX - layout.actionWidth / 2,
        layout.actionY - layout.actionHeight / 2,
        layout.actionWidth,
        layout.actionHeight,
        18,
      )
      .lineStyle(2, 0x5df2c6, 0.95)
      .strokeRoundedRect(
        layout.actionX - layout.actionWidth / 2,
        layout.actionY - layout.actionHeight / 2,
        layout.actionWidth,
        layout.actionHeight,
        18,
      );
    this.actionLabel.setPosition(layout.actionX, layout.actionY).setFontSize(layout.compact ? '13px' : '15px');
    this.stationName.setPosition(layout.stationX, layout.stationY - layout.stationHeight * 0.40)
      .setFontSize(layout.compact ? '12px' : '14px');
    this.cookState.setPosition(layout.stationX, layout.stationY + layout.stationHeight * 0.42)
      .setFontSize(layout.compact ? '12px' : '14px');
    this.heatTrack.setDepth(31);

    const cardWidth = layout.wide
      ? Math.min(420, layout.compact ? layout.height * 1.1 : layout.width * 0.34)
      : Math.min(layout.width * 0.94, 440);
    const cardHeight = cardWidth * 2 / 3;
    const cardX = layout.width * 0.5;
    const cardY = layout.height * (layout.compact ? 0.49 : 0.51);
    this.resultBackdrop.clear()
      .fillStyle(0x241332, 0.94)
      .fillRoundedRect(cardX - cardWidth / 2, cardY - cardHeight / 2, cardWidth, cardHeight, 24)
      .lineStyle(2, 0xfff1d0, 0.94)
      .strokeRoundedRect(cardX - cardWidth / 2, cardY - cardHeight / 2, cardWidth, cardHeight, 24);
    this.resultCard.setPosition(cardX, cardY)
      .setDisplaySize(cardWidth, cardHeight);
    const columns = [-0.275, 0, 0.275];
    this.resultScoreLabels.forEach((label, index) => {
      label.setPosition(cardX + cardWidth * (columns[index] ?? 0), cardY + cardHeight * 0.16)
        .setFontSize(layout.width < 500 ? '11px' : layout.compact ? '11px' : '12px')
        .setWordWrapWidth(cardWidth * 0.26);
    });
    this.paymentText.setPosition(cardX, cardY + cardHeight * 0.40)
      .setFontSize(layout.width < 500 ? '10px' : layout.compact ? '11px' : '12px')
      .setWordWrapWidth(cardWidth * 0.84);
    this.nextOrderText.setPosition(layout.width * 0.5, Math.max(22, layout.height * 0.055))
      .setFontSize(layout.compact ? '13px' : '16px');
    this.patienceMeter.layout(layout);
  }

  public render(
    snapshot: OrderSnapshot,
    coins: number,
    shiftPhase: ShiftPhase,
    localize: (key: TranslationKey) => string,
  ): void {
    this.snapshot = snapshot;
    this.patienceMeter.render(snapshot);
    const showOrder = !['customer-leaving', 'next-order-ready'].includes(snapshot.phase);
    this.orderBubble.setVisible(showOrder);
    this.customerName.setVisible(showOrder).setText(localize(this.customerNameKey as TranslationKey));
    this.title.setVisible(showOrder).setText(localize(this.order.displayNameKey as TranslationKey));
    this.modifier.setVisible(showOrder).setText(localize(this.order.modifierKey as TranslationKey));
    this.instruction.setVisible(showOrder);
    this.instruction.setText(localize(
      snapshot.phase === 'payment' && snapshot.transformationResult
        ? 'reaction.flaming'
        : `order.phase.${snapshot.phase}` as TranslationKey,
    ));
    this.nextOrderText.setVisible(snapshot.phase === 'next-order-ready')
      .setText(localize(shiftPhase === 'completed' ? 'shift.completed' : 'order.phase.next-order-ready'));
    this.coinValue.setText(String(coins));
    this.stationName.setText(localize(snapshot.phase === 'grilling' ? 'station.grill' : 'station.prep-board'));
    this.stationName.setVisible(['ingredient-selection', 'prep-board', 'grilling'].includes(snapshot.phase));
    const canReplay = snapshot.phase === 'next-order-ready' && shiftPhase === 'completed';
    const showAction = hasOrderAction(snapshot.phase) || canReplay;
    this.actionPanel.setVisible(showAction);
    this.actionButton.setVisible(showAction);
    this.actionLabel.setVisible(showAction);
    const actionKey = getActionLabel(snapshot, this.order);
    const actionText = localize(actionKey as TranslationKey);
    this.actionLabel.setText(canReplay
      ? localize('action.replay-shift')
      : actionKey === 'action.add-modifier'
      ? actionText.replace('{modifier}', localize(this.order.modifierKey as TranslationKey))
      : actionText);
    this.cookState.setVisible(snapshot.phase === 'grilling');
    this.cookState.setText(localize(`cook.${snapshot.grill.state}` as TranslationKey));
    this.drawHeat(snapshot);

    const showResult = snapshot.phase === 'next-order-ready';
    this.resultBackdrop.setVisible(showResult);
    this.resultCard.setVisible(showResult);
    for (const label of this.resultScoreLabels) label.setVisible(showResult);
    this.resultScoreBars.setVisible(showResult);
    this.paymentText.setVisible(showResult);
    if (showResult && snapshot.scores && snapshot.payment) {
      const scores = [snapshot.scores.order, snapshot.scores.cook, snapshot.scores.chaos];
      const names = ['result.order', 'result.cook', 'result.chaos'] as const;
      this.resultScoreLabels.forEach((label, index) => {
        label.setText(`${localize(names[index] ?? 'result.order')} ${scores[index] ?? 0}%`);
      });
      this.drawScoreBars(snapshot.scores);
      this.paymentText.setText([
        localize('payment.summary')
          .replace('{amount}', String(snapshot.payment.base))
          .replace('{bonus}', String(snapshot.payment.qualityBonus + snapshot.payment.chaosBonus + snapshot.payment.transformationMultiplier)),
        localize('payment.tip-total')
          .replace('{tip}', String(snapshot.payment.tip))
          .replace('{total}', String(snapshot.payment.total)),
      ]);
    }
  }

  public updatePatience(snapshot: OrderSnapshot): void {
    this.patienceMeter.render(snapshot);
  }

  public getStationAction(): OrderAction | null {
    return getOrderAction(this.snapshot, this.order);
  }

  public layoutStateSnapshot(): OrderLayout | null {
    return this.layoutState;
  }

  public destroy(): void {
    const objects = [
      this.orderBubble, this.customerName, this.title, this.modifier, this.instruction,
      this.stationName, this.coinIcon, this.coinValue, this.actionPanel, this.actionButton,
      this.actionLabel, this.cookState, this.heatTrack, this.resultBackdrop, this.resultCard,
      ...this.resultScoreLabels, this.resultScoreBars, this.paymentText, this.nextOrderText,
    ];
    for (const object of new Set(objects)) object.destroy();
    this.patienceMeter.destroy();
  }

  private drawHeat(snapshot: OrderSnapshot): void {
    this.heatTrack.clear();
    if (snapshot.phase !== 'grilling' || !this.layoutState) return;
    const { stationX, stationY, stationWidth, stationHeight } = this.layoutState;
    const width = Math.min(stationWidth * 0.62, this.layoutState.width * 0.54);
    const x = stationX - width / 2;
    const y = stationY + stationHeight * 0.34;
    this.heatTrack.fillStyle(0x241332, 0.9).fillRoundedRect(x, y, width, 14, 7);
    const color = snapshot.grill.state === 'burned' ? 0xff5c70
      : snapshot.grill.state === 'perfect' ? 0x5df2c6
        : 0xffb347;
    this.heatTrack.fillStyle(color, 1).fillRoundedRect(x + 2, y + 2, (width - 4) * snapshot.grill.progress, 10, 5);
  }

  private drawScoreBars(scores: { readonly order: number; readonly cook: number; readonly chaos: number }): void {
    this.resultScoreBars.clear();
    const layout = this.layoutState;
    if (!layout) return;
    const cardWidth = this.resultCard.displayWidth;
    const cardHeight = this.resultCard.displayHeight;
    const centerY = this.resultCard.y + cardHeight * 0.30;
    const barWidth = cardWidth * 0.18;
    const scoresList = [scores.order, scores.cook, scores.chaos];
    const positions = [-0.275, 0, 0.275];
    scoresList.forEach((score, index) => {
      const x = this.resultCard.x + cardWidth * (positions[index] ?? 0) - barWidth / 2;
      const ratio = index === 2 ? Math.min(1, score / 200) : Math.min(1, score / 100);
      const color = index === 0 ? 0x5df2c6 : index === 1 ? 0xffb347 : 0xff5c70;
      this.resultScoreBars.fillStyle(color, 1)
        .fillRoundedRect(x, centerY - 3, barWidth * ratio, 6, 3);
    });
  }

  private makeText(
    x: number,
    y: number,
    text: string,
    fontSize: number,
    color: string,
  ): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color,
      align: 'center',
      stroke: color === '#241332' || color === '#5e3158' ? '#fff1d0' : '#241332',
      strokeThickness: color === '#241332' || color === '#5e3158' ? 0 : 3,
      wordWrap: { width: 320, useAdvancedWrap: true },
    }).setOrigin(0.5, 0.5).setDepth(31);
  }
}
