import { describe, expect, it } from 'vitest';
import { BuildStationInputSession } from '../../src/presentation/stations/BuildStationInputSession';
import { buildIngredientDisplayWidth, calculateBuildShelfLayout } from '../../src/presentation/stations/AssemblyWorkspaceMapper';
import { calculateOrderLayout, finalizeOrderLayout } from '../../src/presentation/order/orderLayout';
import { createStationPresentation } from '../../src/presentation/order/stationPresentation';

const workspace = { x: 100, y: 50, width: 800, height: 500 };

describe('BuildStationInputSession', () => {
  it('drops a dragged ingredient using normalized workspace coordinates', () => {
    const calls: unknown[] = [];
    const input = new BuildStationInputSession({
      placeIngredient: (...args) => calls.push(['place', ...args]),
      moveIngredient: (...args) => calls.push(['move', ...args]),
      addSauceStroke: (...args) => calls.push(['sauce', ...args]),
    }, workspace);

    input.beginIngredientDrag('ingredient.cheese', 12);
    expect(input.previewIngredientDrag(500, 300, 'touch', 60)).toEqual({
      target: { x: 0.5, y: 0.5 },
      visualX: 500,
      visualY: 240,
    });
    input.dropIngredient(500, 300);

    expect(calls).toEqual([
      ['place', 'ingredient.cheese', { x: 0.5, y: 0.5 }, 12],
    ]);
    expect(input.isDraggingIngredient()).toBe(false);
  });

  it('moves an existing ingredient instead of creating a duplicate', () => {
    const calls: unknown[] = [];
    const input = new BuildStationInputSession({
      placeIngredient: (...args) => calls.push(['place', ...args]),
      moveIngredient: (...args) => calls.push(['move', ...args]),
      addSauceStroke: (...args) => calls.push(['sauce', ...args]),
    }, workspace);

    input.beginIngredientDrag('ingredient.bun-top', 0, 'ingredient.bun-top#0');
    input.dropIngredient(740, 200);

    expect(calls).toEqual([
      ['move', 'ingredient.bun-top#0', { x: 0.8, y: 0.3 }, 0],
    ]);
  });

  it('records a sauce gesture as normalized points and ignores tiny pointer jitter', () => {
    const calls: unknown[] = [];
    const input = new BuildStationInputSession({
      placeIngredient: (...args) => calls.push(['place', ...args]),
      moveIngredient: (...args) => calls.push(['move', ...args]),
      addSauceStroke: (...args) => calls.push(['sauce', ...args]),
    }, workspace);

    input.beginSauceStroke('ingredient.sauce', 260, 250);
    input.extendSauceStroke(262, 251);
    input.extendSauceStroke(500, 250);
    expect(input.finishSauceStroke(740, 250)).toBe(true);

    expect(calls).toEqual([
      ['sauce', 'ingredient.sauce', [
        { x: 0.2, y: 0.4 },
        { x: 0.5, y: 0.4 },
        { x: 0.8, y: 0.4 },
      ]],
    ]);
    expect(input.isDrawingSauce()).toBe(false);
  });

  it('keeps a portrait shelf in one bottom row clear of the Finish Build action band', () => {
    const layout = finalizeOrderLayout(calculateOrderLayout(360, 640));
    const presentation = createStationPresentation(layout, 'build');
    const buildWorkspace = {
      x: presentation.workspaceX - presentation.workspaceWidth * 0.39,
      y: presentation.workspaceY - presentation.workspaceHeight * 0.34,
      width: presentation.workspaceWidth * 0.78,
      height: presentation.workspaceHeight * 0.48,
    };
    const shelf = calculateBuildShelfLayout(360, 640, buildWorkspace, 6);
    const shelfBottom = Math.max(...shelf.slots.map((slot) => slot.y + slot.size / 2));
    const actionTop = layout.actionY - layout.actionHeight / 2;

    expect(shelf.rows).toBe(1);
    expect(shelf.slots).toHaveLength(6);
    expect(shelfBottom).toBeLessThan(actionTop);
  });

  it.each([
    [844, 390],
    [1280, 720],
    [1440, 900],
    [360, 640],
  ])('keeps Build tool hit rectangles separate from the action CTA at %sx%s', (width, height) => {
    const layout = finalizeOrderLayout(calculateOrderLayout(width, height));
    const presentation = createStationPresentation(layout, 'build');
    const workspaceWidth = presentation.workspaceWidth * (layout.wide ? 0.62 : 0.78);
    const workspaceHeight = presentation.workspaceHeight * (layout.wide ? 0.56 : 0.48);
    const centerY = presentation.workspaceY - presentation.workspaceHeight * (layout.wide ? 0.06 : 0.10);
    const workspace = {
      x: presentation.workspaceX - workspaceWidth / 2,
      y: centerY - workspaceHeight / 2,
      width: workspaceWidth,
      height: workspaceHeight,
    };
    const shelf = calculateBuildShelfLayout(width, height, workspace, 6);
    const action = {
      left: layout.actionX - layout.actionWidth / 2,
      right: layout.actionX + layout.actionWidth / 2,
      top: layout.actionY - layout.actionHeight / 2,
      bottom: layout.actionY + layout.actionHeight / 2,
    };

    for (const slot of shelf.slots) {
      const intersects = slot.x - slot.size / 2 < action.right
        && slot.x + slot.size / 2 > action.left
        && slot.y - slot.size / 2 < action.bottom
        && slot.y + slot.size / 2 > action.top;
      expect(intersects, `Build shelf slot at ${slot.x},${slot.y} overlaps CTA`).toBe(false);
    }
  });

  it('authors large recipe-aware placement widths while keeping small repeated pieces readable', () => {
    expect(buildIngredientDisplayWidth('recipe.hot-cheese-burger', 'ingredient.bun-bottom', 700)).toBe(420);
    expect(buildIngredientDisplayWidth('recipe.cheesy-street-hot-dog', 'ingredient.hotdog-bun', 700)).toBeCloseTo(490);
    expect(buildIngredientDisplayWidth('recipe.hot-cheese-burger', 'ingredient.extra-spicy', 700)).toBe(84);
    expect(buildIngredientDisplayWidth('recipe.cheesy-street-hot-dog', 'ingredient.pickle', 700)).toBeCloseTo(91);
  });
});
