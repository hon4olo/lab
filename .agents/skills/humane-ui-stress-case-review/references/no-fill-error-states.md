# Ad No-Fill and Error States

No-fill is not an edge case. Fill rates are never 100%, and on desktop with adblockers they can be much lower. Every rewarded offer will fail for some players on some days — design for it as a normal path, not an exception.

## The rules

1. **Never grant the reward** unless the SDK confirmed completion. Not on close, not on error, not on no-fill, not on a thrown exception.
2. **Never trap the player.** Every failure path ends with them back in control and the game running.
3. **Explain briefly, then move on.** One short line. No modal stack, no error code, no apology paragraph.
4. **Do not blame the player**, and do not accuse them over their adblocker.
5. **Log it.** `rewarded_ad_no_fill`, `rewarded_ad_error` and `reward_blocked` are how you discover that a "reward not granted" complaint is really a fill problem.

## State by state

| Status | Message | Then |
|---|---|---|
| No fill | "No ad available right now. Continuing without the bonus." | Resume immediately |
| Error | "Ad couldn't load. Your progress is safe — keep playing." | Resume immediately |
| Closed early | "The ad didn't finish, so no reward was given. You can try again." | Resume; re-offer later, never instantly |
| Adblock | "Ads are blocked, so bonus rewards are unavailable. The full game still works." | Hide rewarded buttons rather than leaving them dead |
| Cooldown | "Available again in 1:20" | Show the timer on the button itself |

## Consolation rewards

A small fallback turns a no-fill from a disappointment into a neutral moment: "No ad available — here are 20 coins instead."

If you do this:

- keep it clearly smaller than the ad reward, or the ad becomes pointless
- cap it per session, or it becomes a farm
- offer it only after a *failed* ad, never after a *declined* one — otherwise declining becomes the optimal play

## Testing

You cannot verify any of this against a live ad network that mostly succeeds. Use a mock provider that forces each outcome on demand:

- no fill
- error
- closed before completion
- reward callback fired twice
- tab hidden mid-ad, then restored
- button double-clicked
- provider never calls back at all

The last one is the most commonly missed. Decide what your timeout is and what happens when it fires — silence is a failure mode too.

A working example of exactly this harness lives in `reference/ad-manager/`.
