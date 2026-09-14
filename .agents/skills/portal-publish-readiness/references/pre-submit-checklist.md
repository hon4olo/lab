# Pre-Submit Checklist

Work top to bottom. Anything unchecked is a likely rejection or a bad first session.

## Loading and first session

- [ ] Game loads reliably on a mid-range Android phone over mobile data.
- [ ] Initial download within the platform's stated limit.
- [ ] Loading progress is honest — no bar that reaches 100% and then pauses.
- [ ] Time to first input under 5 s; time to playable under 10 s.
- [ ] First objective clear without reading text.
- [ ] Level 1 fail rate under 5%.
- [ ] No login or account wall before gameplay.

## SDK

- [ ] SDK initialised before any ad call.
- [ ] Loading and gameplay events reported where the platform requires them.
- [ ] Poki only: `gameplayStart()` / `gameplayStop()` bracket every gameplay segment.
- [ ] Google H5 only: `adConfig({ preloadAdBreaks: "on" })` called, and promises settled in `adBreakDone`.
- [ ] SDK errors handled without breaking the game.
- [ ] Game works inside an iframe.

## Ads

- [ ] Full ads checklist passed — see `ads-checklist.md`.

## Technical

- [ ] No fatal console errors on load or during the first session.
- [ ] No memory staircase across 20+ rounds without reloading.
- [ ] Frame time 95th percentile within budget on a mid-range device.
- [ ] `visibilitychange` pauses and resumes exactly once.
- [ ] Delta time clamped so a backgrounded tab does not teleport entities.
- [ ] Canvas resizes correctly; works at ~320 px width and at tablet width.
- [ ] Audio unlocks on first gesture; mutes on blur.

## Controls

- [ ] Desktop controls clear and consistent.
- [ ] Touch targets at least 44×44 CSS px, 8 px apart.
- [ ] No hover-only information.
- [ ] Browser scroll and pinch-zoom prevented on the canvas.
- [ ] Orientation change mid-level handled.

## Save and state

- [ ] Progress persists across reload.
- [ ] Progress survives a tab eviction, or the loss is small and explained.
- [ ] Save failure has honest copy and does not lose the current run silently.

## Store page

- [ ] Thumbnail reviewed at 128×128 in a grid of competitors.
- [ ] Title two to four words, distinctive word first.
- [ ] Screenshots in order: verb, reward, challenge, variety.
- [ ] Tags match what the game actually is.

## Compliance

- [ ] Privacy policy exists and names the ad and analytics providers.
- [ ] Child-directed status determined and the SDK flag set accordingly.
- [ ] Consent handling confirmed — who runs it, and what you still own. See `ad-consent-privacy-compliance`.

## Final pass

- [ ] Played start to finish on a phone, one-handed, on mobile data.
- [ ] Every ad path triggered manually, including one decline and one forced no-fill.
- [ ] No placeholder art, debug UI or developer text in the build.
