# Sources and Sinks Template

## Fill this in before touching any price

### Sources — where currency enters

| Source | Amount | Frequency | Per session | Player-controlled? | Exploitable? |
|---|---|---|---|---|---|
| Coins during play | | | | | |
| Level completion bonus | | | | | |
| Daily reward | | | | | |
| Rewarded ad | | | | | |
| Achievement / milestone | | | | | |

**Total inflow per session:**

### Sinks — where currency leaves

| Sink | Price | Repeatable? | Tier | Sessions to afford |
|---|---|---|---|---|
| Upgrade tier 1 | | | early | |
| Upgrade tier 2 | | | early | |
| Upgrade tier 3 | | | mid | |
| Consumable | | | any | |
| Cosmetic | | | late | |

**Total outflow available:**

## Health checks

| Check | Target | Yours |
|---|---|---|
| Source : sink ratio, early game | ~1 : 1 | |
| Source : sink ratio, late game | ~1 : 1.5 | |
| Time to first purchase | within session 1 | |
| Ad-sourced share of inflow | under 30–50% | |
| Late-game sink exists | yes | |

## The balance curve

Plot median currency balance across the first 20 sessions.

| Shape | Diagnosis | Fix |
|---|---|---|
| Oscillating around a level | Healthy | — |
| Rising monotonically | Missing sink | Add cosmetics, consumables or prestige |
| Flat at zero | Starvation | Raise sources or cut early prices |
| Spikes then flat at zero | One big sink, nothing after | Add mid-tier sinks |
| Rising after hour 3 | Player has maxed out | Add a late-game sink before this point |

## The missing-sink test

Ask: what does a player who has bought everything do with the coins they keep earning?

If the answer is "nothing", every reward after that point — including every ad reward — is worthless, and the player will notice within a session. This is the single most common economy failure in small web games.
