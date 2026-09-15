import type { AssemblyPoint } from '../../game/assembly/AssemblyDefinition';
import {
  dragVisualPosition,
  screenToAssemblyPoint,
  type AssemblyWorkspaceRect,
  type PointerKind,
} from './AssemblyWorkspaceMapper';

export interface BuildStationActions {
  placeIngredient(ingredientId: string, point: AssemblyPoint, rotation: number): void;
  moveIngredient(instanceId: string, point: AssemblyPoint, rotation?: number): void;
  addSauceStroke(ingredientId: string, points: readonly AssemblyPoint[]): void;
}

interface IngredientDrag {
  readonly ingredientId: string;
  readonly instanceId?: string;
  readonly rotation: number;
}

interface SauceGesture {
  readonly ingredientId: string;
  readonly points: AssemblyPoint[];
}

export interface BuildDragPreview {
  readonly target: AssemblyPoint;
  readonly visualX: number;
  readonly visualY: number;
}

export class BuildStationInputSession {
  private ingredientDrag: IngredientDrag | null = null;
  private sauceGesture: SauceGesture | null = null;

  public constructor(
    private readonly actions: BuildStationActions,
    private workspace: AssemblyWorkspaceRect,
  ) {}

  public setWorkspace(workspace: AssemblyWorkspaceRect): void {
    this.workspace = workspace;
  }

  public beginIngredientDrag(ingredientId: string, rotation = 0, instanceId?: string): void {
    this.sauceGesture = null;
    this.ingredientDrag = {
      ingredientId,
      rotation,
      ...(instanceId ? { instanceId } : {}),
    };
  }

  public previewIngredientDrag(
    screenX: number,
    screenY: number,
    pointerKind: PointerKind,
    touchLiftPx = 56,
  ): BuildDragPreview {
    this.requireIngredientDrag();
    const target = screenToAssemblyPoint(this.workspace, screenX, screenY);
    const visual = dragVisualPosition(screenX, screenY, pointerKind, touchLiftPx);
    return { target, visualX: visual.x, visualY: visual.y };
  }

  public dropIngredient(screenX: number, screenY: number): void {
    const drag = this.requireIngredientDrag();
    const point = screenToAssemblyPoint(this.workspace, screenX, screenY);
    if (drag.instanceId) this.actions.moveIngredient(drag.instanceId, point, drag.rotation);
    else this.actions.placeIngredient(drag.ingredientId, point, drag.rotation);
    this.ingredientDrag = null;
  }

  public cancelIngredientDrag(): void {
    this.ingredientDrag = null;
  }

  public beginSauceStroke(ingredientId: string, screenX: number, screenY: number): void {
    this.ingredientDrag = null;
    this.sauceGesture = {
      ingredientId,
      points: [screenToAssemblyPoint(this.workspace, screenX, screenY)],
    };
  }

  public extendSauceStroke(screenX: number, screenY: number): void {
    const gesture = this.requireSauceGesture();
    const point = screenToAssemblyPoint(this.workspace, screenX, screenY);
    const previous = gesture.points.at(-1);
    if (previous && pointDistance(previous, point) < 0.008) return;
    gesture.points.push(point);
  }

  public finishSauceStroke(screenX: number, screenY: number): boolean {
    const gesture = this.requireSauceGesture();
    this.extendSauceStroke(screenX, screenY);
    this.sauceGesture = null;
    if (gesture.points.length < 2) return false;
    this.actions.addSauceStroke(gesture.ingredientId, gesture.points);
    return true;
  }

  public cancelSauceStroke(): void {
    this.sauceGesture = null;
  }

  public isDraggingIngredient(): boolean {
    return this.ingredientDrag !== null;
  }

  public isDrawingSauce(): boolean {
    return this.sauceGesture !== null;
  }

  private requireIngredientDrag(): IngredientDrag {
    if (!this.ingredientDrag) throw new Error('No build ingredient drag is active.');
    return this.ingredientDrag;
  }

  private requireSauceGesture(): SauceGesture {
    if (!this.sauceGesture) throw new Error('No sauce gesture is active.');
    return this.sauceGesture;
  }
}

function pointDistance(left: AssemblyPoint, right: AssemblyPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}
