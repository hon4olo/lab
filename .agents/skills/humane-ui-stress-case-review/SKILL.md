---
name: humane-ui-stress-case-review
description: Use when writing or reviewing what the game says at bad moments — game over, ad no-fill, rewarded ad failed, reward not granted, lost progress, not enough currency, failed purchase, repeated deaths. Includes ready-to-use replacement microcopy. Use when the words are the problem; for layout and hierarchy use game-ui-hud-interface-review.
---

# Humane UI Stress Case Review

Use this skill when a game has stressful UI moments: failure, loss, game over, ad no-fill, rewarded ad error, failed purchase, lost progress, missing save, repeated deaths, insufficient currency, confusing login, support messages, or any moment where cheerful UX can feel insulting.

Method: design for the moments the player is having a bad time, not the happy path — and treat those moments as the ones that define what the product actually cares about.

## Core rule

Stress cases are not edge cases. They define who and what the design cares about. Game UI must remain clear, specific, and helpful when the player is frustrated, confused, disappointed, impatient, or vulnerable.

## Inputs

- Failure/game-over screens
- Error messages
- Ad no-fill/error flows
- Rewarded ad declined/failed states
- Insufficient currency UI
- Lost progress/save UI
- Purchase/shop errors
- Tutorial confusion
- Support/contact flow
- Any cute or jokey microcopy

## Review procedure

### 1. Identify stress moments

Repeated deaths, trivial instant death, unclear failure reason, fail after long run, ad no-fill, reward not granted, player declines ad and feels punished, insufficient currency, purchase failed, progress not saved, lost connection, stutter during critical moment, tutorial blocks player, popup overload.

### 2. Check tone

Avoid tone that can feel dismissive: “Oopsie!”, “You failed again!”, “Last chance!!!”, “Too bad!”, “Free reward!” when it is an ad, jokes during loss/payment/error/repeated frustration.

Prefer plain explanation, next action, recovery path, ownership if the system failed, and no blame.

### 3. Check context and intent

Every message should explain: What happened? Why did it happen, if known? What can the player do now? Was anything lost? Can they continue without ad/payment? How can they recover?

### 4. Check non-ideal paths

Include ad unavailable, ad closed early, offline, insufficient currency, failed save, tutorial confusion, small screen, distracted/impatient player, accessibility constraints.

### 5. Test under cognitive load

Test after repeated failures, with sound off, on a small screen, under time pressure, or after a small distraction task. Ask what the player thinks happened and what they would do next.

## Copy library

Use these directly. Each follows the same shape: **what happened → what it means for you → what you can do now**, with no blame and no cheerfulness.

### Ad failures

| Situation | Do not say | Say |
|---|---|---|
| No ad available | "Oops! Something went wrong!" | "No ad available right now. Continuing without the bonus." |
| Ad closed early | "You didn't watch the whole ad!" | "The ad didn't finish, so no reward was given. You can try again." |
| Ad error mid-play | "Error 4032" | "Ad couldn't load. Your progress is safe — keep playing." |
| Adblock detected | "Turn off your adblocker to play!" | "Ads are blocked, so bonus rewards are unavailable. The full game still works." |
| Reward already claimed | "Nice try!" | "You've already claimed this one. Next chance after the level." |
| Offer unavailable (cooldown) | disabled button, no reason | "Available again in 1:20" |

The adblock line matters: portals require the game to stay playable with an adblocker, and accusatory copy here reads as a shakedown.

### Progress and saves

| Situation | Do not say | Say |
|---|---|---|
| Save failed | "Failed to save." | "We couldn't save your progress this time. Your current run still counts — we'll try again at the next level." |
| Progress lost | "Your data was reset." | "We couldn't recover your last session. Your unlocks are still here; the current run was lost." |
| Offline | "No internet connection!" | "You're offline. You can keep playing; scores will sync when you reconnect." |

When the system failed, say "we", not "you". Taking ownership of a system failure is the cheapest trust you will ever buy.

### Economy and failure

| Situation | Do not say | Say |
|---|---|---|
| Not enough currency | "Insufficient funds" | "You need 40 more coins. Finish a level to earn about 60." |
| Purchase failed | "Transaction error" | "The purchase didn't go through and you weren't charged. You can try again." |
| Repeated deaths (4th+) | "You failed again!" | "That one's tough. The shield upgrade helps here." — offer help, not commentary |
| Trivial instant death | "Game over!" with fanfare | Restart instantly with no screen at all. A death screen for a 2-second run is an insult |
| Long run lost | jokey copy | "3,412 metres — your best yet." Lead with what they achieved |

### Tone rules

- **No jokes during loss, error or payment.** Humour lands as mockery when the reader is annoyed.
- **No exclamation marks in failure states.** Enthusiasm about someone's bad moment reads as gloating.
- **Never "Oops".** It is the sound of a system that does not know what went wrong.
- **Say the number.** "40 more coins" beats "not enough coins" because it tells the player how close they are.
- **Never make declining feel like a mistake.** "No thanks, continue" — not "Skip reward", not "I don't want to get stronger".

### The read-it-aloud test

Read each message out loud as if you were speaking to someone who just lost twenty minutes of progress. Anything that would make you wince in person will make them wince on screen.

## Output format

```md
# Humane UI Stress Case Review

## Verdict
Pass / Needs Work / Blocker

## Stress Moments
| Moment | Player state | Current UI/microcopy | Risk | Fix |
|---|---|---|---|---|

## Tone Audit
- Too cute:
- Too vague:
- Too blaming:
- Too pushy:
- Better copy:

## Recovery Paths
| Failure | Can recover? | Clear next step? | Fix |
|---|---|---|---|

## Ad / Monetization Stress
- No-fill state:
- Reward missing state:
- Decline path:
- Non-ad path:
- Pressure risk:

## Top Problems
1. **[Severity] Problem**
   - Why it hurts trust:
   - Fix:
   - Validation:

## Better Microcopy
| Situation | Replace this | With this |
|---|---|---|

## Stress Test Plan
-
```

## References

Read these alongside this skill:

- [Humane Microcopy Rules](references/microcopy-rules.md)
- [Ad No-Fill and Error States](references/no-fill-error-states.md)
- [Stress Case Inventory](references/stress-case-inventory.md)
