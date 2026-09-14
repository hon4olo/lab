---
name: multi-lens-design-review
description: Use for a broad design critique when something is wrong but the problem has not been named yet — concept review, prototype critique, feature prioritisation, milestone review. Produces a multi-perspective diagnosis that points to the specialised skill you actually need next.
---

# Multi-Lens Design Review

Use this skill when you need a broad, structured design critique of a game concept, prototype, or production build.

Method: examine the same game through many focused question sets, then look for the contradictions between what each one reveals.

## Core idea

Good game design comes from looking at the same game through many useful perspectives.

A lens is a focused set of questions. No single lens gives the whole truth. The value comes from switching perspectives and finding contradictions, blind spots, and opportunities.

## When to use

Use this skill for:

- Game concept review.
- Prototype critique.
- Feature prioritization.
- Pre-production design review.
- Milestone review.
- “Something is missing but I don’t know what.”
- Preparing a more focused pass for UX, game feel, retention, balance, or publishing.

## Default assumptions for web portal games

Unless told otherwise, assume:

- The game must hook quickly.
- The first playable loop matters more than large feature plans.
- The player may not read instructions.
- The game must work with low commitment and high competition from other games.
- Depth is valuable only after the toy/core loop is satisfying.
- Mobile/touch and desktop should be considered separately when applicable.
- Monetization must not damage trust or flow.

## Review method

### 1. Identify the review stage

Pick one:

- Concept: no playable build yet.
- Toy prototype: core interaction exists.
- Playable prototype: win/fail loop exists.
- Vertical slice: representative content exists.
- Pre-release: content mostly complete.
- Live: metrics and player feedback exist.

Different stages need different lenses. Do not over-apply production lenses to a toy prototype.

### 2. Choose the right lens set

Default web-game lens set:

1. Essential experience
2. Player
3. Toy
4. Core loop
5. Problem solving / goals
6. Meaningful choice
7. Challenge / flow
8. Skill vs chance
9. Reward / punishment
10. Simplicity vs complexity
11. Balance
12. Control / interface / feedback
13. Juiciness
14. Interest curve
15. Surprise / curiosity
16. Theme / resonance
17. World / character, if relevant
18. Playtesting
19. Technology constraints
20. Profit / responsibility

You may add or remove lenses based on the project.

### 3. Run each lens as questions

For each selected lens:

- Ask 3-7 sharp questions.
- Identify evidence from the actual game/design.
- Name the risk.
- Propose a concrete change.
- Mark the severity.

Do not merely list lens names.

### 4. Look for contradictions

Common contradictions:

- The game promises speed but starts with slow menus.
- The fantasy is power but controls feel weak.
- The game is skill-based but outcomes feel random.
- The game wants casual players but onboarding assumes genre knowledge.
- The game wants depth but first-session UI is overloaded.
- Rewards are large but do not change future play.
- The art suggests one function but mechanics do another.
- Monetization rewards patience more than mastery.
- The theme says freedom but levels force one route.

### 5. Convert critique into next actions

Every review should end with:

- Keep: what is already working.
- Cut: what distracts or dilutes.
- Change now: high-confidence fixes.
- Prototype: uncertain but promising ideas.
- Test: questions only players can answer.
- Delay: things not worth doing at current stage.

## Lens prompts

### Essential Experience

Questions:

- What should the player feel?
- What moment best represents the whole game?
- Does every major feature support that feeling?
- What can be removed without damaging the essential experience?

### Player

Questions:

- Who is the player?
- What do they already know?
- What are they likely to misunderstand?
- Why would they choose this game over nearby alternatives?
- What is their first-session patience level?

### Toy

Questions:

- Is the core interaction fun without goals?
- Would the player repeat the action just to feel it?
- What is the simplest toy version of the game?
- Is the toy strong enough before adding progression?

### Core Loop

Questions:

- What does the player do repeatedly?
- What feedback confirms the action?
- What reward or consequence follows?
- What creates the next desire?
- How fast does the loop complete?

### Goals

Questions:

- Is the short-term goal visible?
- Is the medium-term goal motivating?
- Is the long-term goal appropriate for this game size?
- Are goals created by the system, the player, or both?

### Meaningful Choice

Questions:

- What choices matter?
- Are there trade-offs?
- Can the player predict consequences?
- Are choices too obvious, too random, or too similar?
- Do choices create different future play?

### Challenge and Flow

Questions:

