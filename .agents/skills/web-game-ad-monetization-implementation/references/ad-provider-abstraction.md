# Ad Provider Abstraction

Use a provider interface so game logic never depends directly on one portal SDK.

A **working, tested implementation of everything below** lives in `reference/ad-manager/`, including adapters for CrazyGames, Poki, Yandex Games and Google H5, plus a scriptable mock. Read that first.

## The interface

```ts
type InterstitialResult =
  | { status: "shown" }
  | { status: "no_fill" }
  | { status: "adblock" }
  | { status: "cooldown" }
  | { status: "error"; error?: unknown };

type RewardedResult =
  | { status: "rewarded" }     // the ONLY status that may grant
  | { status: "closed" }
  | { status: "no_fill" }
  | { status: "adblock" }
  | { status: "error"; error?: unknown };

interface AdProvider {
  readonly name: string;
  init(): Promise<void>;
  showInterstitial(placementId: string): Promise<InterstitialResult>;
  showRewarded(placementId: string): Promise<RewardedResult>;
  isRewardedAvailable?(placementId: string): Promise<boolean>;
  hasAdblock?(): Promise<boolean>;

  /** True when the platform paces interstitials itself. */
  readonly platformControlsInterstitialPacing?: boolean;
}
```

## Rules for adapters

1. **Adapters translate callbacks into a promise. Nothing else.** No pausing, no reward granting, no analytics, no game logic. Those belong in the manager.
2. **Settle exactly once.** Guard with a `settled` flag; SDKs do fire callbacks twice.
3. **Never reject.** Return `{ status: "error" }` instead, so callers do not need try/catch around every call.
4. **Map dismissal correctly per platform.** This is where the money bugs live:

| Platform | Reward on | Dismissal arrives as |
|---|---|---|
| CrazyGames | `adFinished` | `adError` — there is no close callback |
| Poki | `rewardedBreak()` → `true` | → `false` |
| Yandex | `onRewarded` | `onClose(wasShown)` without `onRewarded` |
| Google H5 | `adViewed` / `breakStatus: "viewed"` | `adDismissed` / `"dismissed"` |

5. **Settle on the callback that is guaranteed to fire.** On Google H5 that is `adBreakDone`; settling anywhere else hangs when no ad is preloaded.
6. **Handle a missing SDK.** Return an error result rather than throwing — the game must run locally and on any host.

## Why `platformControlsInterstitialPacing` exists

CrazyGames, Poki, Yandex and Google H5 all throttle interstitials server-side and explicitly ask the game to request at every opportunity. Applying your own cooldown on top only loses revenue.

The flag lets the manager skip **revenue-pacing** rules (cooldown, every-Nth) while always applying **player-protection** rules (active gameplay, natural break, tutorial, minimum playtime, frustration, hidden tab, session caps).

## Always ship a mock

A scriptable `MockAdProvider` is the only practical way to test no-fill, error, dismissal, double-callback and timeout paths. Use it as the default provider in dev builds.
