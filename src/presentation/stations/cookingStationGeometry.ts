export interface StationRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface GrillSlotGeometry {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly hitRadius: number;
}

export interface PrepStationGeometry {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceWidth: number;
  readonly target: StationRect;
  readonly placedWidth: number;
  readonly knifeX: number;
  readonly knifeY: number;
  readonly knifeWidth: number;
}

export interface GrillStationGeometry {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceWidth: number;
  readonly itemWidth: number;
  readonly spatulaX: number;
  readonly spatulaY: number;
  readonly spatulaWidth: number;
  readonly slots: readonly GrillSlotGeometry[];
}

/**
 * Viewport geometry for the authored Prep work surface and perimeter tool.
 * This module intentionally has no Phaser dependency so responsive contracts
 * can be tested without creating a renderer.
 */
export function prepStationGeometry(width: number, height: number): PrepStationGeometry {
  const portrait = width < height;
  const compactLandscape = !portrait && height < 500;
  const sourceWidth = Math.min(
    width * (portrait ? 0.44 : compactLandscape ? 0.28 : 0.25),
    height * (portrait ? 0.27 : compactLandscape ? 0.46 : 0.42),
    portrait ? 180 : 360,
  );
  const sourceX = width * (portrait ? 0.24 : 0.14);
  const sourceY = height * (compactLandscape ? 0.82 : 0.86);
  const placedWidth = Math.min(
    sourceWidth * (portrait ? 1.40 : 1.18),
    portrait ? 250 : 420,
  );
  const targetWidth = width * (portrait ? 0.82 : 0.56);
  const targetHeight = height * (portrait ? 0.28 : 0.30);
  const centerX = width * 0.5;
  const centerY = height * (portrait ? 0.68 : 0.69);
  const knifeWidth = Math.min(
    width * (portrait ? 0.28 : compactLandscape ? 0.22 : 0.15),
    height * (portrait ? 0.24 : compactLandscape ? 0.45 : 0.27),
    portrait ? 110 : 220,
  );

  return {
    sourceX,
    sourceY,
    sourceWidth,
    target: {
      x: centerX - targetWidth / 2,
      y: centerY - targetHeight / 2,
      width: targetWidth,
      height: targetHeight,
    },
    placedWidth,
    knifeX: width * (portrait ? 0.84 : 0.85),
    knifeY: height * (portrait ? 0.67 : 0.73),
    knifeWidth,
  };
}

/**
 * Viewport geometry for the approved four-zone grill illustration. The
 * source/item sizes are authored large enough to read as food, not icons.
 */
export function grillStationGeometry(width: number, height: number): GrillStationGeometry {
  const portrait = width < height;
  const compactLandscape = !portrait && height < 500;
  const centerX = width * 0.5;
  const centerY = height * 0.66;
  const dx = width * (portrait ? 0.17 : 0.14);
  const dy = height * (portrait ? 0.075 : 0.085);
  const hitRadius = Math.min(
    width * (portrait ? 0.19 : compactLandscape ? 0.16 : 0.14),
    height * 0.13,
  );
  const itemWidth = Math.min(
    width * (portrait ? 0.58 : compactLandscape ? 0.30 : 0.30),
    height * (portrait ? 0.37 : compactLandscape ? 0.50 : 0.50),
    portrait ? 230 : 380,
  );
  const sourceWidth = itemWidth * 0.86;
  const spatulaWidth = Math.min(
    width * (portrait ? 0.42 : compactLandscape ? 0.22 : 0.17),
    height * (portrait ? 0.24 : compactLandscape ? 0.45 : 0.30),
    portrait ? 170 : 230,
  );

  return {
    sourceX: width * (portrait ? 0.25 : 0.14),
    sourceY: height * 0.85,
    sourceWidth,
    itemWidth,
    spatulaX: width * (portrait ? 0.77 : 0.86),
    spatulaY: height * 0.84,
    spatulaWidth,
    slots: [
      { id: 'slot-1', x: centerX - dx, y: centerY - dy, hitRadius },
      { id: 'slot-2', x: centerX + dx, y: centerY - dy, hitRadius },
      { id: 'slot-3', x: centerX - dx, y: centerY + dy, hitRadius },
      { id: 'slot-4', x: centerX + dx, y: centerY + dy, hitRadius },
    ],
  };
}
