---
name: player-cognition-ux-review
description: Use when players misunderstand the game or drop out early — onboarding, perception, attention, memory load, motivation and usability friction in the first session. Use for why players fail to learn the game; for whether the interface looks right use game-ui-hud-interface-review.
---

# Player Cognition UX Review

Use this skill when reviewing a playable browser game prototype, design brief, gameplay loop, UI flow, onboarding sequence, or early build for a CrazyGames-style web portal.

Method: apply what is known about perception, attention, memory, motivation and learning to the question of why players misunderstand or abandon a game.

## Primary goal

Find why a player may fail to understand, enjoy, learn, or continue playing the game, then propose concrete design changes that reduce friction without weakening the intended challenge.

The review must protect the designer's intent while improving the player's ability to perceive, understand, act, learn, and stay engaged.

## Default assumptions for web portal games

Unless the user says otherwise, assume:

- The game must be understandable within 10 seconds.
- The first meaningful player action should happen as soon as possible.
- The first reward, success signal, or satisfying feedback should happen very early.
- Players may arrive with no context, low patience, and many alternative games one click away.
- Desktop and mobile/touch input should be evaluated separately when relevant.
- Long tutorial text is a last resort; prefer learning by doing, signs, feedback, affordances, and safe first actions.
- Ads, monetization, or meta-progression must not interrupt the player before they have experienced meaningful gameplay.

## Review inputs to request or infer

When possible, inspect or ask for:

- Game genre and target audience.
- One-sentence player fantasy.
- Core verb: move, shoot, merge, draw, dodge, build, collect, upgrade, etc.
- First 60 seconds of gameplay.
- Controls for keyboard/mouse/touch.
- Screenshots or video of UI and onboarding.
- Main fail states and reward states.
- Current analytics events, if any.

If inputs are incomplete, proceed with grounded assumptions and mark them as assumptions.

## Review procedure

### 1. Frame the intended experience

Identify:

- Player fantasy.
- Core verb.
- Core 30-second loop.
- Main emotion: mastery, speed, tension, curiosity, chaos, relaxation, power, humor, etc.
- Intended challenge: execution, timing, planning, spatial reasoning, optimization, exploration, reflex, memory, etc.

If the game has no clear core loop, stop and flag this as a blocker.

### 2. First-session timeline

Evaluate the first minute:

- 0-3 seconds: Is it obvious what the player can do?
- 3-10 seconds: Has the player performed a meaningful action?
- 10-30 seconds: Has the player received feedback, reward, danger, or goal clarity?
- 30-60 seconds: Does the player understand why to continue?

Flag any menu, tutorial, loading, animation, text, reward popup, ad prompt, or ambiguity that delays play.

### 3. Cognitive review

Review these dimensions:

#### Perception

Check whether the player can immediately perceive important objects, affordances, threats, rewards, buttons, exits, states, and spatial relationships.

Look for:

- Low contrast.
- Tiny targets.
- Unclear interactable objects.
- Similar-looking objects with different functions.
- Important UI outside the likely attention area.
- Weak visual hierarchy.
- Ambiguous icons.
- Poor readability.

Preferred fixes:

- Increase contrast or size.
- Group related information.
- Make interactable objects visually distinct.
- Use shape, motion, outline, glow, animation, or spatial placement to guide the eye.
- Test icons without labels; add labels if they fail.

#### Memory

Check whether the game asks the player to remember too much.

Look for:

- Long tutorial instructions.
- Rules explained once and not reinforced.
- Controls hidden after first display.
- Objectives not visible.
- Upgrade effects that cannot be compared.
- Multi-step tasks that rely on memory rather than recognition.

Preferred fixes:

- Keep current goal visible.
- Use reminders.
- Teach one rule at a time.
- Repeat concepts in new contexts.
- Prefer recognition over recall.
- Keep early choices reversible or low-risk.

#### Attention

Check whether attention is guided toward the correct thing at the correct time.

Look for:

- Multiple simultaneous instructions.
- Important signals during combat chaos.
- UI competing with gameplay.
- Tutorial prompts while the player is under pressure.
- Overuse of particles, popups, arrows, or flashing.
- Required multitasking during onboarding.

Preferred fixes:

- Teach during calm moments.
- Use motion or contrast for the next intended action.
- Reduce non-essential signals.
- Do not teach two important things at once.
- Use audio and visual feedback together for critical information.

#### Motivation

Check whether goals and rewards are meaningful.

Look for:

- No clear short-term goal.
- Rewards that do not change future play.
- Progression that feels cosmetic only.
- Too much extrinsic reward before the core play is fun.
- No player choice or agency.
- No feeling of competence improvement.

Preferred fixes:

