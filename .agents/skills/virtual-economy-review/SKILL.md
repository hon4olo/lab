---
name: virtual-economy-review
description: Use when a web game has coins, gems, upgrades, shops, unlocks, crafting or progression pricing and you need to check the numbers — source/sink balance, upgrade cost curves, payback time, inflation, and whether rewarded-ad currency breaks the progression. Run before wiring rewarded ads that pay out currency.
---

# Virtual Economy Review

Use this skill when a game includes coins, gems, upgrades, shops, unlocks, crafting, trading, scarcity, rewarded currency, or progression pricing.

Core idea: a healthy virtual economy turns player action into scarce resources, then into meaningful choices, power, status, novelty, or expression.

Small web game economy model:

```txt
action -> currency source -> currency stock -> sink/purchase -> new capability -> new action
```

## Why this runs before ad implementation

A rewarded ad that pays currency is **a source whose rate you do not control**. If the economy is already fragile, adding an ad source does not merely inflate it — it converts the game into an ad-watching game, because watching becomes the optimal strategy.

You cannot judge whether "watch an ad for 100 coins" is reasonable until you know what 100 coins buys and how long earning it normally takes.

## Inputs

- All currencies and what each is for
- Every source, with its rate per session
- Every sink, with its price
- Upgrade costs and effect sizes
- Average session length and sessions per day
- Ad reward amounts, if any
- Intended time-to-first-purchase and time-to-max

## Step 1: count your currencies

| Game size | Currencies that work | Warning sign |
|---|---|---|
| Hypercasual / single-session | 1 | A second currency with no distinct purpose |
| Casual with meta-progression | 1 soft + 1 rare/premium | Two soft currencies doing the same job |
| Mid-core web game | 2–3 max | Any currency the player cannot explain |

Every currency must answer: *what can I buy with this that I cannot buy with the other one?* If there is no distinct answer, merge them. Extra currencies are the most common unforced error in small web games — they add UI, tutorial load and confusion without adding a single meaningful choice.

## Step 2: measure the loop before looking at prices

Compute these first:

- **Earn rate** — currency per minute of active play at the player's current skill
- **Session yield** — earn rate × average session length
- **Price ladder** — cost of each upgrade tier
- **Sessions per purchase** — price ÷ session yield

`Sessions per purchase` is what determines how the game feels.

| Sessions per purchase | Player experience | Use for |
|---|---|---|
| < 0.3 | Purchases feel meaningless, shop is noise | Nothing |
| 0.5–1 | Something to buy almost every session | Early game, first 3–5 upgrades |
| 1–3 | Anticipation, planning between sessions | Mid game |
| 3–8 | Aspirational, needs visible progress toward it | Late game, one or two marquee items |
| > 10 | Reads as a paywall, or as impossible | Almost never in a web game |

**The first purchase should land inside the first session.** In a browser game the player has committed to nothing; a shop they cannot use is a shop they will not come back to.

## Step 3: the cost curve

Prices should rise geometrically while effects rise linearly or sub-linearly. That is what keeps later upgrades meaningful without letting power run away.

Practical starting point:

```txt
price(n)  = base × multiplier^n        multiplier between 1.5 and 2.2
effect(n) = base_effect × n            (linear)
         or base_effect × n^0.8        (diminishing)
```

- **Multiplier below 1.4** — late upgrades are trivially affordable, the ladder collapses
- **Multiplier above 2.5** — the wall arrives suddenly and reads as monetization pressure
- **Effect growing faster than price** — buying is always correct, so there is no decision

Then check payback: an upgrade that raises earn rate should pay for itself in **2–5 uses**. Under 2 and it is mandatory rather than a choice. Over 5 and engaging with the shop feels like a punishment.

## Step 4: sources and sinks

| | Early game | Mid game | Late game |
|---|---|---|---|
| Healthy source:sink ratio | ~1:1 | ~1:1.2 | ~1:1.5 |
| Symptom when source-heavy | Currency piles up, shop irrelevant | | Nothing left to want |
| Symptom when sink-heavy | Grind, then quit | | Player stops opening the shop |

