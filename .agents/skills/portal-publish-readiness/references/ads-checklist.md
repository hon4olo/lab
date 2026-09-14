# Ads Checklist

Verified against CrazyGames, Poki, Yandex Games and Google H5 documentation on 2026-08-02. Re-check before submission.

## Instant rejections

- [ ] No ad fires while the player has control.
- [ ] No ad on a navigational button — main menu, settings, shop entry.
- [ ] Game simulation and audio both stop during a fullscreen ad.
- [ ] UI is blocked from the ad *request* until the result callback. The request is not instantaneous.
- [ ] No reward granted on error, no-fill or early close.
- [ ] Skip / decline matches the ad button in size, font and colour. Not delayed, not hidden.
- [ ] No two ads chained for one reward.
- [ ] No level that can only be completed via a rewarded ad.
- [ ] Not both a midgame ad and a "watch to keep playing" offer at the same transition.
- [ ] Rewarded revive is not offered on every single death.
- [ ] No banners during gameplay; none blocking UI at any viewport; max 2 per screen; only on screens visible 5+ seconds.
- [ ] Ads requested only through the platform SDK.

## Adblock and pre-monetization states

- [ ] Game fully playable with an adblocker; no penalty to the player.
- [ ] Gated extras show a visible, non-accusatory explanation.
- [ ] No rewarded button that stays clickable but does nothing.
- [ ] No popups for adblock notices — they interfere with fullscreen and platform notices.
- [ ] With ads disabled (pre-monetization launch phase), the game does not freeze at ad points.

## Correctness

- [ ] Reward granted only on the platform's confirmed completion signal.
- [ ] Dismissal mapped correctly for the platform — on CrazyGames a dismissed rewarded ad arrives as `adError`.
- [ ] Double-click on a rewarded button produces one ad and one reward.
- [ ] Tab hidden mid-ad, then restored: audio unmutes once, game resumes once.
- [ ] Provider never calls back: a timeout exists and resumes the game.
- [ ] Flow continues on every failure path.

## Fraud-adjacent patterns

- [ ] No ads on a timer during gameplay. Yandex names this explicitly as ad fraud that lowers payouts.
- [ ] No ad UI where a gameplay tap habitually lands.
- [ ] No ad requests on a hidden tab.

## Good placements

Level complete, run ended, world transition, tutorial completion, player-opened ad shop, reward multiplier after the reward is displayed, revive after a meaningful failure.

## Bad placements

Before first gameplay, during active control, after every small failure, disguised as continue, required for normal progression, papering over unfair difficulty.
