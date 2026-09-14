# Performance Code Smells

Ordered roughly by how often they cause real problems in browser games.

## Allocation in the hot loop

**Smell:** `new`, object literals, array literals, closures or string concatenation inside `update()`.
**Cost:** garbage collection pauses — the classic "smooth, then a 120 ms hitch every few seconds".
**Fix:** pool objects, reuse vectors, hoist closures out of the loop, avoid per-frame string building.

## No object pooling

**Smell:** bullets, particles, enemies and damage numbers created and destroyed continuously.
**Fix:** preallocate a pool, mark inactive rather than destroying. This is usually the single largest win in an action game.

## Unbounded particle counts

**Smell:** effects spawn per event with no cap.
**Fix:** hard cap total live particles; drop oldest. Effects that look great alone will overlap in the busiest moment, which is exactly when frame time matters most.

## O(n²) collision

**Smell:** nested loops over all entities.
**Fix:** spatial partition — grid, quadtree — or broad-phase bounding checks first. Fine at 20 entities, fatal at 200.

## Synchronous heavy work during play

**Smell:** large JSON parsed, level generated, or assets decoded on the main thread mid-gameplay.
**Fix:** precompute at load, chunk across frames, or move to a worker.

## Mixed DOM reads and writes

**Smell:** reading `offsetWidth` then writing style, in a loop.
**Cost:** forced synchronous layout, once per iteration.
**Fix:** batch all reads, then all writes. Better: keep gameplay UI out of the DOM.

## Repeated asset loading

**Smell:** the same texture or sound requested per spawn.
**Fix:** load once, cache, reference.

## Leaks

**Smell:** entities destroyed but still referenced by an event listener, timer, or an array that is never trimmed.
**Detect:** play 20+ rounds without reloading and watch the heap. Sawtooth returning to baseline is healthy; a staircase is a leak.
**Usual culprits:** listeners not removed, audio nodes created per shot, logs appended forever, particle systems never released.

## No visibilitychange handling

**Smell:** the game keeps simulating and playing audio on a hidden tab.
**Cost:** battery, wasted CPU, and — with ads — audio playing under a fullscreen ad, which is a documented rejection reason.
**Fix:** pause simulation and mute on `visibilitychange`; resume once, and only once, on return.

## Unclamped delta time

**Smell:** `dt` used raw after a tab has been hidden for a minute.
**Cost:** a single enormous step teleports entities through walls.
**Fix:** clamp `dt` to a maximum (~100 ms) and consider a fixed timestep for physics.

## No asset budget

**Smell:** nobody knows the total download size until submission day.
**Fix:** set the budget first, check it in CI, fail the build when it is exceeded.
