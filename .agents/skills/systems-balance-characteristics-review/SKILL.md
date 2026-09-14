---
name: systems-balance-characteristics-review
description: Use when a system feels unfair, shallow, solved or repetitive — a dominant strategy, runaway leader, unfair randomness, dead choices, too much downtime or busywork. Covers how to measure each of these, not just name them. Use for the rules and numbers of play; for currency and shop pricing use virtual-economy-review.
---

# Systems Balance Characteristics Review

Use this skill when evaluating whether a game system is fair, deep, replayable, and resistant to dominant strategies or boring repetition.

Core idea: a game can be analyzed through structural characteristics that shape how play feels and how strategies emerge.

## Inputs

- Core loop
- Rules
- Win/fail/end conditions
- Player choices
- Random elements
- Hidden information
- Rewards and costs
- Upgrade/progression options
- Possible strategies
- Balance complaints

## Review dimensions

### Basics
Playtime, player count/leaderboard/async, rules clarity, outcomes, ending conditions, sensory feedback.

### Systems
Snowball, catch-up, complexity growth, game arc, strategic balance, strategic collapse.

### Indeterminacy
Randomness, luck vs skill, hidden information.

### Player effort
Costs, rewards, downtime, busywork, reward/effort ratio.

## How to measure each problem

Naming a balance problem is easy and worthless. Each of these has a number attached; get the number before proposing a fix.

### Dominant strategy

**Measure:** pick rate per option, among players who had all options available.

| Pick rate of the top option | Reading |
|---|---|
| Close to 1/n (even split) | Healthy, options are genuinely situational |
| Up to ~40% with 4+ options | Mild preference, usually fine |
| 60–80% | Dominant. Other options are decoration |
| > 80% | Solved. You have one option and some flavour text |

Also check pick rate **by player skill**. If experienced players converge on one option while new players spread out, the game is solved and only the newcomers do not know it yet.

**Fixes in order of preference:** give weak options a situation where they are clearly best → add opportunity cost to the strong one → add diminishing returns → nerf numbers. Nerfing first teaches you nothing about why it dominated.

### Snowball

**Measure:** correlation between position at 25% of the run and final outcome.

- If leading at the quarter mark predicts winning more than ~80% of the time, the remaining 75% of the run is theatre.
- The counter-check: how often does a player who is behind at the halfway mark come back? If it is near zero, there is no catch-up mechanic, only a catch-up story you tell yourself.

**Fixes:** soft caps on compounding advantages, rubber-banding that is visible and fair, shorter runs so a bad one costs less, risk that scales with lead.

### Luck versus skill

**Measure:** outcome variance for the *same* player repeating the *same* content.

- If a strong player's results swing wildly on identical input, randomness is dominating skill.
- The right ratio depends on genre: a puzzle game should be near-deterministic; a roguelike should not be. What matters is that the ratio matches what the game promises. A game that looks skill-based and plays lucky feels like cheating.

**The fairness rule:** randomness before a decision is interesting, randomness after it is unfair. Reveal the die roll, then let the player act on it.

**Fixes:** preview upcoming randomness, give mitigation tools, reduce variance in the first 3 attempts specifically (new players read early bad luck as "this game is unfair"), guarantee recovery paths.

### Downtime and busywork

**Measure:** decisions per minute, and the longest stretch with no decision.

| Longest no-decision stretch | Reading |
|---|---|
| Under 3 seconds | Fine |
| 3–8 seconds | Acceptable if something is happening visually |
| Over 10 seconds | The player is watching, not playing |

Count the **click tax** too: how many inputs are required per meaningful decision? If collecting a reward takes four taps and choosing an upgrade takes one, your interface is spending the player's attention on the wrong thing.

**Fixes:** automate the repeated action, compress it into one input, or attach a real decision to it. If none of those work, delete it.

### Dead choices

**Measure:** how many options have a pick rate under 5%?

Every such option is content you paid to build and maintain that is doing nothing. Either give it a niche where it wins, or cut it — a shorter list of live options reads as deeper than a long list where most entries are traps.

## Why this matters for ads

Balance problems get "fixed" with monetization more often than with design. Watch for it:

- a difficulty spike that appears exactly where a revive offer sits
- randomness tuned so that bad luck is common and a reroll is purchasable
- grind inserted so that a time-skip has something to skip

If you find a balance problem sitting next to an offer that relieves it, resolve the balance problem first, then re-evaluate whether the offer is still needed. See `f2p-monetization-ethics-review` for the manufactured-pain test.

## Output

```md
# Systems Balance Characteristics Review

## Verdict
Pass / Needs Work / Blocker

## Game Characteristics
| Characteristic | Status | Finding | Fix |
|---|---|---|---|
| Playtime | Pass/Risk/Fail |  |  |
| Rules clarity | Pass/Risk/Fail |  |  |
| Outcomes | Pass/Risk/Fail |  |  |
| Snowball/catch-up | Pass/Risk/Fail |  |  |
| Complexity growth | Pass/Risk/Fail |  |  |
| Strategic balance | Pass/Risk/Fail |  |  |
| Randomness | Pass/Risk/Fail |  |  |
| Luck vs skill | Pass/Risk/Fail |  |  |
| Downtime/busywork | Pass/Risk/Fail |  |  |
| Reward/effort ratio | Pass/Risk/Fail |  |  |

## Dominant Strategy Check
- Suspected dominant strategy:
- Why it dominates:
- Fix:

## Reward / Effort Analysis
| Action | Cost | Reward | Ratio | Fix |
|---|---|---|---|---|

## Top Balance Problems
1. **[Severity] Problem**
   - Fix:
   - Trade-off:
   - Validation:
```

## References

Read these alongside this skill:

- [Balance Failure Patterns](references/balance-failure-patterns.md)
- [Luck, Skill, Randomness](references/luck-skill-randomness.md)
