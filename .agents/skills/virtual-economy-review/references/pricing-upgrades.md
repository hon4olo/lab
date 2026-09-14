# Pricing and Upgrade Review

## The curve

```txt
price(n)  = base × multiplier^n        multiplier 1.5 – 2.2
effect(n) = base_effect × n            linear
         or base_effect × n^0.8        diminishing
```

Prices rise geometrically, effects rise linearly or slower. That is what keeps later tiers meaningful without power running away.

| Multiplier | Result |
|---|---|
| Under 1.4 | Late tiers trivially cheap; the ladder collapses |
| 1.5 – 2.2 | Working range for most casual games |
| Over 2.5 | Sudden wall; reads as monetization pressure |

## Payback

For any upgrade that increases earning or survival:

```txt
payback_uses = price ÷ (extra value per use)
```

| Payback | Reading |
|---|---|
| Under 2 uses | Mandatory, not a choice — everyone buys it immediately |
| 2 – 5 uses | Target range |
| Over 8 uses | Engaging with the shop feels like a punishment |

## Sessions per purchase

```txt
sessions_per_purchase = price ÷ session_yield
```

| Value | Use for |
|---|---|
| 0.5 – 1 | First 3–5 upgrades |
| 1 – 3 | Mid game |
| 3 – 8 | One or two aspirational items |
| Over 10 | Almost never in a browser game |

The first purchase must land inside the first session.

## Per-upgrade audit

| Tier | Price | ×prev | Effect | Effect ×prev | Payback | Sessions | Pick rate | Verdict |
|---|---|---|---|---|---|---|---|---|

Red flags in this table:

- effect multiplier greater than price multiplier → buying is always correct, no decision
- pick rate above 60% on one tier → dominant option
- pick rate under 5% → dead option; give it a niche or cut it
- any tier where payback exceeds sessions-to-afford → the player pays twice for the same thing

## Ad rewards

```txt
ad_reward_ratio = ad reward ÷ session yield
```

Target 0.2 – 0.5. Below 0.1 nobody accepts; above 1.0 watching beats playing.

Prefer multiplier rewards ("double your coins") over flat grants — they scale with skill and cannot be farmed at zero effort.

## Sanity questions

1. Can a new player see something they want within 60 seconds?
2. Are there always at least two things worth saving for?
3. Is the most expensive item the most desirable?
4. Does the shop still have something to offer at hour three?
5. If rewarded ads were removed tomorrow, would the pricing still make sense?

A "no" to question 5 means the prices were set around the ads rather than around the game.
