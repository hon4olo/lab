---
name: f2p-monetization-ethics-review
description: Use when judging whether an ad or F2P offer is fair before building it — is the value exchange honest, is the non-ad path still good, is the pain being sold relief from manufactured, is this a dark pattern. Produces a verdict on offers, not implementation. For wiring the SDK calls, use web-game-ad-monetization-implementation instead.
---

# F2P Monetization Ethics Review

Use this skill when designing rewarded ads, optional boosts, revives, bonus rewards, soft currency, upgrades, or progression gates — **before** any of it is implemented.

Core idea: monetization should create fair value exchange without damaging flow, agency, trust, or the non-ad player path.

This skill answers *should we offer this?* The implementation skill answers *how do we wire it correctly?* Run this one first; a perfectly implemented predatory offer is still a predatory offer.

Important: use older F2P literature as foundation only. Validate SDK behaviour, ad policy and privacy rules against current platform documentation.

## The one test that matters

> **Would the player still consider this a fair deal if they could see exactly how it was designed?**

Almost every dark pattern fails that test, and almost nothing legitimate does. A double-coins offer survives full disclosure. A difficulty spike inserted at level 8 specifically to sell revives does not.

## Default portal assumptions

- No ads before meaningful gameplay.
- Rewarded ads are optional and clearly labelled as ads.
- The non-ad path remains genuinely playable, not merely technically possible.
- Declining must not feel like punishment.
- Ads appear at natural breaks.
- No dark patterns.

## Step 1: map every offer

| Field | What to record |
|---|---|
| Placement | Where it appears |
| Player state | Focused / frustrated / victorious / planning / recovering |
| What is asked | 30s ad, currency, a wait |
| What is given | Exact reward, exact amount |
| Optional? | Is there a real alternative, visible at the same moment? |
| Timing | Before or after the player sees what they earned |
| Emotional lever | Loss aversion, greed, curiosity, impatience, relief |

The emotional lever column is where problems become visible. Levers are not inherently wrong — greed ("double your coins") is fine. **Relief from manufactured pain is the one to interrogate.**

## Step 2: the manufactured-pain test

For every offer that relieves a problem, ask: **did we create the problem in order to sell the relief?**

| Pain | Manufactured? | Verdict |
|---|---|---|
| Player died on a genuinely hard level after real progress | No — difficulty is the game | Revive offer is fair |
| Player died to an unavoidable, unreadable hazard | Yes | Fix the level, not the offer |
| Wait timer that exists only to be skipped | Yes | Remove the timer or the offer |
| Level 8 spike inserted after monetization review | Yes | Blocker |
| Inventory full because default capacity is deliberately tiny | Yes | Blocker |
| Currency short because prices were raised after ads shipped | Yes | Blocker |

A useful heuristic: if the offer were removed tomorrow, would the design still make sense on its own terms? If removing the offer would leave an obviously broken game, the offer was propping up a deliberate flaw.

## Step 3: pressure audit

Score each pressure type present. Any single one can be acceptable; three or more stacked on the same moment is coercion.

| Pressure | What it looks like | Acceptable when |
|---|---|---|
| Loss aversion | "You'll lose your 3,400 points" | The loss is real and player-caused |
| Progression slowdown | Earn rate cut so ads look attractive | Never, if the cut was deliberate |
| UI pressure | Ad button dominant, skip quiet | Never — they must match in weight |
| Scarcity / timer | "Offer expires in 10s" | Rarely; never with a fake countdown |
| Difficulty spike | Sudden wall before an offer | Only if the spike is legitimate design |
| Repetition | Same offer after every decline | Never |
| Social | "Your friends are ahead" | Only with genuine, opt-in social features |

Then check the moment: **an offer at peak frustration is coercive even when every individual element is honest.** Emotional state is part of the fairness calculation, not separate from it.

## Step 4: the non-ad path

This is the test most games fail quietly.