- Add clear short-term goals.
- Make rewards alter capability, options, status, collection, or strategy.
- Create visible progress.
- Let players make small meaningful choices.
- Support competence, autonomy, and relatedness when applicable.

#### Emotion

Check whether the game produces the intended emotion and avoids unintended frustration.

Look for:

- Unfair damage.
- Unreadable fail causes.
- Weak hit/reward feedback.
- Losses that feel random.
- Controls that feel sluggish.
- Rewards that feel flat.
- Surprise without comprehension.

Preferred fixes:

- Make cause-and-effect obvious.
- Add feedback to success and failure.
- Make danger telegraphed.
- Use anticipation, impact, recovery, and reward beats.
- Remove usability frustration before tuning difficulty.

#### Learning

Check whether the player learns by doing in context.

Look for:

- Passive text tutorials.
- Early punishment for not knowing a rule.
- New mechanic introduced during high pressure.
- No safe sandbox moment.
- Difficulty spike before mastery.
- Mechanics that are introduced but not practiced.

Preferred fixes:

- Introduce one mechanic in a safe situation.
- Ask the player to perform the action immediately.
- Reward correct action.
- Repeat in slightly different contexts.
- Increase difficulty only after demonstrated understanding.
- Avoid punishing the player during first exposure.

### 4. Usability pillars review

Check:

1. Signs and feedback: every action and state must communicate what happened.
2. Clarity: signs and feedback must be perceptible and understandable.
3. Form follows function: objects, icons, and controls should suggest what they do.
4. Consistency: controls, rules, UI, and feedback should behave predictably.
5. Minimum workload: reduce unnecessary cognitive and physical work.
6. Error prevention and recovery: prevent accidental harmful actions and help players recover.
7. Flexibility: support different inputs, skill levels, and play styles where relevant.

### 5. Engage-ability review

Check whether the game supports:

- Competence: player feels they are improving.
- Autonomy: player has meaningful choices or control.
- Relatedness: player can connect with characters, goals, competition, social comparison, or world context when relevant.
- Game feel: actions feel responsive, readable, and satisfying.
- Discovery: novelty, surprise, or unlocks appear at the right pace.
- Flow: challenge is neither too easy nor too hard.
- Learning curve: mechanics are introduced in a digestible order.

### 6. Produce concrete changes

Recommendations must be actionable. Prefer:

- "Move X to Y."
- "Show X only after Y."
- "Replace text tutorial X with interaction Y."
- "Add feedback when X happens."
- "Make object X use visual language Y."
- "Track event X to validate hypothesis Y."

Avoid vague feedback such as "make it more intuitive", "improve UX", "make it juicier", or "increase retention" unless followed by specific implementation steps.

## Severity levels

Use these severities:

- Blocker: likely makes many players quit, fail to start, misunderstand core play, or feel unfairly treated.
- Major: hurts comprehension, learning, or enjoyment but does not fully block play.
- Minor: polish issue, small friction, or improvement opportunity.
- Experiment: plausible improvement that should be tested.

## Output format

Use this exact structure:

```md
# Player Cognition UX Review

## Verdict
Pass / Needs Work / Blocker

## Intended Experience
- Player fantasy:
- Core verb:
- 30-second loop:
- Main emotion:
- Main challenge:

## First 60 Seconds
| Time | What should happen | Risk | Fix |
|---|---|---|---|
| 0-3 sec |  |  |  |
| 3-10 sec |  |  |  |
| 10-30 sec |  |  |  |
| 30-60 sec |  |  |  |

## Top Issues
1. **[Severity] Issue name** — why it matters.
   - Fix:
   - Validation metric:

## Cognitive Findings
### Perception
### Memory
### Attention
### Motivation
### Emotion
### Learning

## Usability Pillars
| Pillar | Status | Notes | Fix |
|---|---|---|---|
| Signs and feedback | Pass / Risk / Fail |  |  |
| Clarity | Pass / Risk / Fail |  |  |
| Form follows function | Pass / Risk / Fail |  |  |
| Consistency | Pass / Risk / Fail |  |  |
| Minimum workload | Pass / Risk / Fail |  |  |
| Error prevention and recovery | Pass / Risk / Fail |  |  |
| Flexibility | Pass / Risk / Fail |  |  |

## Engage-Ability
- Competence:
- Autonomy:
- Relatedness:
- Game feel:
- Discovery / novelty:
- Flow:
- Learning curve:

## Recommended Changes
### Do now
- 

### Do after core feel is good
- 

### Test later
- 

## Analytics / Playtest Plan
- Hypothesis:
- Events to track:
- Watch in playtest:
- Success criteria:
```

## Useful reference files

Load these references when needed:

- `references/cognitive-review-rubric.md`
- `references/first-session-timeline.md`
- `references/playtest-observation-template.md`
