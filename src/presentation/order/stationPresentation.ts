import type { OrderPhase } from '../../game/orders/OrderSession';
import type { OrderLayout } from './orderLayout';
import { STREET_STATION_ASSET_IDS } from '../stations/StationAssetContract';

export type StationPresentationMode = 'order' | 'prep' | 'grill' | 'build' | 'serve' | 'results';

export interface StationRect {
  /** Left edge in viewport pixels. */
  readonly x: number;
  /** Top edge in viewport pixels. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface StationPresentation {
  readonly mode: StationPresentationMode;
  /**
   * Stable manifest ID for the full-frame authored environment.  The scene
   * still owns texture loading; exposing the ID here keeps station composition
   * independent from arbitrary file paths and makes the background choice
   * inspectable in layout tests.
   */
  readonly backgroundAsset: string;
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
  /** Central gesture/drop region in viewport coordinates. */
  readonly workSurface: StationRect;
  /** Perimeter band reserved for ingredients/tools. */
  readonly toolBand: StationRect;
  /** Region reserved for compact ticket/status controls. */
  readonly hudBand: StationRect;
  /** Authored scale hint for large physical food sprites. */
  readonly focusScale: number;
}

export function stationModeForPhase(phase: OrderPhase): StationPresentationMode {
  switch (phase) {
    case 'customer-entering': return 'order';
    // Accepting the request is its own customer-facing station. The first
    // hands-on action then transitions into Prep, so the customer and ticket
    // remain the visual focus until the player chooses the prep board.
    case 'ingredient-selection': return 'order';
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
  const portrait = layout.height > layout.width;
  const stationMode = mode === 'prep' || mode === 'grill' || mode === 'build';
  const buildMode = mode === 'build';
  const grillMode = mode === 'grill';
  const backgroundAsset = backgroundAssetForMode(mode);

  // These are intentionally broad. They describe the authored physical work
  // surface, rather than a card floating in a room. Controllers can tighten
  // their hit geometry inside this rect while the background remains the
  // perspective/frame layer.
  const workspaceWidth = stationMode
    ? portrait
      ? Math.min(layout.width * 0.94, 520)
      : Math.min(layout.width * 0.92, 1_280)
    : 0;
  const workspaceHeight = stationMode
    ? portrait
      // Build is taller in portrait to leave a generous assembly gesture
      // region, but still ends above the safe-area/tool band.
      ? Math.min(layout.height * (buildMode ? 0.64 : 0.48), 520)
      // Keep the rect inside the canvas: the lower edge is the foreground
      // station lip, not an invitation to place input outside the viewport.
      : Math.min(layout.height * (buildMode ? 0.62 : grillMode ? 0.52 : 0.46), 620)
    : 0;
  const workspaceX = layout.width * 0.5;
  const workspaceY = !stationMode
    ? layout.height * 0.52
    : portrait
      ? layout.height * (buildMode ? 0.66 : 0.70)
      : layout.height * (buildMode ? 0.69 : grillMode ? 0.67 : 0.70);
  const workSurface = rectFromCenter(workspaceX, workspaceY, workspaceWidth, workspaceHeight);
  const toolBand = stationMode
    ? portrait
      ? rectFromCenter(workspaceX, Math.min(layout.height * 0.91, layout.height - layout.safeInset * 2.5), workspaceWidth, layout.height * 0.15)
      : rectFromCenter(workspaceX, Math.min(layout.height * 0.90, layout.height - layout.safeInset * 2.5), workspaceWidth, layout.height * 0.14)
    : emptyRect();
  const hudBand = rectFromCenter(layout.width * 0.5, layout.hudTop, layout.width - layout.safeInset * 2, layout.compact ? 42 : 56);
  const stationWidth = stationMode
    ? Math.min(workspaceWidth * (buildMode ? 0.92 : 0.96), layout.width * 0.90)
    : 0;
  const stationHeight = stationMode
    ? Math.min(workspaceHeight * 0.90, layout.height * 0.44)
    : 0;
  const customerSize = layout.wide
    ? Math.min(layout.customerSize, 410)
    : Math.min(layout.customerSize, 340);
  const counterWidth = Math.min(layout.width * (layout.wide ? 0.84 : 0.96), 1080);
  const counterHeight = counterWidth / 2;

  return {
    mode,
    backgroundAsset,
    showWorkspace: stationMode,
    showCounter: mode === 'order' || mode === 'serve',
    showCustomer: mode === 'order' || mode === 'serve',
    showStation: stationMode,
    // Kept as a compatibility seam for the pre-Batch-03 station sprite path.
    // Dedicated backgrounds are now the visible station art.
    stationAsset: grillMode ? 'station.grill.street' : 'station.prep-board.street',
    stationX: workspaceX,
    stationY: workspaceY,
    stationWidth,
    stationHeight,
    customerX: layout.customerX,
    customerY: layout.customerY,
    customerSize,
    counterWidth,
    counterHeight,
    counterY: layout.counterY,
    workspaceX,
    workspaceY,
    workspaceWidth,
    workspaceHeight,
    workSurface,
    toolBand,
    hudBand,
    focusScale: buildMode ? (portrait ? 1.15 : 1.28) : grillMode ? 1.18 : 1.10,
  };
}

function backgroundAssetForMode(mode: StationPresentationMode): string {
  switch (mode) {
    case 'prep': return STREET_STATION_ASSET_IDS.prepBackground;
    case 'grill': return STREET_STATION_ASSET_IDS.grillBackground;
    case 'build': return STREET_STATION_ASSET_IDS.buildBackground;
    case 'order':
    case 'serve':
    case 'results': return STREET_STATION_ASSET_IDS.orderBackground;
  }
}

function rectFromCenter(centerX: number, centerY: number, width: number, height: number): StationRect {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

function emptyRect(): StationRect {
  return { x: 0, y: 0, width: 0, height: 0 };
}
