import type { AssemblyPoint } from '../../game/assembly/AssemblyDefinition';

export interface AssemblyWorkspaceRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type PointerKind = 'mouse' | 'touch' | 'pen';

export interface BuildShelfSlot {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly row: number;
  readonly column: number;
}

export interface BuildShelfLayout {
  readonly slotSize: number;
  readonly rowGap: number;
  readonly columns: number;
  readonly rows: number;
  readonly slots: readonly BuildShelfSlot[];
}

export function screenToAssemblyPoint(
  rect: AssemblyWorkspaceRect,
  screenX: number,
  screenY: number,
): AssemblyPoint {
  if (rect.width <= 0 || rect.height <= 0) throw new Error('Assembly workspace must have positive dimensions.');
  return {
    x: clamp01((screenX - rect.x) / rect.width),
    y: clamp01((screenY - rect.y) / rect.height),
  };
}

export function assemblyPointToScreen(
  rect: AssemblyWorkspaceRect,
  point: AssemblyPoint,
): { readonly x: number; readonly y: number } {
  if (rect.width <= 0 || rect.height <= 0) throw new Error('Assembly workspace must have positive dimensions.');
  return {
    x: rect.x + clamp01(point.x) * rect.width,
    y: rect.y + clamp01(point.y) * rect.height,
  };
}

/**
 * Touch visuals can be rendered above the finger while preserving the domain drop point.
 * This helper affects presentation only; never persist the visual offset into FoodAssemblySnapshot.
 */
export function dragVisualPosition(
  screenX: number,
  screenY: number,
  pointerKind: PointerKind,
  touchOffsetPx = 56,
): { readonly x: number; readonly y: number } {
  return pointerKind === 'touch'
    ? { x: screenX, y: screenY - touchOffsetPx }
    : { x: screenX, y: screenY };
}

/**
 * Keep the tool rail in a predictable band outside the canonical work surface.
 * Portrait gets one compact row: a two-row shelf would put its second row in
 * the same bottom action band as the Finish Build CTA on 360x640.
 */
export function calculateBuildShelfLayout(
  screenWidth: number,
  screenHeight: number,
  workspace: AssemblyWorkspaceRect,
  toolCount: number,
): BuildShelfLayout {
  if (toolCount <= 0) {
    return { slotSize: 0, rowGap: 0, columns: 0, rows: 0, slots: [] };
  }

  const portrait = screenHeight > screenWidth * 1.1;
  const rows = 1;
  const columns = toolCount;
  const availableWidth = portrait ? screenWidth * 0.98 : Math.min(screenWidth * 0.74, 760);
  const cellWidth = Math.min(portrait ? 64 : screenWidth < 960 ? 90 : 104, availableWidth / columns);
  const slotSize = portrait
    ? Math.max(54, Math.min(62, cellWidth * 0.94))
    : Math.max(72, Math.min(104, cellWidth * 0.90));
  const rowGap = 0;
  const centeredStartX = screenWidth / 2 - ((columns - 1) * cellWidth) / 2;
  // The wide action button is authored on the right rail. Keep every tool
  // hit rectangle to its left on compact landscape, where the rail cannot
  // afford a second row. Portrait avoids the same band vertically.
  const actionSafeRight = portrait
    ? Number.POSITIVE_INFINITY
    : screenWidth * 0.84 - Math.min(screenWidth * 0.20, 220) / 2 - 12;
  const centeredRight = centeredStartX + (columns - 1) * cellWidth + slotSize / 2;
  const startX = Math.max(
    slotSize / 2 + 8,
    centeredStartX + Math.min(0, actionSafeRight - centeredRight),
  );
  const anchoredY = workspace.y + workspace.height + slotSize * 0.52;
  const maxY = screenHeight - slotSize * 0.78;
  const baseY = Math.min(maxY, anchoredY);
  const slots = Array.from({ length: toolCount }, (_, index) => ({
    x: startX + index * cellWidth,
    y: baseY,
    size: slotSize,
    row: 0,
    column: index,
  }));

  return { slotSize, rowGap, columns, rows, slots };
}

/** Shared authored sizing for the large, physical Build Station sprites. */
export function buildIngredientDisplayWidth(
  recipeId: string,
  ingredientId: string,
  workspaceWidth: number,
): number {
  const visual = recipeId === 'recipe.cheesy-street-hot-dog'
    ? HOTDOG_BUILD_WIDTHS[ingredientId]
    : BURGER_BUILD_WIDTHS[ingredientId];
  if (!visual) return Math.min(workspaceWidth * 0.52, 380);
  return Math.min(workspaceWidth * visual.widthRatio, visual.maxWidth);
}

interface BuildWidthSpec {
  readonly widthRatio: number;
  readonly maxWidth: number;
}

const BURGER_BUILD_WIDTHS: Readonly<Record<string, BuildWidthSpec>> = {
  'ingredient.bun-bottom': { widthRatio: 0.60, maxWidth: 460 },
  'ingredient.patty': { widthRatio: 0.56, maxWidth: 430 },
  'ingredient.cheese': { widthRatio: 0.58, maxWidth: 445 },
  'ingredient.extra-spicy': { widthRatio: 0.12, maxWidth: 92 },
  'ingredient.bun-top': { widthRatio: 0.60, maxWidth: 460 },
};

const HOTDOG_BUILD_WIDTHS: Readonly<Record<string, BuildWidthSpec>> = {
  'ingredient.hotdog-bun': { widthRatio: 0.70, maxWidth: 560 },
  'ingredient.sausage': { widthRatio: 0.58, maxWidth: 470 },
  'ingredient.hotdog-cheese': { widthRatio: 0.58, maxWidth: 470 },
  'ingredient.pickle': { widthRatio: 0.13, maxWidth: 96 },
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Workspace coordinates must be finite.');
  return Math.min(1, Math.max(0, value));
}
