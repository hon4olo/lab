import type { AssemblyPoint } from '../../game/assembly/AssemblyDefinition';

export interface AssemblyWorkspaceRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
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
  pointerKind: 'mouse' | 'touch' | 'pen',
  touchOffsetPx = 56,
): { readonly x: number; readonly y: number } {
  return pointerKind === 'touch'
    ? { x: screenX, y: screenY - touchOffsetPx }
    : { x: screenX, y: screenY };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Workspace coordinates must be finite.');
  return Math.min(1, Math.max(0, value));
}
