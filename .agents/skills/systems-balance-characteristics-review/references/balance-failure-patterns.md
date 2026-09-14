# Balance Failure Patterns

Each pattern below has a measurement, not just a description. Get the number before proposing a fix.

## Dominant strategy

**Symptom:** most players converge on one option.
**Measure:** pick rate per option among players who had all options. Above 60% is dominant; above 80% means the other options are decoration.
**Cause:** the option is better in every situation, or it is better in the only situation that matters.
**Fix order:** give weak options a situation where they clearly win → add opportunity cost to the strong one → add diminishing returns → adjust numbers last. Numbers-first teaches you nothing about why it dominated.

## Snowball

**Symptom:** the run is decided early.
**Measure:** how often does the leader at the 25% mark win? Above ~80% means the rest is theatre.
**Fix:** soft caps on compounding advantages, visible and fair catch-up, shorter runs so a bad one costs less, risk that scales with the lead.

## Strategic collapse

**Symptom:** the game is interesting for a while, then everyone plays it the same way forever.
**Measure:** strategy diversity over player lifetime. Narrowing over time is normal; collapse to one is not.
**Fix:** rotate contexts so different strategies win in different conditions, or accept the collapse and shorten the intended lifetime.

## Unfair randomness

**Symptom:** players lose despite correct play.
**Measure:** outcome variance for the same player on identical content.
**Fix:** move randomness before decisions, add preview and mitigation, reduce variance in the first attempts specifically. See `luck-skill-randomness.md`.

## Dead choices

**Symptom:** options nobody takes.
**Measure:** pick rate under 5%.
**Fix:** give it a niche, or cut it. A short list of live options reads as deeper than a long list of traps.

## Busywork

**Symptom:** repeated actions with no decision attached.
**Measure:** decisions per minute, and inputs per decision.
**Fix:** automate it, compress it to one input, or attach a real decision. If none of those work, delete it.

## Downtime

**Symptom:** the player is waiting.
**Measure:** longest stretch with no available action. Over 10 seconds means they are watching, not playing.
**Fix:** overlap phases, shorten animations, allow input during resolution.

## Reward/effort mismatch

**Symptom:** the optimal play is boring, or the fun play is punished.
**Measure:** reward per minute for the fun strategy versus the optimal one.
**Fix:** pay for the behaviour you want to see. Players follow the payout, not the design document.

## Difficulty spike

**Symptom:** a sharp fail-rate jump at one point.
**Measure:** fail rate and quit-after-fail rate per level. A quit rate above the fail rate's usual companion means unfairness, not difficulty.
**Fix:** almost always a mechanic that was never taught. Check what the level requires that the player was never shown.

## The monetization smell

If any of the above sits directly next to an offer that relieves it, resolve the balance problem first, then re-check whether the offer is still needed. See the manufactured-pain test in `f2p-monetization-ethics-review`.