**The classic small-game failure is a missing late-game sink.** The player maxes every upgrade in hour three, and the currency they keep earning becomes meaningless — and with it every reward, every ad reward, and the reason to play. Cosmetics, prestige resets and consumables exist mostly to solve this.

Diagnostic: plot median currency balance across the first 20 sessions. It should oscillate. A monotonically rising line means a missing sink. A flat line at zero means starvation.

## Step 5: ad rewards against the economy

For every rewarded offer that pays currency:

```txt
ad_reward_ratio = ad reward ÷ typical session yield
```

| Ratio | Meaning | Verdict |
|---|---|---|
| < 0.1 | Not worth 30 seconds | Players decline; the offer is wasted |
| 0.2–0.5 | Meaningful boost, playing normally still makes sense | **Target range** |
| 0.5–1 | One ad ≈ one session of play | Only for capped, occasional offers |
| > 1 | Watching beats playing | Broken — the ad has replaced the game |

Then run the **dominant-strategy test**: if a player optimises purely for progression, does the optimal path involve playing the game at all? If the answer is "open ad shop, watch, close, repeat", the economy is broken no matter how fair each individual offer looks.

Guardrails that work:

- cap ad-sourced currency at roughly 30–50% of what play yields per session
- prefer multiplier rewards (double your coins) over flat grants — they scale with skill and cannot be farmed at zero effort
- never let an ad reward beat the best gameplay source on a per-minute basis

## Step 6: scarcity and desire

- Does scarcity create anticipation, or just waiting? Waiting without anticipation is grind.
- Is the most expensive item the most desirable? If not, the price ladder does not match the value ladder.
- Can a new player see something they want within 60 seconds? Desire has to precede saving.
- Are there always at least two things worth saving for? One option is not a choice.

## Failure pattern quick reference

| Symptom | Likely cause | Fix |
|---|---|---|
| Players stop opening the shop | Missing sink, or everything already affordable | Add a late-game sink, or steepen the curve |
| Balance rises forever | Sink gap | Cosmetics, consumables, prestige |
| Everyone buys the same upgrade first | Dominant option | Reprice, or rebalance effects |
| Players grind one easy level | Exploitable source | Cap or scale that source |
| Ad accept rate above ~60% | Reward too generous, or progression too slow without it | Recheck `ad_reward_ratio` |
| First purchase only in session 3+ | Early prices too high | Cut the first tier |
| Late upgrades ignored | Effect growth too flat | Steepen effects, or cut tiers |

## Output

```md
# Virtual Economy Review

## Verdict
Pass / Needs Work / Blocker

## Currency Audit
| Currency | Purpose | Distinct from the others? | Verdict |
|---|---|---|---|

## Loop Numbers
- Earn rate per minute:
- Average session length:
- Session yield:
- Time to first purchase:
- Sessions per purchase by tier:

## Cost Curve
| Tier | Price | Multiplier vs previous | Effect | Payback (uses) | Verdict |
|---|---|---|---|---|---|

## Source / Sink Health
| Source | Rate per session | Sink | Price | Tier |
|---|---|---|---|---|
- Source:sink ratio:
- Missing sink:
- Inflation risk:
- Starvation risk:

## Ad Reward Impact
| Offer | Reward | Session yield | Ratio | Verdict |
|---|---|---|---|---|
- Dominant strategy test:
- Guardrails in place:

## Top Problems
1. **[Severity] Problem**
   - Evidence:
   - Fix:

## Metrics to Instrument
- currency_earned_per_session
- currency_spent_per_session
- currency_balance_p50_p90
- time_to_first_purchase
- upgrade_pick_rate / dominant_upgrade_rate
- ad_sourced_currency_share
- churn_at_price_wall
```

## References

Read these alongside this skill:

- [Pricing and Upgrade Review](references/pricing-upgrades.md)
- [Sources and Sinks](references/sources-sinks-template.md)
