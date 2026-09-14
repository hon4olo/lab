# Mobile Browser QA

Most portal traffic is mobile web. Test there first.

## Device baseline

Profile on a **mid-range Android phone in Chrome** over mobile data. A desktop rendering at 300 fps tells you nothing about the device most of your players use.

No device available? Use CPU throttling at 4–6× and network throttling to Fast 3G in DevTools. It is a poor substitute but far better than nothing.

## Audio

- [ ] Audio unlocks on the first user gesture. Browsers block autoplay.
- [ ] Nothing depends on audio that plays before the first tap.
- [ ] Audio mutes on tab blur and on ad start, and unmutes exactly once on return.
- [ ] Ringer/silent mode handled sanely on iOS.
- [ ] No audio node leak across rounds.

## Viewport and layout

- [ ] Portrait and landscape both work, including rotating mid-level.
- [ ] Safe areas respected — notches and home indicators eat the edges where UI sits.
- [ ] Layout survives the address bar collapsing and expanding, which changes viewport height mid-session.
- [ ] Works at ~320 px width and at tablet width.
- [ ] Canvas resizes correctly rather than stretching or cropping.
- [ ] Works inside an iframe, since that is how portals embed it.

## Input

- [ ] Responds to `pointerdown`, not `click`. Waiting for `click` adds delay read as lag.
- [ ] Touch targets at least 44×44 CSS px, 8 px apart.
- [ ] No hover-only information anywhere.
- [ ] Browser scroll, pull-to-refresh and pinch-zoom prevented on the canvas — but not on genuinely scrollable UI.
- [ ] Multi-touch does not break single-touch controls.
- [ ] Accidental edge swipes do not trigger browser navigation.

## Lifecycle

- [ ] `visibilitychange` pauses simulation and audio.
- [ ] Resume happens once, not twice, on return.
- [ ] Delta time clamped so a backgrounded tab does not teleport everything on return.
- [ ] Screen lock, unlock and app switch all resume correctly.
- [ ] Progress saved often enough that a browser tab eviction is survivable.

## Thermals and battery

- [ ] Frame rate after 10 minutes of continuous play is still acceptable. Thermal throttling shows up late and never in a 30-second test.
- [ ] Nothing spins the CPU while the game is idle at a menu.

## Test script

1. Load over mobile data on a mid-range Android device.
2. Play one full level one-handed.
3. Rotate mid-level.
4. Collapse and expand the browser chrome.
5. Trigger every ad path; decline one rewarded offer.
6. Lock the screen for 30 seconds, unlock, confirm clean resume.
7. Play continuously for 10 minutes and recheck frame pacing.
8. Check the console for errors throughout.
