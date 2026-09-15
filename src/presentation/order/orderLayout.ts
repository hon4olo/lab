export interface OrderLayout {
  readonly width: number;
  readonly height: number;
  readonly wide: boolean;
  readonly compact: boolean;
  /**
   * The inset reserved for system-safe controls.  Phaser's resize scale mode
   * gives us the full canvas, so keeping this value in the shared layout
   * prevents presenters from inventing slightly different edge margins.
   */
  readonly safeInset: number;
  readonly hudTop: number;
  readonly hudBottom: number;
  readonly customerX: number;
  readonly customerY: number;
  readonly customerSize: number;
  readonly stationX: number;
  readonly stationY: number;
  readonly stationWidth: number;
  readonly stationHeight: number;
  readonly orderX: number;
  readonly orderY: number;
  readonly orderWidth: number;
  readonly orderHeight: number;
  readonly actionX: number;
  readonly actionY: number;
  readonly actionWidth: number;
  readonly actionHeight: number;
  readonly tileSize: number;
  readonly tileCenters: readonly { x: number; y: number }[];
  readonly counterWidth: number;
  readonly counterHeight: number;
  readonly counterY: number;
}

export function calculateOrderLayout(width: number, height: number): OrderLayout {
  const wide = width >= 640;
  const compact = height < 500;
  const safeInset = Math.max(10, Math.min(24, Math.min(width, height) * 0.035));
  const hudTop = safeInset + (compact ? 18 : 26);
  const hudBottom = height - safeInset;
  const tileSize = Math.min(78, wide ? Math.max(56, width * 0.085) : Math.max(62, width * 0.205));
  const tileCenters = wide
    ? Array.from({ length: 6 }, (_, index) => ({
        x: width * 0.34 + (index - 2.5) * Math.min(width * 0.105, 96),
        y: height - (compact ? 80 : 82),
      }))
    : Array.from({ length: 6 }, (_, index) => ({
        x: width / 2 + ((index % 3) - 1) * width * 0.26,
        y: height - (index < 3 ? 220 : 120),
      }));

  return {
    width,
    height,
    wide,
    compact,
    safeInset,
    hudTop,
    hudBottom,
    // Customer-facing modes reserve the right side for the character.  The
    // station workspaces themselves use the central axis below, so shared
    // presenters never recreate the old left/right card composition.
    customerX: width * (wide ? 0.76 : 0.70),
    customerY: height * (wide ? (compact ? 0.40 : 0.47) : 0.49),
    customerSize: wide
      ? Math.min(width * 0.43, height * (compact ? 0.64 : 0.68), 410)
      : Math.min(width * 0.82, height * 0.45, 340),
    // Station interactions are authored around a central work surface.  The
    // previous .40/.34 anchor made the legacy station card feel like a small
    // inset even when the dedicated Runway background filled the viewport.
    stationX: width * 0.50,
    stationY: height * (compact ? 0.70 : 0.70),
    stationWidth: wide
      ? Math.min(width * 0.84, height * (compact ? 0.56 : 0.54) * 1.5)
      : Math.min(width * 0.92, height * 0.48 * 1.5),
    stationHeight: 0,
    orderX: width * (wide ? 0.18 : 0.36),
    orderY: height * (wide ? (compact ? 0.20 : 0.15) : 0.12),
    orderWidth: wide ? Math.min(width * 0.34, 330) : Math.min(width * 0.74, 280),
    orderHeight: 0,
    actionX: wide ? width * 0.84 : width * 0.5,
    // Compact landscape Build uses the bottom band for six ingredient tools.
    // Keep the CTA one row above that shelf so an enabled Finish Build button
    // cannot intercept optional sauce/tool input on the right edge.
    actionY: height - (wide ? (compact ? 120 : 55) : 40),
    actionWidth: wide ? Math.min(width * 0.20, 220) : width * 0.58,
    actionHeight: Math.min(66, Math.max(50, height * 0.095)),
    tileSize: Math.min(tileSize, wide ? 78 : 72),
    tileCenters,
    counterWidth: Math.min(width * (wide ? 0.84 : 0.98), height * 1.48),
    counterHeight: 0,
    counterY: height * (wide ? 0.89 : 0.91),
  };
}

export function finalizeOrderLayout(layout: OrderLayout): OrderLayout {
  return {
    ...layout,
    // Dedicated station backgrounds are full-frame compositions, not 3:2
    // station cards.  Keep a bounded logical height for heat/status affordances
    // and for the legacy presentation path while the imported artwork remains
    // the visual source of truth.
    stationHeight: Math.min(layout.height * 0.44, layout.stationWidth / 1.5),
    orderHeight: layout.orderWidth / 2,
    counterHeight: layout.counterWidth / 2,
  };
}
