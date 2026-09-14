---
name: web-game-ad-monetization-implementation
description: Use when actually building or fixing ad code in a web game — choosing placements, writing SDK calls, handling pause/resume, no-fill, errors and reward validation, or debugging ads that fire at the wrong moment. Covers CrazyGames, Poki, Yandex Games and Google H5. For judging whether an offer is fair rather than how to wire it, use f2p-monetization-ethics-review instead.
---

# Web Game Ad Monetization Implementation

Use this skill when a web game needs ad monetization implementation or QA, especially:

- interstitial / midgame ads
- rewarded video ads
- revive offers
- coin multipliers
- bonus chests
- ad-supported retries
- ad buttons in shop, upgrade, level-end, pause, or game-over screens
- platform SDK integration for CrazyGames, Poki, Yandex Games, Google H5 Ad Placement API, GameDistribution, or similar web game portals

## Main rule

Do not irritate the player. Earn by placing ads where they feel natural, optional, and fairly rewarded.

Never add ads before understanding the core loop. Ads must be based on gameplay rhythm, player intent, and the economy, not on random timers alone.

## Current docs rule

Before implementing platform-specific ad calls, check the official documentation for the target platform.

The platform sections below were verified on **2026-08-02** against:

- [CrazyGames — Video ads](https://docs.crazygames.com/sdk/video-ads/) and [Advertisement requirements](https://docs.crazygames.com/requirements/ads/)
- [Poki — SDK documentation](https://sdk.poki.com/sdk-documentation)
- [Yandex Games — Advertising](https://yandex.com/dev/games/doc/en/sdk/sdk-adv)
- [Google — Ad Placement API `adBreak()`](https://developers.google.com/ad-placement/apis/adbreak)

Re-read them before submission. If official docs conflict with this skill, official docs win.

## Working reference implementation

`reference/ad-manager/` in this repository is a tested implementation of every contract below: placement gating, the pause/resume lifecycle, reward validation, and adapters for all four platforms. 31 tests, no dependencies, `npm test`.

Read it before writing your own — or copy it and adapt. When this skill and that code disagree, the code has tests and this file does not.

## Relationship to other skills

Run before this skill when possible:

- `experience-engineering-review` to understand the core loop and emotional rhythm.
- `virtual-economy-review` if rewards/currency/upgrades exist.
- `f2p-monetization-ethics-review` to check value exchange and player trust.

Run after this skill when possible:

- `analytics-retention-instrumentation` to validate funnels.
- `portal-publish-readiness` or platform-specific publish readiness.

## Required workflow before implementing ads

### 1. Identify the core loop

Describe the loop in this format:

```txt
Player action -> risk/challenge -> result -> reward -> upgrade/unlock -> next attempt
```

### 2. Identify natural breaks

Find moments where player control is already paused or the player expects a transition:

- game over
- level complete
- boss defeated
- world transition
- return to menu
- retry confirmation
- shop opened from menu
- after collecting level rewards
- after a long gameplay segment
- after tutorial completion

Never treat active gameplay as a break.

### 3. Identify emotional state

For every possible ad placement, label the player state:

- focused
- frustrated
- victorious
- curious
- upgrading
- recovering after failure
- planning next run
- impatient

Ads are safest when the player is victorious, planning, or already in a menu.

Ads are riskiest when the player is focused, frustrated, in tutorial, or about to act.

### 4. Identify economy pressure

Map the economy:

- soft currency sources
- soft currency sinks
- upgrade prices
- progression gates
- fail/retry cost
- reward pacing
- reward inflation risk
- whether ad rewards can break balance

Rewarded ads should speed up progress, not replace the game.

### 5. Create an ad placement map

Output:

```md
| Placement | Ad type | Player state | Trigger | Reward/value | Risk | Decision |
|---|---|---|---|---|---|---|
```

Only implement placements marked as low or medium irritation risk.

## Config-first placement system

Do not hardcode ad logic directly inside screens, buttons, or level scripts.

Create an ad placement configuration layer. Example structure:

```ts
type AdPlacementConfig = {
  id: string;
  type: "interstitial" | "rewarded";
  naturalBreakRequired: boolean;
  minActiveGameplaySeconds?: number;
  cooldownSeconds?: number;
  everyNthOpportunity?: number;
  maxOffersPerSession?: number;
  suppressDuringTutorial?: boolean;
  suppressAfterRepeatedDeaths?: boolean;
  rewardId?: string;
};

const adPlacements: Record<string, AdPlacementConfig> = {
  levelCompleteInterstitial: {
    id: "level_complete_interstitial",
    type: "interstitial",
    naturalBreakRequired: true,
    minActiveGameplaySeconds: 90,
    cooldownSeconds: 120,
    everyNthOpportunity: 3,
    suppressDuringTutorial: true
  },

  reviveRewarded: {
    id: "revive_rewarded",
    type: "rewarded",
    naturalBreakRequired: true,
    maxOffersPerSession: 3,
    suppressDuringTutorial: true,
    suppressAfterRepeatedDeaths: true,
    rewardId: "revive_50_hp"
  }
};
```

The exact code style may vary by engine, but the principle must remain: placements are named, configurable, testable, and not scattered.

## Ad provider abstraction

Prefer a provider interface so the game is not tightly coupled to one portal SDK.

Example:

```ts
type AdResult =
  | { status: "shown" }
  | { status: "no_fill" }
  | { status: "error"; error?: unknown };

type RewardedAdResult =
  | { status: "rewarded" }
  | { status: "closed" }
  | { status: "no_fill" }
  | { status: "error"; error?: unknown };

interface AdProvider {
  showInterstitial(placementId: string): Promise<AdResult>;
  showRewarded(placementId: string): Promise<RewardedAdResult>;
  isRewardedAvailable?(placementId: string): Promise<boolean>;
}
```

Recommended providers:

- `CrazyGamesAdProvider`
- `PokiAdProvider`
- `YandexAdProvider`
- `GoogleH5AdProvider`
- `GameDistributionAdProvider`
- `MockAdProvider` for local development and tests

## Interstitial ads

Interstitial ads are non-rewarded fullscreen ads. They are allowed only at natural breaks.

### Interstitial goal

The player should feel:

```txt
The round ended. A short ad break happened. Now I continue.
```

The player should never feel:

```txt
The game stole control from me.
```

### Good interstitial placements

Prefer:

- after level complete, before next level
- after game over, before retry or menu
- after returning from gameplay to main menu
- after finishing a long run
- after a world/map transition
- after tutorial completion, not during tutorial
- after a meaningful session milestone

Use with caution:

- pause menu, only after explicit player action and not every pause
- shop entry, only if not blocking urgent post-level spending
- after very short failed runs, only with cooldowns and frequency caps

Avoid:

- during active controls
- before the player sees their result
- before granting earned gameplay rewards
- immediately after app/game load unless required or controlled by platform
- during onboarding/tutorial steps
- before the first meaningful play session
- after every death
- when the player is trying to close a modal
- while audio, physics, or timers continue running

### Interstitial frequency defaults

First, determine who paces the ads. This is the single most misunderstood part of web game ad integration.

**All four major portals pace interstitials themselves.** CrazyGames, Poki, Yandex Games and Google H5 all throttle server-side and explicitly want a request at every valid opportunity:

- CrazyGames: "Request midgame ads at opportune moments without worrying about frequency or minimum intervals." The SDK caps at roughly one midgame ad per 3 minutes, accounting for preroll and rewarded ads, and silently ignores requests that arrive too early (`adCooldown`).
- Poki: "Not every single `commercialBreak()` will trigger an ad; Poki's system will determine when a user is ready, so you can signal as many commercial break opportunities as possible." A `rewardedBreak()` resets the commercial timer.
- Yandex: interstitial frequency is controlled by the platform. Rewarded video may be called as often as you like.
- Google H5: applies its own frequency capping and reports `frequencyCapped` in `breakStatus`.

**On these platforms, adding your own cooldown on top only loses revenue.** Withholding a request does not improve the player experience — the SDK would have declined it anyway, silently and for free.

So split your rules in two:

**Player-protection gates — always yours, never delegated:**

- never during active gameplay
- never before the player has completed one meaningful gameplay segment
- never during the tutorial
- never before the player sees a result they earned
- never while the tab is hidden
- suppress after rage states: 3+ consecutive deaths on the same level, rapid retry spam, tutorial confusion
- respect a session cap so a long session does not become an ad session

**Revenue-pacing knobs — delegate when the platform paces:**

- minimum seconds between interstitials
- every-Nth-transition rules
- first-ad delay beyond the "one meaningful segment" rule

If you ship on a platform that does *not* pace for you, or you use a direct ad network, apply these defaults yourself:

- no interstitial in the first 45–90 seconds of active play
- minimum 120–180 seconds between interstitials
- every 2–4 level transitions, not every transition
- do not show interstitials after every round when rounds are shorter than ~30 seconds

Encode this distinction in code rather than in comments. In `reference/ad-manager/`, providers expose `platformControlsInterstitialPacing`, and the manager skips only the revenue knobs when it is true — the protection gates always run.

### Interstitial implementation contract

Before showing:

- freeze gameplay state
- pause physics
- pause timers
- disable input
- mute or pause audio
- save current screen/state
- block duplicate ad calls
- mark `adShowing = true`
- send analytics event `interstitial_opportunity`

During ad:

- do not run gameplay simulation
- do not advance timers
- do not spawn enemies
- do not count down boosters
- do not accept gameplay input

After close, finish, error, or no-fill:

- set `adShowing = false`
- restore audio state
- restore input
- resume timers only if the game should continue
- continue the transition even if no ad was shown
- never trap the player on a loading/ad screen
- send appropriate analytics event

### Interstitial decision algorithm

```txt
IF current moment is active gameplay
  THEN do not show interstitial

IF tutorial is incomplete
  THEN do not show interstitial unless platform requires startup ads

IF player has not completed at least one meaningful gameplay segment
  THEN do not show interstitial

IF cooldown is active
  THEN do not show interstitial

IF player is in high frustration state
  THEN skip or delay interstitial

IF moment is level complete, game over, retry, next level, or menu transition
  THEN interstitial may be valid

Always resume game flow on ad error or no fill.
```

## Rewarded ads

Rewarded ads are optional ads that give a clear benefit after successful completion.

### Rewarded goal

The player should feel:

```txt
I chose this because the reward helps me right now.
```

The player should never feel:

```txt
The game forced me to watch an ad to progress.
```

### Rewarded ad rules

Rewarded ads must be:

- opt-in
- clearly labeled as ads
- attached to a specific visible reward
- available only after player action
- cancellable with a normal non-ad path
- granted only after verified rewarded/success/finished callback

The non-ad option must be visible immediately. Do not hide it behind timers, tiny text, low contrast, or confusing wording.

### Good rewarded placements

Prefer:

- revive after death
- double or triple coins on level result screen
- bonus chest after level complete
- optional booster before a level
- retry with an extra life
- reroll daily reward
- temporary helper power-up
- skip a wait timer if the game has timers
- unlock cosmetic preview
- claim extra spin after using the free spin

Use with caution:

- shop currency offers
- upgrade discount offers
- level skip offers
- difficulty bypass offers

Avoid:

- required main progression
- forced tutorial completion
- core reward replacement
- making normal rewards feel worthless
- repeated popup offers after every click
- showing a rewarded button during active gameplay
- chaining multiple ads for one promised reward
- granting rewards after ad error, no fill, or early close
- using ambiguous labels like “Free” without “Ad”

### Rewarded offer psychology

Use ethical motivation, not dark patterns.

Good psychological fit:

- offer revive immediately after a meaningful failure, not after trivial instant death
- offer multiplier after the player sees earned coins first
- offer booster before a hard level when the player understands the challenge
- offer bonus chest after victory, when player mood is positive
- offer “save streak” only if streak has real meaning and a non-ad alternative exists

Bad psychological fit:

- punishing the player until they watch
- showing ads to fix intentionally bad balance
- making failure recovery impossible without ads
- hiding earned rewards behind an ad
- repeating the same offer after rejection

Reward copy must state:

1. that this is an ad
2. exactly what the player receives
3. what happens if they skip

Good copy:

- “Watch ad to revive with 50% health”
- “Watch ad: double your 240 coins”
- “Watch ad for one bonus chest”
- “No thanks, continue”

Bad copy:

- “Free coins”
- “Continue” when it means watch ad
- “Claim” when reward requires ad
- “Last chance!!!” used repeatedly

### Rewarded frequency defaults

- do not show more than one rewarded popup at the same decision point
- if the player rejects an offer, do not show the same offer again immediately
- cap repeated rewarded prompts in short sessions
- avoid more than 3-5 rewarded prompts per 10 minutes unless user actively opens an ad shop
- always show disabled/loading/no-fill states honestly
- do not call rewarded ads automatically without player clicking the ad offer

Player-initiated ad shops can have more frequent rewarded opportunities, but each click must still be explicit and honest.

### Rewarded implementation contract

Before showing the offer:

- compute the exact reward
- show the exact reward in UI
- show a clear skip path
- verify ad availability if SDK supports it
- disable the button while loading/showing
- prevent double-click duplicate rewards
- send analytics event `rewarded_ad_offer`

Before launching the ad:

- pause gameplay
- pause timers
- disable input
- mute or pause audio
- store pending reward as `pendingReward`
- mark reward as not yet granted
- send analytics event `rewarded_ad_accept`

On success/rewarded/finished callback:

- grant exactly the promised reward
- persist the reward if needed
- show confirmation feedback
- clear `pendingReward`
- resume the correct game state
- send analytics events `rewarded_ad_complete` and `reward_granted`

On close without reward, error, blocked ad, or no-fill:

- do not grant the reward
- show a short fallback message
- restore controls
- resume the correct game state
- optionally offer a non-ad fallback if balance requires it
- send `rewarded_ad_closed`, `rewarded_ad_error`, or `rewarded_ad_no_fill`

Never grant a reward in a generic `closed` callback unless the platform explicitly says that callback means reward earned.

## Analytics event taxonomy

Minimum events:

- `ad_placement_opportunity`
- `interstitial_opportunity`
- `interstitial_start`
- `interstitial_complete`
- `interstitial_error`
- `interstitial_no_fill`
- `rewarded_ad_offer`
- `rewarded_ad_accept`
- `rewarded_ad_decline`
- `rewarded_ad_start`
- `rewarded_ad_complete`
- `rewarded_ad_closed`
- `rewarded_ad_error`
- `rewarded_ad_no_fill`
- `reward_granted`
- `reward_blocked`
- `continue_without_ad`
- `churn_after_ad_offer`, derived from session behavior
- `churn_after_interstitial`, derived from session behavior

Recommended properties:

- `placement_id`
- `ad_type`
- `screen`
- `level`
- `run_id`
- `session_time`
- `active_gameplay_time`
- `reward_id`
- `reward_amount`
- `provider`
- `platform`
- `game_version`
- `device_type`
- `player_state`
- `cooldown_remaining`
- `reason_skipped`

Critical distinction:

```txt
ad offer != ad start != ad completion != reward granted
```

Do not merge these events.

## Platform policy adapter

Before implementation, detect the target platform and use its official SDK behavior.

### Reward-signal cheat sheet

Getting this table wrong is the most expensive bug in ad integration: it either grants rewards for ads nobody watched, or silently withholds rewards people earned.

| Platform | Grant the reward on | Dismissal arrives as | Never grant on |
|---|---|---|---|
| CrazyGames | `adFinished` | `adError` — there is no separate close callback | any `adError` |
| Poki | `rewardedBreak()` resolves `true` | resolves `false` | `false`, rejection |
| Yandex Games | `onRewarded` | `onClose(wasShown)` with no prior `onRewarded` | `onClose` alone, `onError` |
| Google H5 | `adViewed`, or `breakStatus: "viewed"` | `adDismissed`, `breakStatus: "dismissed"` | `adBreakDone` alone |

### CrazyGames

```js
window.CrazyGames.SDK.ad.requestAd("midgame", {   // or "rewarded"
  adStarted:  () => { pauseGame(); muteAudio(); },
  adFinished: () => { resumeGame(); unmuteAudio(); /* rewarded: grant here */ },
  adError:    (e) => { resumeGame(); unmuteAudio(); /* never grant */ },
});
```

Platform-specific rules that will get a build rejected:

- **There is no "user closed the ad" callback.** A dismissed rewarded ad arrives as `adError`. Code that rewards on "not an error" rewards on dismissal.
- Error codes: `unfilled`, `adblock`, `adCooldown`, `adsDisabledBasicLaunch`, `other`.
- Mute only when the ad actually starts (`adStarted`), not when it is requested — a request may return nothing, and muting music with no visible change confuses players.
- Block the UI from the request until `adFinished` or `adError`. A request is not instantaneous; auctions take time.
- The skip button must match the ad button in size, font and colour. Hiding or delaying it is not allowed.
- **Do not combine a midgame ad between levels with a rewarded "keep playing" offer for the same transition.** Pick one.
- Do not fire a midgame ad on a navigational button — main menu, settings, shop.
- Handle adblock: players with adblockers must still be able to play. You may gate cosmetic extras, but show a notice explaining why, do not use popups, and never leave a rewarded button clickable but dead.
- During the Basic Launch phase ads are disabled entirely. The game must not freeze between levels and must not show rewarded buttons that do nothing.
- In-game banners: only on screens shown for 5+ seconds on average, maximum 2 per screen, never during gameplay, never blocking UI at any size.
- The Unity SDK pauses the game for you. The HTML5 SDK does not — you must pause yourself.

### Poki

```js
await PokiSDK.init();
PokiSDK.gameLoadingFinished();

// Bracket every gameplay segment:
PokiSDK.gameplayStart();
PokiSDK.gameplayStop();

// Non-rewarded break. The callback fires only if an ad will actually show.
PokiSDK.commercialBreak(() => pauseAndMute())
  .then(() => { resumeGame(); });

// Rewarded. `withReward` is the only reward signal.
PokiSDK.rewardedBreak(() => pauseAndMute())
  .then((withReward) => {
    if (withReward) grantReward();
    else continueWithoutReward();
  });
```

Platform-specific notes:

- `gameplayStart()` / `gameplayStop()` must wrap gameplay segments. Poki uses them for pacing and load-to-play measurement, so wrong bracketing degrades ad timing.
- Exception: for an ad that does not interrupt play — unlocking a skin from a menu, for example — do not fire `gameplayStop()` / `gameplayStart()`.
- Both break functions resolve even when no ad played. There is no "was it shown" flag for commercial breaks; the start callback firing is your best proxy.
- Use the Poki Inspector to test SDK event order before submitting.

### Yandex Games

```js
ysdk.adv.showFullscreenAdv({
  callbacks: {
    onOpen:  () => pauseAndMute(),
    onClose: (wasShown) => { resumeGame(); /* wasShown === false means nothing played */ },
    onError: (e) => resumeGame(),
  },
});

ysdk.adv.showRewardedVideo({
  callbacks: {
    onOpen:     () => pauseAndMute(),
    onRewarded: () => grantReward(),     // the ONLY reward signal
    onClose:    (wasShown) => resumeGame(),
    onError:    (e) => resumeGame(),
  },
});
```

Platform-specific notes:

- `onClose` fires on close, on error, *and* when the ad failed to open because it was called too frequently. `wasShown` is how you tell a real impression from a no-op.
- Rewarded video may be called as often as you like; interstitial frequency is platform-controlled.
- **Yandex counts accidental clicks during gameplay as ad fraud and reduces your revenue.** Their docs call out `setInterval(() => ysdk.adv.showFullscreenAdv(), 180000)` as the canonical wrong implementation. Never fire on a timer during play.
- Sticky banners are configured in the Developer Console; SDK control requires enabling the API option there first.

### Google H5 Ad Placement API

```js
adConfig({ preloadAdBreaks: "on" });   // without this the first break will not fill

adBreak({
  type: "next",                        // preroll | start | pause | next | browse | reward
  name: "level_complete",
  beforeAd: () => pauseAndMute(),      // must be synchronous
  afterAd:  () => resumeGame(),
  adBreakDone: (info) => log(info.breakStatus),
});

adBreak({
  type: "reward",
  name: "revive",
  beforeReward: (showAdFn) => showOfferUi(showAdFn),  // fires only if an ad exists
  adViewed:    () => grantReward(),                    // the reward signal
  adDismissed: () => continueWithoutReward(),
  adBreakDone: (info) => log(info.breakStatus),
});
```

Platform-specific notes:

- **`adBreakDone` is the only callback guaranteed to fire.** Settle your promise there or you will hang forever when no ad is preloaded.
- `breakStatus` values: `notReady`, `timeout`, `invalid`, `error`, `noAdPreloaded`, `frequencyCapped`, `ignored`, `other`, `dismissed`, `viewed`.
- `ignored` means the player never clicked your reward prompt before the next break — a UI problem, not an ad problem.
- `beforeAd` must be synchronous; the ad displays immediately after it returns.
- `adBreakDone` runs *after* `afterAd`, so it fires after your game has already resumed. If work must happen before resume, move it out of `afterAd`.
- Only one `preroll` placement per page load; later ones fail with `invalid`.

## Output format

When asked to analyze or implement ads, produce this output:

```md
# Web Game Ad Monetization Implementation

## Core Loop Analysis
Player action -> risk/challenge -> result -> reward -> upgrade/unlock -> next attempt

## Player-State Map
| Moment | Player state | Ad risk | Note |
|---|---|---|---|

## Economy Impact
- Currency sources:
- Currency sinks:
- Reward inflation risk:
- Non-ad path quality:

## Interstitial Plan
### Accepted placements
-

### Rejected placements
-

### Cooldowns / frequency caps
-

### Platform-specific notes
-

## Rewarded Plan
### Accepted offers
-

### Rejected offers
-

### Reward amounts
-

### No-fill fallback
-

### Platform-specific notes
-

## Implementation Changes
- Files to change:
- Ad provider/adapter:
- Placement config:
- UI states:
- Analytics:
- Save/pause/resume:

## Risk Checklist
-

## QA Matrix
-

## Test Plan
-
```

Do not implement ad calls before providing the placement rationale.

## Worked example

A complete pass, so the expected depth is unambiguous. Match this level of specificity.

**Brief:** *Rooftop Dash* — endless runner, one-touch jump, coins during the run, upgrade shop between runs (magnet, shield, coin multiplier). Average run 35 seconds; runs 1–3 are shorter, ~15 seconds. Target platform CrazyGames, desktop and mobile.

### Core Loop Analysis

```txt
tap to jump -> dodge obstacles / collect coins -> crash -> see score + coins ->
spend coins on upgrades -> longer run next time
```

Loop length is the dominant constraint: at 35 seconds per run, "an ad after every game over" means an ad every 40 seconds. That is unshippable regardless of what the SDK permits.

### Player-State Map

| Moment | Player state | Ad risk | Note |
|---|---|---|---|
| Mid-run | focused | **Fatal** | One-touch game; any overlay is a lost run and a rage quit |
| Crash, score counting up | curious | High | Player is watching their number. Do not interrupt the count |
| Score settled, coins granted | recovering | **Low** | The safe window. Result seen, reward banked |
| Shop open | planning | Low | Player chose to be here, tolerant of an offer |
| Tap to retry | impatient | High | Player has already committed to the next run |
| Runs 1–3 | learning | **Fatal** | No ads at all before the game is understood |

### Economy Impact

- Currency sources: coins during run (~40/run at start), level-up bonus
- Currency sinks: three upgrade tracks, 150 → 400 → 900 → 2000 coins
- Reward inflation risk: **high.** A doubling offer after every run is worth ~40 coins, which is 27% of the first upgrade. Offered every run, the shop empties in 12 runs and the progression loop dies
- Non-ad path quality: first upgrade in ~4 runs without ads. Acceptable

### Interstitial Plan

**Accepted:**

- `game_over_interstitial` — after score settles and coins are banked, before the retry screen becomes interactive. Gated on `activeGameplaySeconds >= 120` and not frustrated

**Rejected:**

- After every game over — 35-second runs make this an ad every 40 seconds
- On shop open — the shop is where coins get spent; an ad tax on spending suppresses the sink and CrazyGames forbids ads on navigational buttons
- Preroll before first run — kills first-session retention on a game whose hook is immediacy

**Cooldowns / frequency caps:** none of our own. CrazyGames paces midgame ads at ~1 per 3 minutes and ignores early requests. We request at every qualifying game over and let the SDK decide.

**Platform-specific notes:** request via `requestAd("midgame", ...)`. Pause on `adStarted`, resume on both `adFinished` and `adError`. Because we also offer a revive rewarded ad on the game-over screen, we must not do both for the same death — CrazyGames forbids combining a midgame ad with a "keep playing" rewarded offer at the same transition. Resolution: if the revive offer is shown and declined, skip the interstitial for that death.

### Rewarded Plan

**Accepted:**

| Offer | Trigger | Reward | Why it works |
|---|---|---|---|
| `revive_rewarded` | After a crash on a run above the player's median distance | Continue from crash point | Loss aversion is real but the loss is real too — the player earned that distance |
| `double_coins_rewarded` | After coin count finishes animating | 2× this run's coins | Player sees the exact number being doubled |
| `ad_shop_rewarded` | Player opens the shop and taps "Free coins" | 100 coins | Fully player-initiated |

**Rejected:**

- Revive on every crash — CrazyGames explicitly forbids offering out-of-lives ads on every death, and it converts a skill game into an ad game
- Ad-gated upgrade tiers — makes the shop feel like a paywall
- Pre-run booster offer — interrupts the tap-to-play immediacy that is the entire hook

**Reward amounts:** revive is free distance, no coins, so it cannot inflate the economy. Double-coins capped at 8 per session; at ~40 coins/run that is at most 320 bonus coins, under one upgrade tier. Ad shop capped at 12.

**No-fill fallback:** "No ad available right now — here are 20 coins instead." Small, once per session, so a no-fill is not experienced as punishment.

**Platform-specific notes:** reward on `adFinished` only. A dismissed rewarded ad on CrazyGames arrives as `adError`, so a "grant unless error" implementation would grant on dismissal.

### Implementation Changes

- Files to change: `src/game/GameOverScreen.ts`, `src/game/Shop.ts`, `src/main.ts`
- Ad provider/adapter: `CrazyGamesAdProvider` from `reference/ad-manager/`
- Placement config: 4 placements in `placements.ts`
- UI states: revive offer with matched-weight buttons, loading state on the ad button, no-fill notice, reward confirmation
- Analytics: full offer → accept → complete → granted chain per placement
- Save/pause/resume: `AdHooks` wired to the existing pause system; verify `visibilitychange` does not double-resume

### Risk Checklist

- Short runs make frequency the primary risk — mitigated by delegating pacing to the SDK plus a 120s minimum playtime gate
- Revive and interstitial colliding on the same death — mitigated by the exclusivity rule above
- Coin doubling inflating the economy — mitigated by the session cap
- Mobile: the revive offer must not sit under the thumb that was just tapping to jump

### QA Matrix

| Scenario | Expected |
|---|---|
| Crash during run 1 | No ad of any kind |
| Crash at 130s active play | Interstitial requested; SDK may decline |
| Two crashes 30s apart | Second request ignored by SDK; game continues without stutter |
| Revive offered, declined | No interstitial for that death; restart immediately |
| Revive accepted, ad completes | Player continues from crash point |
| Revive accepted, player closes ad early | No revive, clear message, restart |
| Revive accepted, no fill | No revive, 20-coin consolation, restart |
| Adblock enabled | Game fully playable; rewarded buttons hidden, not dead |
| Tab hidden mid-ad, returned | Audio restored once, game resumes once, no double reward |
| Double-tap the revive button | One ad request, one reward |

## Rejection rules

Reject or redesign the request if it asks to:

- force rewarded ads for required progression
- hide the non-ad path
- show ads during active gameplay
- fake close buttons
- grant rewards without confirmed success
- chain ads for one reward
- disguise ads as normal gameplay buttons
- break platform rules
- keep gameplay/audio running during fullscreen ads
- block the player after no-fill/error

When rejecting, propose a compliant alternative.

## Final checklist

Before finishing implementation, verify:

- interstitials are only at natural breaks
- rewarded ads are opt-in
- rewards are clear and fair
- skip path exists
- no reward is granted on error/no-fill
- gameplay and audio pause during fullscreen ads
- game resumes on all callbacks
- cooldowns and caps exist
- no duplicate calls or duplicate rewards
- UI states are tested
- analytics are added
- platform-specific callbacks are handled correctly
- official platform docs were checked

If any item fails, do not ship.

## References

Read these alongside this skill:

- [Ad Analytics Events](references/ad-analytics-events.md)
- [Ad Placement Config](references/ad-placement-config.md)
- [Ad Provider Abstraction](references/ad-provider-abstraction.md)
- [Ad QA Matrix](references/ad-qa-matrix.md)
- [Platform Docs Reminder](references/platform-docs-reminder.md)
