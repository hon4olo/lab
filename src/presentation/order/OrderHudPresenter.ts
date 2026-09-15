import Phaser from 'phaser';
import type { OrderDefinition } from '../../game/orders/OrderDefinition';
import type { OrderSnapshot } from '../../game/orders/OrderSession';
import type { TranslationKey } from '../../localization/createTranslator';
import { buildActionPosition, type OrderLayout } from './orderLayout';
import type { ShiftPhase } from '../../game/shifts/ShiftSession';
import { PatienceMeterPresenter } from './PatienceMeterPresenter';
import { hasRequiredModifiers, orderVariationDisplayNameKey } from '../../game/orders/OrderRequirements';
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
    private readonly handsOnBuildEnabled = false,
    private readonly handsOnGrillEnabled = false,
    private readonly handsOnPrepEnabled = false,
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
      const action = this.getStationAction();
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
    this.layoutOrderReference(false);
    this.coinIcon.setPosition(layout.width - 70, 28).setDisplaySize(28, 28);
    this.coinValue.setPosition(layout.width - 50, 28);
    this.layoutAction(layout, layout.actionX, layout.actionY);
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
    const compactTicket = this.isCompactHandsOnTicket(snapshot);
    this.layoutOrderReference(compactTicket);
    const showOrder = !['customer-leaving', 'next-order-ready'].includes(snapshot.phase);
    this.orderBubble.setVisible(showOrder);
    this.customerName.setVisible(showOrder && !compactTicket)
      .setText(localize(this.customerNameKey as TranslationKey));
    this.title.setVisible(showOrder).setText(localize(this.order.displayNameKey as TranslationKey));
    const variationKey = orderVariationDisplayNameKey(this.order);
    this.modifier.setVisible(showOrder && variationKey !== null)
      .setText(variationKey ? localize(variationKey as TranslationKey) : '');
    this.instruction.setVisible(showOrder && !compactTicket);
    const phaseInstruction = snapshot.phase === 'payment'
      ? snapshot.transformationResult?.reactionSequence ?? this.order.reactionSequence ?? 'order.phase.payment'
      : snapshot.phase === 'modifier-selection' && !hasRequiredModifiers(this.order)
        ? 'order.phase.modifier-selection.optional'
        : this.order.instructionKeys?.[snapshot.phase] ?? `order.phase.${snapshot.phase}`;
    this.instruction.setText(localize(phaseInstruction as TranslationKey));
    this.nextOrderText.setVisible(snapshot.phase === 'next-order-ready')
      .setText(localize(shiftPhase === 'completed' ? 'shift.completed' : 'order.phase.next-order-ready'));
    this.coinValue.setText(String(coins));
    const stationPhase = snapshot.phase === 'grilling'
      ? 'station.grill'
      : snapshot.phase === 'prep-board' ? 'station.prep-board' : null;
    this.stationName.setText(stationPhase ? localize(stationPhase) : '');
    this.stationName.setVisible(stationPhase !== null);
    const canReplay = snapshot.phase === 'next-order-ready' && shiftPhase === 'completed';
    const handsOnGrillActive = this.handsOnGrillEnabled && snapshot.phase === 'grilling';
    const handsOnPrepActive = this.handsOnPrepEnabled && this.hasPendingPrep(snapshot);
    const buildPhase = snapshot.phase === 'assembly' && this.handsOnBuildEnabled;
    const incompleteBuild = buildPhase && !snapshot.assemblyReady;
    const actionPosition = this.actionPositionFor(snapshot);
    if (this.layoutState) this.layoutAction(this.layoutState, actionPosition.x, actionPosition.y);
    const showAction = (hasOrderAction(snapshot.phase) || canReplay)
      && !handsOnGrillActive
      && !handsOnPrepActive
      // A disabled Finish Build CTA is visual noise and can sit over the
      // ingredient rail. It becomes visible only once the spatial assembly is
      // actually ready, at a safe top/right location outside the shelf.
      && !incompleteBuild;
    const orderAction = this.getStationAction();
    const actionEnabled = canReplay || orderAction !== null;
    this.actionPanel.setVisible(showAction).setAlpha(actionEnabled ? 1 : 0.52);
    this.actionButton.setVisible(showAction);
    if (this.actionButton.input) this.actionButton.input.enabled = showAction && actionEnabled;
    this.actionLabel.setVisible(showAction).setAlpha(actionEnabled ? 1 : 0.62);
    const actionKey = getActionLabel(snapshot, this.order, this.handsOnBuildEnabled);
    const displayedActionKey = this.order.actionLabelKeys?.[actionKey] ?? actionKey;
    const actionText = localize(displayedActionKey as TranslationKey);
    this.actionLabel.setText(canReplay
      ? localize('action.replay-shift')
      : actionKey === 'action.add-modifier'
      ? actionText.replace('{modifier}', variationKey ? localize(variationKey as TranslationKey) : '')
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
    if (this.handsOnGrillEnabled && this.snapshot.phase === 'grilling') return null;
    if (this.handsOnPrepEnabled && this.hasPendingPrep(this.snapshot)) return null;
    return getOrderAction(this.snapshot, this.order, this.handsOnBuildEnabled);
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

  private hasPendingPrep(snapshot: OrderSnapshot): boolean {
    if (snapshot.phase !== 'prep-board') return false;
    return (this.order.requiredPrepIngredientIds ?? []).some(
      (ingredientId) => snapshot.selectedIngredients.includes(ingredientId)
        && !snapshot.preparedIngredients.includes(ingredientId),
    );
  }

  private isCompactHandsOnTicket(snapshot: OrderSnapshot): boolean {
    if (snapshot.phase === 'prep-board') return this.handsOnPrepEnabled;
    if (snapshot.phase === 'grilling') return this.handsOnGrillEnabled;
    if (snapshot.phase === 'assembly') return this.handsOnBuildEnabled && snapshot.assembly !== undefined;
    // Serve/reaction keeps only a compact order reference so the customer and
    // FoodInstance remain the screen's visual heroes.
    if (snapshot.phase === 'anticipation' || snapshot.phase === 'payment') return true;
    return false;
  }

  private layoutOrderReference(compactTicket: boolean): void {
    const layout = this.layoutState;
    if (!layout) return;
    const orderWidth = compactTicket
      ? Math.min(layout.orderWidth * (layout.wide ? 0.62 : 0.68), 196)
      : layout.orderWidth;
    const orderHeight = orderWidth / 2;
    const orderX = layout.orderX;
    const orderY = layout.orderY;
    this.orderBubble.setPosition(orderX, orderY).setDisplaySize(orderWidth, orderHeight);
    this.customerName.setPosition(orderX, orderY - orderHeight * 0.30)
      .setFontSize(layout.compact ? '10px' : '11px');
    this.title.setPosition(orderX, orderY - orderHeight * (compactTicket ? 0.08 : 0.10))
      .setFontSize(compactTicket ? (layout.compact ? '12px' : '13px') : (layout.compact ? '15px' : '18px'))
      .setWordWrapWidth(orderWidth * (compactTicket ? 0.82 : 0.90));
    this.modifier.setPosition(orderX, orderY + orderHeight * (compactTicket ? 0.22 : 0.08))
      .setFontSize(compactTicket ? '10px' : (layout.compact ? '12px' : '13px'))
      .setWordWrapWidth(orderWidth * 0.86);
    this.instruction.setPosition(orderX, orderY + orderHeight * 0.22)
      .setFontSize(layout.compact ? '9px' : '10px')
      .setWordWrapWidth(orderWidth * 0.86);
  }

  private drawHeat(snapshot: OrderSnapshot): void {
    this.heatTrack.clear();
    if (snapshot.phase !== 'grilling' || !this.layoutState) return;
    const { stationX, stationY, stationWidth, stationHeight } = this.layoutState;
    const width = Math.min(stationWidth * 0.62, this.layoutState.width * 0.54);
    const x = stationX - width / 2;
    // Before the raw ingredient is placed, its large stock sprite occupies
    // the foreground tool band. Keep the timing HUD above that sprite; once
    // the ingredient is on the grill, return the track to the lower station
    // lip where it reads with the cooking surface.
    const idleGrill = !snapshot.grill.active || snapshot.grill.slotId === null;
    const y = idleGrill
      ? stationY - stationHeight * 0.20
      : stationY + stationHeight * 0.34;
    this.heatTrack.fillStyle(0x241332, 0.9).fillRoundedRect(x, y, width, 14, 7);
    const color = snapshot.grill.state === 'burned' ? 0xff5c70
      : snapshot.grill.state === 'perfect' ? 0x5df2c6
        : 0xffb347;
    this.heatTrack.fillStyle(color, 1).fillRoundedRect(x + 2, y + 2, (width - 4) * snapshot.grill.progress, 10, 5);
    this.cookState.setPosition(stationX, y + 23);
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

  private layoutAction(layout: OrderLayout, x: number, y: number): void {
    this.actionButton.setPosition(x, y).setSize(layout.actionWidth, layout.actionHeight);
    this.actionPanel.clear()
      .fillStyle(0x25123d, 0.96)
      .fillRoundedRect(
        x - layout.actionWidth / 2,
        y - layout.actionHeight / 2,
        layout.actionWidth,
        layout.actionHeight,
        18,
      )
      .lineStyle(2, 0x5df2c6, 0.95)
      .strokeRoundedRect(
        x - layout.actionWidth / 2,
        y - layout.actionHeight / 2,
        layout.actionWidth,
        layout.actionHeight,
        18,
      );
    this.actionLabel.setPosition(x, y).setFontSize(layout.compact ? '13px' : '15px');
  }

  private actionPositionFor(snapshot: OrderSnapshot): { readonly x: number; readonly y: number } {
    const layout = this.layoutState;
    if (!layout || !(snapshot.phase === 'assembly' && this.handsOnBuildEnabled)) {
      return { x: layout?.actionX ?? 0, y: layout?.actionY ?? 0 };
    }

    return buildActionPosition(layout);
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