- Is the game too easy, too hard, or uneven?
- Does challenge rise after mastery?
- Are failures understandable?
- Are there difficulty spikes?
- Does the player get enough recovery after pressure?

### Skill vs Chance

Questions:

- What outcomes come from skill?
- What outcomes come from chance?
- Does chance create surprise or unfairness?
- Can skilled players manage randomness?
- Is the target audience comfortable with this ratio?

### Reward and Punishment

Questions:

- What is rewarded?
- What is punished?
- Are rewards timely, visible, and meaningful?
- Does punishment teach?
- Are rewards aligned with the intended play style?

### Simplicity vs Complexity

Questions:

- What is the minimum version?
- Which complexity creates depth?
- Which complexity only creates workload?
- What should be hidden until later?
- Can rules be learned through play?

### Balance

Questions:

- Are dominant strategies emerging?
- Are weak options ever useful?
- Are costs proportional to power?
- Does the economy inflate?
- Does the first session feel fair?

### Interface and Feedback

Questions:

- Can the player see what they can do?
- Does every action produce feedback?
- Is the UI transparent enough to support play?
- Are controls consistent?
- Does the interface guide attention?

### Juiciness

Questions:

- Which actions deserve more sensory emphasis?
- Which feedback is missing?
- Which effects create noise?
- Are impact, reward, and failure differentiated?
- Does juice support readability?

### Interest Curve

Questions:

- Where are the peaks?
- Where are the valleys?
- Is the beginning strong?
- Is there anticipation before big moments?
- Does novelty arrive before repetition becomes boredom?
- Does the session end with a reason to continue?

### Surprise and Curiosity

Questions:

- What will the player wonder about?
- What is revealed over time?
- Are surprises understandable after they happen?
- Are surprises connected to player action?
- Is there too much randomness without meaning?

### Theme and Resonance

Questions:

- What is the game really about?
- Do mechanics, art, audio, story, and UI point in the same direction?
- Is there a resonant fantasy?
- Is the theme decoration or does it shape play?

### World and Character

Use only when relevant.

Questions:

- Does the world make the rules easier to understand?
- Does the avatar support player fantasy?
- Do characters have gameplay function?
- Does fiction explain mechanics without extra tutorial burden?

### Playtesting

Questions:

- What must be tested now?
- Who should test it?
- What should be observed silently?
- What question cannot be answered by the team?
- What metric or behavior defines success?

### Technology

Questions:

- Is technology foundational or decorative?
- Does performance support the intended feel?
- Are browser/mobile constraints respected?
- Is the feature feasible enough to prototype?
- Is technical risk hiding design risk?

### Profit and Responsibility

Questions:

- How does the game make money or justify production time?
- Does monetization harm flow or fairness?
- Does the game respect the player?
- Are dark patterns avoided?
- Is the design appropriate for its likely audience?

## Output format

Use this exact structure:

```md
# Multi-Lens Design Review

## Verdict
Pass / Needs Work / Blocker

## Project Stage
Concept / Toy prototype / Playable prototype / Vertical slice / Pre-release / Live

## Essential Experience
The game should make the player feel ___ through ___.

## Selected Lenses
| Lens | Status | Key question | Finding | Action |
|---|---|---|---|---|
| Essential Experience | Pass / Risk / Fail |  |  |  |
| Player | Pass / Risk / Fail |  |  |  |
| Toy | Pass / Risk / Fail |  |  |  |
| Core Loop | Pass / Risk / Fail |  |  |  |
| Goals | Pass / Risk / Fail |  |  |  |
| Meaningful Choice | Pass / Risk / Fail |  |  |  |
| Challenge / Flow | Pass / Risk / Fail |  |  |  |
| Interface / Feedback | Pass / Risk / Fail |  |  |  |
| Interest Curve | Pass / Risk / Fail |  |  |  |

## Top Contradictions
1. **Contradiction:** 
   - Why it matters:
   - Fix:

## Top Design Risks
1. **[Severity] Risk** — why it matters.
   - Fix:
   - Test:

## Keep / Cut / Change
### Keep
- 

### Cut
- 

### Change now
- 

### Prototype
- 

### Test
- 

### Delay
- 

## Next Review
Recommended next specialist skill:
- player-cognition-ux-review / game-feel-juice-pass / experience-engineering-review / analytics / balance / publishing
```

## Reference files

- `references/default-web-game-lenses.md`
- `references/lens-groups.md`
- `references/lens-review-template.md`
