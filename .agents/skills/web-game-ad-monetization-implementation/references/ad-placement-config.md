# Ad Placement Config

Do not scatter ad logic across screens, buttons and level scripts. Placements should be named, configurable and testable in one place.

A working config with commentary lives in `reference/ad-manager/src/placements.ts`.

## Config shape

```ts
type PlacementConfig = {
  id: string;
  type: "interstitial" | "rewarded";

  // Player protection — always enforced, on every platform
  naturalBreakRequired: boolean;
  minActiveGameplaySeconds?: number;
  suppressDuringTutorial?: boolean;
  suppressWhenFrustrated?: boolean;
  maxPerSession?: number;
  declineCooldownSeconds?: number;

  // Revenue pacing — skipped when the platform paces ads itself
  cooldownSeconds?: number;
  everyNthOpportunity?: number;

  rewardId?: string;
};
```

The split between the two groups is the important part. Player-protection rules are yours forever. Pacing rules defer to the SDK on CrazyGames, Poki, Yandex and Google H5.

## Starting values

| Placement | Key settings | Reasoning |
|---|---|---|
| Level complete interstitial | `minActiveGameplaySeconds: 90`, `everyNth: 3`, suppress in tutorial | Safest slot; result already seen |
| Game over interstitial | `minActiveGameplaySeconds: 120`, `everyNth: 4`, suppress when frustrated | Closer to quitting than level complete |
| Revive rewarded | `maxPerSession: 3`, `declineCooldown: 120`, suppress when frustrated | Must stay an opportunity, not the way the game is played |
| Double coins rewarded | `maxPerSession: 8`, `declineCooldown: 60` | Highest accept, lowest resentment |
| Ad shop rewarded | `maxPerSession: 12`, no natural break required | Every impression starts with a deliberate click |

Tune against your own decline rate and retention. What matters more than the exact numbers is that they live in one named, testable place.

## Game state the config is evaluated against

```ts
type GameState = {
  isActiveGameplay: boolean;    // an ad here is always a bug
  isAtNaturalBreak: boolean;
  tutorialComplete: boolean;
  activeGameplaySeconds: number; // excludes menus, ads, hidden tab
  isFrustrated: boolean;         // e.g. >= 3 consecutive fails on one level
  isDocumentHidden: boolean;
};
```

`activeGameplaySeconds` must exclude time spent in menus, in ads and on a hidden tab. Counting wall-clock time here is the most common reason a "90 second" gate fires after 20 seconds of actual play.

## Testability

Because placements are data, you can assert on them:

- level 1 never produces an interstitial
- a declined offer is not re-shown within the cooldown
- session caps hold across a simulated session
- every placement refuses during active gameplay

See `reference/ad-manager/test/` for these written out.
