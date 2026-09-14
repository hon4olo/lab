# Rewarded Ad Patterns

## Good placements

| Pattern | Why it works | Watch out for |
|---|---|---|
| Double the coins just earned | Player sees the exact number being doubled; greed, not relief | Reward must be visible before the offer |
| Revive after a meaningful run | The loss is real and player-caused | Never after a trivial death; never every death |
| Bonus chest after level complete | Positive mood, clear extra | Do not let it dwarf the base reward |
| Optional booster before a hard level | Player understands the challenge first | Not before the player knows the level |
| Player-opened ad shop | Every impression starts with a deliberate click | Still cap it |
| Reroll a daily reward | Low stakes, real choice | Only if the base reward is decent |
| Cosmetic unlock acceleration | No power implications at all | The safest category there is |

## Placements to avoid

| Pattern | Why it fails |
|---|---|
| Ad before first gameplay | Kills first-session retention on a platform with one-click alternatives |
| Ad after every fail | Converts a skill game into an ad game; explicitly disallowed by some portals |
| Required for main progression | Not optional, therefore not a rewarded ad — it is a toll |
| Reward stronger than the best skill reward | Playing becomes the suboptimal strategy |
| Offer disguised as a plain continue | Deceptive trigger; a documented rejection reason |
| Repeated after a decline | Nagging; the answer was already given |
| Chained ads for one reward | Prohibited on every major portal |
| During active gameplay | The button must not appear on a gameplay screen |

## Design rules that hold across all of them

1. **The player sees what they earned before being offered a multiplier of it.** Otherwise they are gambling on an unknown.
2. **The decline path is visible at the same moment, at the same visual weight.**
3. **The offer follows a player action, never a timer.**
4. **One offer per decision point.** Never stack two.
5. **The reward is granted only on a confirmed completion callback.**
6. **Declining costs nothing** — no lost progress, no extra difficulty, no guilt copy.

## Sizing the reward

Compute `ad reward ÷ typical session yield`. Target 0.2–0.5. Below 0.1 nobody takes it; above 1.0 watching beats playing. See `virtual-economy-review` for the full method.

## Health signals

| Signal | Reading |
|---|---|
| Accept rate below ~10% | Reward not worth the time, or the offer arrives at the wrong moment |
| Accept rate above ~60% | Probably not optional in practice — check the non-ad path |
| Decline followed by session end | The offer is arriving at a moment that pushes people out |
| Complete-to-granted below 1:1 | A bug that is silently stealing earned rewards |
