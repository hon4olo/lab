import type { OrderPhase } from '../../game/orders/OrderSession';
import type { OrderLayout } from './orderLayout';

export type StationPresentationMode = 'order' | 'prep' | 'grill' | 'build' | 'serve' | 'results';

export interface StationPresentation {
  readonly mode: StationPresentationMode;
  readonly showWorkspace: boolean;
  readonly showCounter: boolean;
  readonly showCustomer: boolean;
  readonly showStation: boolean;
  readonly stationAsset: 'station.prep-board.street' | 'station.grill.street';
  readonly stationX: number;
  readonly stationY: number;
  readonly stationWidth: number;
  readonly stationHeight: number;
  readonly customerX: number;
  readonly customerY: number;
  readonly customerSize: number;
  readonly counterWidth: number;
  readonly counterHeight: number;
  readonly counterY: number;
  readonly workspaceX: number;
  readonly workspaceY: number;
  readonly workspaceWidth: number;
  readonly workspaceHeight: number;
}

export function stationModeForPhase(phase: OrderPhase): StationPresentationMode {
  switch (phase) {
    case 'customer-entering': return 'order';
    case 'ingredient-selection':
    case 'prep-board': return 'prep';
    case 'grilling': return 'grill';
    case 'assembly':
    case 'modifier-selection': return 'build';
    case 'anticipation':
    case 'payment':
    case 'customer-leaving': return 'serve';
    case 'next-order-ready': return 'results';
  }
}

export function createStationPresentation(layout: OrderLayout, mode: StationPresentationMode): StationPresentation {
  const workspaceWidth = layout.wide
    ? Math.min(layout.width * 0.72, 860)
    : Math.min(layout.width * 0.94, 520);
  const workspaceHeight = layout.wide
    ? Math.min(layout.height * (layout.compact ? 0.72 : 0.68), 560)
    : Math.min(layout.height * 0.60, 520);
  const workspaceX = layout.width * 0.5;
  const workspaceY = layout.height * (mode === 'build'
    ? (layout.wide ? (layout.compact ? 0.69 : 0.68) : 0.64)
    : (layout.wide ? (layout.compact ? 0.58 : 0.50) : 0.56));
  const stationWidth = Math.min(
    workspaceWidth * (mode === 'build' ? 0.72 : 0.80),
    768,
    layout.height * (layout.compact ? 0.66 : 0.62) * 1.5,
  );
  const stationHeight = stationWidth / 1.5;
  const customerSize = layout.wide
    ? Math.min(layout.customerSize * 0.82, 310)
    : Math.min(layout.customerSize * 0.88, 245);
  const counterWidth = Math.min(layout.width * (layout.wide ? 0.78 : 0.96), 1080);
  const counterHeight = counterWidth / 2;

  return {
    mode,
    showWorkspace: mode === 'prep' || mode === 'grill' || mode === 'build' || mode === 'results',
    showCounter: mode === 'order' || mode === 'serve',
    showCustomer: mode === 'order' || mode === 'serve',
    showStation: mode === 'prep' || mode === 'grill' || mode === 'build',
    stationAsset: mode === 'grill' ? 'station.grill.street' : 'station.prep-board.street',
    stationX: workspaceX,
    stationY: workspaceY + (layout.compact ? 4 : 16),
    stationWidth,
    stationHeight,
    customerX: layout.width * (layout.wide ? 0.79 : 0.70),
    customerY: layout.height * (layout.wide ? (layout.compact ? 0.42 : 0.46) : 0.46),
    customerSize,
    counterWidth,
    counterHeight,
    counterY: layout.height * (layout.wide ? 0.91 : 0.92),
    workspaceX,
    workspaceY,
    workspaceWidth,
    workspaceHeight,
  };
}