- Time the non-ad path to the same milestone. If it is more than **~3× slower**, the ad path is not optional, it is the intended path and everything else is a toll booth.
- Can a player who never watches an ad complete the game? Play it and find out.
- Does the game ever imply the non-ad player is doing something wrong — dimmed rewards, "are you sure?", guilt copy?
- Is the alternative visible at the same moment, at the same size? A skip hidden behind a corner X does not count.

## Step 5: frequency and fatigue

Defaults to hold unless data says otherwise:

- one rewarded offer per decision point, never two stacked
- after a decline, suppress that offer for at least 60–120 seconds
- no more than 3–5 rewarded prompts per 10 minutes outside a player-opened ad shop
- a player-initiated ad shop can be more frequent, because each impression starts with a deliberate click
- never chain ads for one reward
- never auto-open an ad without a click

Watch the accept rate as a health signal in both directions. Below ~10% the reward is not worth the time. **Above ~60% the offer is probably not optional in practice** — check whether progression without it has quietly become unreasonable.

## Step 6: copy honesty

Reward copy must state three things: that it is an ad, exactly what the player receives, and what happens if they skip.

| Bad | Why | Good |
|---|---|---|
| "Free coins" | Not free; costs 30 seconds and attention | "Watch ad: +100 coins" |
| "Continue" (means watch ad) | Mislabels the action | "Watch ad to continue" |
| "Claim" (requires ad) | Implies already earned | "Watch ad to claim 240 coins" |
| "Last chance!!!" (repeats) | False urgency | "Revive once per run" |
| "Skip the wait" (wait is artificial) | Sells manufactured pain | Remove the wait |

## Safer patterns

Double reward after level completion, optional revive after a meaningful failure, bonus chest after a milestone, temporary fun power-up, cosmetic unlock acceleration, extra attempt in a challenge mode, player-opened ad shop.

## Risky patterns

Ad before first gameplay, ad after every fail, ad required to progress, ad reward stronger than the skill reward, ad offer disguised as continue, ad that fixes intentionally painful design, offer repeated after decline, reward that makes normal rewards feel worthless.

## Verdict rules

Mark **Blocker** — do not build — when the offer:

- is required for main progression
- relieves pain that was manufactured to sell it
- hides or de-emphasises the non-ad path
- fires during active gameplay or onboarding
- repeats after a decline within the same decision point
- chains multiple ads for one reward
- grants on an unconfirmed callback

When rejecting, always propose the compliant alternative. "No" without an alternative gets overruled by whoever needs the revenue number.

## Output

```md
# F2P Monetization Ethics Review

## Verdict
Pass / Needs Work / Blocker

## Monetization Map
| Placement | Player state | Ask | Give | Optional? | Emotional lever | Risk | Fix |
|---|---|---|---|---|---|---|---|

## Manufactured-Pain Test
| Offer | Pain relieved | Manufactured? | Evidence | Verdict |
|---|---|---|---|---|

## Pressure Audit
| Pressure | Present? | Stacked with | Risk | Recommendation |
|---|---|---|---|---|
| Loss aversion | Yes/No | | | |
| Progression slowdown | Yes/No | | | |
| UI pressure | Yes/No | | | |
| Scarcity / timer | Yes/No | | | |
| Difficulty spike | Yes/No | | | |
| Repetition | Yes/No | | | |

## Non-Ad Path
- Time to milestone with ads:
- Time to milestone without ads:
- Ratio (flag above 3×):
- Completable without ads: Yes/No
- Alternative visible at equal weight: Yes/No

## Copy Review
| Current label | Problem | Replacement |
|---|---|---|

## Blockers
1.
   - Compliant alternative:

## Metrics to Watch
- rewarded_ad_offer_rate
- rewarded_ad_accept_rate (flag <10% and >60%)
- continue_without_ad_rate
- churn_after_ad_offer
- churn_after_interstitial
- session_length_non_ad_players
- progression_rate_non_ad_players vs ad players
```

## References

Read these alongside this skill:

- [Ad Pressure Audit](references/ad-pressure-audit.md)
- [Rewarded Ads Patterns](references/rewarded-ads-patterns.md)
