---
name: web-performance-input-qa
description: Use when a browser game loads slowly, stutters, feels unresponsive to input, leaks memory, or performs badly on mobile — and when setting performance budgets before portal submission. Includes concrete target numbers, not just areas to look at.
---

# Web Performance Input QA

Use this skill when a web game feels laggy, loads slowly, stutters, drains memory, performs poorly on mobile, or risks portal rejection due to technical quality.

Source layer: current web performance guidance, Core Web Vitals responsiveness concepts, browser/game runtime best practices.

## Core goal

Protect game feel and retention by keeping loading, input response, frame pacing, memory, and asset delivery under control.

## Inputs

- Engine/framework
- Build URL or code
- Target devices
- Asset sizes
- Initial download size
- Performance profile if available
- Main update loop
- Particle/effects systems
- Audio/texture formats
- Known lag/stutter reports

## Budgets

Set these before optimising. Without a target number, "make it faster" has no end condition.

### Frame budget

| Target | Per-frame budget | Notes |
|---|---|---|
| 60 fps | **16.7 ms** | The standard for anything with real-time input |
| 30 fps | 33.3 ms | Acceptable only for turn-based or slow strategy |

Budget roughly: simulation 40%, rendering 40%, headroom 20%. The headroom is not optional — it absorbs GC pauses and background browser work.

**Measure frame time distribution, not average FPS.** A game running at "60 fps average" with a 120 ms spike every two seconds feels broken while the number looks fine. Track the 95th and 99th percentile frame time; the 99th is what players actually complain about.

Judder rule: any single frame over **50 ms** is visible as a hitch. Any frame over 100 ms is a stutter that will be reported as a bug.

### Input latency

| Path | Target | Notes |
|---|---|---|
| Input event → visible response | under 50 ms | Under 100 ms still feels connected; above that feels laggy |
| Input event → audio response | under 30 ms | Audio latency is noticed sooner than visual |
| Long task blocking the main thread | none over 50 ms during play | A single 200 ms task eats 12 frames |

Respond to `pointerdown` / `keydown`, not `click` / `keyup`. On touch, waiting for `click` adds a delay the player reads as unresponsiveness.

Even one frame of visible feedback — a button press state, a squash, a sound — buys you tolerance for a slower actual action.

### Loading

| Metric | Target for a portal web game | Hard ceiling |
|---|---|---|
| Initial download (compressed) | under 5 MB | Check the platform's own limit; some enforce it |
| Time to first frame | under 3 s on mid-range mobile | 5 s |
| Time to playable | under 10 s | 15 s |
| File count on first load | as low as practical | Many small files cost more than their bytes |

Load only what the first playable moment needs; stream the rest. A loading bar that reaches 100% and then pauses is worse than a slower honest bar — players read the pause as a crash.

### Memory

| Platform | Working set to stay under | Notes |
|---|---|---|
| Mid-range mobile browser | ~200–300 MB | Above this, tabs get evicted mid-session |
| Desktop | more headroom, but leaks still compound | A leak over a 30-minute session is the real risk |

Test by playing 20+ rounds without reloading and watching the heap. A sawtooth that returns to baseline is healthy. A staircase is a leak — the usual culprits are destroyed entities still referenced by an event listener, particle systems that never release, and audio nodes that are created per shot and never disposed.

### Testing device

**Profile on a mid-range Android phone in Chrome, not on your development machine.** A desktop that renders your game at 300 fps tells you nothing about the device most of your traffic comes from. If you only have a desktop, use CPU throttling at 4–6× and network throttling to Fast 3G.

## Audit areas

### Loading

Check:

- Initial download size.
- Number of files.
- Compression.
- Cache headers.
- Lazy loading.
- Loading progress feedback.
- Time to first playable.
- Splash screens that delay gameplay.

### Input responsiveness

Check:

- Input-to-visible-response delay.
- Pointer/touch event handling.
- Keydown vs keyup for actions.
- Main-thread blocking.
- Long tasks.
- Input buffering.
- Mobile touch target size.
- Browser focus issues.

### Frame pacing

Check:

- Stable frame time, not just average FPS.
- Spikes from garbage collection.
- Too many particles.
- Expensive physics.
- Expensive collision checks.
- Per-frame allocations.
- Layout/reflow if DOM UI is used.
- Excessive draw calls.

### Memory

Check:

- Texture/audio memory.
- Object pooling.
- Destroyed objects still referenced.
- Unbounded arrays/logs.
- Particle cleanup.
- Scene transition cleanup.
- Audio nodes cleanup.

### Mobile/browser quirks

Check:

- Audio unlock.
- Orientation/resizing.
- Safe area.
- Tab visibility pause/resume.
- Touch scrolling prevention.
- GPU limits.
- Battery/thermal throttling.

## Code smells

- new objects inside hot update loop
- repeated texture/audio loading
- no object pool for bullets/particles/enemies
- large JSON parsed during gameplay
- synchronous heavy work during active play
- DOM reads/writes mixed per frame
- particles not capped
- collision checks scale O(n²) without partitioning
- no visibilitychange handling
- no asset budget

## Output

```md
# Web Performance Input QA

## Verdict
Pass / Needs Work / Blocker

## Main Risk
-

## Loading
| Check | Status | Finding | Fix |
|---|---|---|---|
| Initial download | Pass/Risk/Fail |  |  |
| File count | Pass/Risk/Fail |  |  |
| Compression/cache | Pass/Risk/Fail |  |  |
| Time to playable | Pass/Risk/Fail |  |  |

## Runtime
| Area | Status | Finding | Fix |
|---|---|---|---|
| Input responsiveness | Pass/Risk/Fail |  |  |
| Frame pacing | Pass/Risk/Fail |  |  |
| Memory | Pass/Risk/Fail |  |  |
| Mobile | Pass/Risk/Fail |  |  |

## Code Hotspots
1.
2.
3.

## Fix Priority
### Do now
-

### Profile next
-

### Nice to have
-

## Measurement Plan
- device:
- browser:
- scenario:
- metrics:
- success threshold:
```

## References

Read these alongside this skill:

- [Mobile Browser QA](references/mobile-browser-qa.md)
- [Performance Code Smells](references/performance-code-smells.md)
