---
name: portal-publish-readiness
description: Use as the final gate before submitting a browser game to a web game portal (CrazyGames, Poki, Yandex Games, GameDistribution). Checks SDK integration, ad compliance, technical limits, loading, controls, save/pause/focus, mobile readiness and likely rejection reasons. Run after the ad implementation is done, not instead of it.
---

# Portal Publish Readiness

Use this skill before submitting or updating a web game on CrazyGames, Poki, Yandex Games, GameDistribution or a similar portal.

Source layer: platform requirement documentation, verified 2026-08-02. Always re-check current docs before final submission — requirements change more often than SDK method names do.

Rejection is usually not about game quality. It is about a short list of mechanical failures that a reviewer can spot in 90 seconds. This skill front-loads those.

## Core goal

Find blockers that could cause rejection, poor player experience, broken monetization, or portal underperformance.

## Inputs

- Build URL or project code
- Game engine/framework
- Target devices: desktop, mobile, both
- SDK integration status
- Ad placements
- Loading flow
- Controls
- Save/progress system
- Audio/pause/focus handling
- Build size/assets
- Console errors
- First 60 seconds of gameplay

## Review areas

### 1. Submission requirements

Check:

- Game has meaningful gameplay.
- Game quality is high enough for public portal players.
- No inappropriate, broken, misleading, or subpar content.
- No login/account gate before play unless required and justified.
- Game is playable without external installs.

### 2. SDK integration

Check:

- SDK is initialized correctly.
- Game loading and gameplay events are reported when required.
- Ads are requested through the platform SDK.
- SDK calls are not spammed.
- Errors are handled gracefully.
- Game works in portal iframe/context.

### 3. Ads

Check:

- Only allowed ad types are used.
- Ads are not shown before reasonable gameplay.
- Midgame ads happen only at natural breaks: death, level complete, stage transition.
- Rewarded ads are user-initiated and tied to a clear reward.
- Player can continue without rewarded ad.
- No ad button is disguised as gameplay/continue.
- Frequency does not destroy flow.

### 4. Technical readiness

Check:

- Total build size and initial download size fit current portal limits.
- File count is not excessive.
- Loading screen is clear and not stuck.
- Game handles slow network.
- No fatal console errors.
- Game does not leak memory during sessions.
- Frame pacing is acceptable on target devices.
- Browser tab focus lost/resume is handled.
- Audio unlock/mute works on mobile.

### 5. Gameplay readiness

Check:

- First meaningful action happens quickly.
- First reward or clear feedback happens quickly.
- Controls are understandable without long text.
- Game has enough content/variation.
- Failures are fair and explained.
- UI is readable.
- Game works at common aspect ratios.

### 6. Mobile/desktop readiness

Check:

- Desktop controls are clear.
- Touch controls are large and forgiving.
- No hover-only UI on mobile.
- Canvas/layout resizes correctly.
- Orientation expectations are clear.
- No tiny buttons near unsafe edges.
- Performance is acceptable on mobile.

## Instant-rejection triggers

Check these first. Each one is a documented reason a build gets bounced, and each takes under a minute to verify.

### Ads

- An ad fires while the player has control. Fatal on every portal.
- An ad fires on a navigational button — main menu, settings, shop entry.
- The game or its audio keeps running under a fullscreen ad.
- The UI is not blocked between the ad *request* and the `adFinished`/`adError` result. The request is not instantaneous; a player who can click during it will.
- A reward is granted on an error, no-fill or early close.
- The skip / "no thanks" option is smaller, quieter, delayed or hidden relative to the ad button. On CrazyGames it must match in size, font and colour.
- Two ads chained for one reward.
- A rewarded ad is required to complete a level. Levels that are only beatable via ads are explicitly disallowed.
- On CrazyGames: a midgame ad between levels *and* a "watch rewarded to keep playing" offer at the same transition. Pick one.
- On CrazyGames: an out-of-lives rewarded offer on every single death.
- Banners during gameplay, banners blocking UI at any viewport size, more than 2 banners on a screen, or banners on screens that are visible for less than ~5 seconds.
- Ads requested through anything other than the platform SDK.

### Adblock and pre-launch states

- The game is unplayable, or the player is penalised, when an adblocker is detected. Not allowed. You may gate cosmetic extras — with a visible explanation.
- A rewarded button that stays clickable but does nothing when ads are unavailable. This is a specific, named rejection reason.
- During a pre-monetization phase where ads are disabled (CrazyGames "Basic Launch"), the game must not freeze at ad points and must not show dead rewarded buttons.
- Popups for adblock notices interfere with fullscreen behaviour and the portal's own notices. Use in-game UI instead.

### Technical

- Fatal console errors on load or during the first session.
- Loading screen that can stick with no progress indication.
- Game breaks inside an iframe, or breaks when the window is resized.
- Audio does not unlock on mobile, or does not mute on tab blur.
- Progress lost on refresh when the game implies it saves.
- A login or account wall before any gameplay.

### Gameplay

- No meaningful gameplay within the first minute.
- Controls unexplained and undiscoverable.
- Placeholder art, debug UI or developer text left in the build.

## Fraud-adjacent patterns to avoid

Some patterns do not just annoy players — they get flagged as invalid traffic and reduce your revenue or your account standing:

- Firing ads on a timer during play, so players click by accident. Yandex names this explicitly as ad fraud that lowers payouts.
- Placing ad UI where a gameplay tap lands.
- Requesting ads on a hidden tab.
- Any UI that makes an accidental ad click more likely than a deliberate one.

## Output

```md
# Portal Publish Readiness Review

## Verdict
Ready / Needs Work / Blocker

## Submission Risk
- Main blocker:
- Likely rejection risk:
- Player experience risk:
- Monetization risk:

## Checklist
| Area | Status | Finding | Fix |
|---|---|---|---|
| SDK | Pass/Risk/Fail |  |  |
| Ads | Pass/Risk/Fail |  |  |
| Technical | Pass/Risk/Fail |  |  |
| Gameplay | Pass/Risk/Fail |  |  |
| Mobile | Pass/Risk/Fail |  |  |
| Desktop | Pass/Risk/Fail |  |  |
| Loading | Pass/Risk/Fail |  |  |
| Save/pause/focus | Pass/Risk/Fail |  |  |

## Ad Placement Review
| Placement | Type | Natural break? | Risk | Fix |
|---|---|---|---|---|

## Required Fixes Before Submit
1.
2.
3.

## Nice-to-Have Improvements
-

## Manual QA Script
1. Load game fresh.
2. Play first 60 seconds.
3. Complete/fail first level.
4. Trigger each ad path.
5. Decline rewarded ad.
6. Switch tab and return.
7. Mute/unmute.
8. Resize window.
9. Test mobile/touch.
10. Check console errors.
```

## References

Read these alongside this skill:

- [Ads Checklist](references/ads-checklist.md)
- [Pre-Submit Checklist](references/pre-submit-checklist.md)
