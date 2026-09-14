# Ad QA Matrix

Test every relevant case:

## Interstitial

- Success.
- No fill.
- Error.
- Closed.
- Duplicate call attempt.
- First session suppression.
- Cooldown suppression.
- Repeated-death suppression.
- Tab hidden during ad.
- Audio muted before ad.
- Audio unmuted before ad.
- Game resumes after ad.

## Rewarded

- Success and reward granted.
- Closed early and no reward.
- No fill and no reward.
- Error and no reward.
- Double-click button.
- Button disabled while loading.
- Skip path works.
- Decline offer.
- Reward persists after page reload if needed.
- Same offer not repeated immediately after rejection.

## Mobile/browser

- Orientation change during/after ad.
- App switch during/after ad.
- Audio unlock still works.
- Touch input restored.
- Safe area still correct.
