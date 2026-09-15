import { describe, expect, it } from 'vitest';
import { evaluateAssembly } from '../../src/game/assembly/AssemblyEvaluation';
import { AssemblySession } from '../../src/game/assembly/AssemblySession';
import type { AssemblyDefinition } from '../../src/game/assembly/AssemblyDefinition';

const BURGER_ASSEMBLY: AssemblyDefinition = {
  id: 'assembly.test-burger',
  workspaceAspectRatio: 1.4,
  rules: [
    { ingredientId: 'bottom', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5 },
    { ingredientId: 'patty', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5 },
    { ingredientId: 'cheese', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, allowRotation: true },
    { ingredientId: 'chili', mode: 'piece', minCount: 0, maxCount: 3, targetX: 0.5, targetSpread: 0.4 },
    { ingredientId: 'sauce', mode: 'sauce', minCount: 1, maxCount: 2, targetX: 0.5, targetSpread: 0.5 },
    { ingredientId: 'top', mode: 'layer', minCount: 1, maxCount: 1, targetX: 0.5, allowRotation: true },
  ],
};

describe('AssemblySession', () => {
  it('records player-authored layer positions, rotation, pieces, and sauce paths deterministically', () => {
    const session = new AssemblySession(BURGER_ASSEMBLY);
    session.placeIngredient('bottom', { x: 0.5, y: 0.82 });
    session.placeIngredient('patty', { x: 0.46, y: 0.68 });
    session.placeIngredient('cheese', { x: 0.55, y: 0.57 }, 12);
    session.placeIngredient('chili', { x: 0.32, y: 0.48 }, -18);
    session.placeIngredient('chili', { x: 0.68, y: 0.48 }, 22);
    session.addSauceStroke('sauce', [
      { x: 0.25, y: 0.43 },
      { x: 0.5, y: 0.4 },
      { x: 0.75, y: 0.43 },
    ]);
    session.placeIngredient('top', { x: 0.51, y: 0.3 }, -4);

    const snapshot = session.snapshot();
    expect(snapshot.placements.map((placement) => placement.ingredientId)).toEqual([
      'bottom', 'patty', 'cheese', 'chili', 'chili', 'top',
    ]);
    expect(snapshot.sauceStrokes[0]?.points).toHaveLength(3);
    expect(session.isComplete()).toBe(true);
    expect(evaluateAssembly(BURGER_ASSEMBLY, snapshot).total).toBeGreaterThanOrEqual(90);
  });

  it('clamps pointer coordinates and rejects invalid placement modes/capacity', () => {
    const session = new AssemblySession(BURGER_ASSEMBLY);
    const bottom = session.placeIngredient('bottom', { x: -2, y: 4 });
    expect(bottom).toMatchObject({ x: 0, y: 1 });
    expect(() => session.placeIngredient('bottom', { x: 0.5, y: 0.8 })).toThrow(/limit/);
    expect(() => session.placeIngredient('sauce', { x: 0.5, y: 0.5 })).toThrow(/sauce stroke/);
    expect(() => session.addSauceStroke('cheese', [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toThrow(/not authored as a sauce/);
  });

  it('keeps poor spatial assembly distinct from ingredient completeness', () => {
    const session = new AssemblySession(BURGER_ASSEMBLY);
    session.placeIngredient('top', { x: 0.95, y: 0.2 }, 35);
    session.placeIngredient('cheese', { x: 0.05, y: 0.4 }, -30);
    session.placeIngredient('patty', { x: 0.9, y: 0.6 });
    session.addSauceStroke('sauce', [{ x: 0.9, y: 0.4 }, { x: 0.98, y: 0.41 }]);
    session.placeIngredient('bottom', { x: 0.1, y: 0.8 });

    const result = evaluateAssembly(BURGER_ASSEMBLY, session.snapshot());
    expect(result.completeness).toBe(100);
    expect(result.layerOrder).toBeLessThan(100);
    expect(result.centering).toBeLessThan(50);
    expect(result.total).toBeLessThan(80);
  });
});
