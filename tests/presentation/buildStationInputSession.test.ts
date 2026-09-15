import { describe, expect, it } from 'vitest';
import { BuildStationInputSession } from '../../src/presentation/stations/BuildStationInputSession';

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
});
