export interface OrderLayout {
  readonly width: number;
  readonly height: number;
  readonly wide: boolean;
  readonly compact: boolean;
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
    customerX: width * (wide ? 0.73 : 0.70),
    customerY: height * (wide ? (compact ? 0.36 : 0.45) : 0.49),
    customerSize: wide
      ? Math.min(width * 0.37, height * (compact ? 0.58 : 0.62), 380)
      : Math.min(width * 0.76, height * 0.40, 300),
    stationX: width * (wide ? 0.40 : 0.34),
    stationY: height * (wide ? (compact ? 0.66 : 0.74) : 0.70),
    stationWidth: wide
      ? Math.min(width * 0.39, height * (compact ? 0.46 : 0.48) * 1.5)
      : Math.min(width * 0.62, height * 0.31 * 1.5),
    stationHeight: 0,
    orderX: width * (wide ? 0.18 : 0.36),
    orderY: height * (wide ? (compact ? 0.20 : 0.15) : 0.12),
    orderWidth: wide ? Math.min(width * 0.34, 330) : Math.min(width * 0.74, 280),
    orderHeight: 0,
    actionX: wide ? width * 0.84 : width * 0.5,
    actionY: height - (wide ? 55 : 28),
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
    stationHeight: layout.stationWidth / 1.5,
    orderHeight: layout.orderWidth / 2,
    counterHeight: layout.counterWidth / 2,
  };
}
