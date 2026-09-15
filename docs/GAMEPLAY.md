# First playable shift

## Scope

The first authored shift contains two orders: Business Cat asks for a Hot Cheese Burger — Extra
Spicy, then Picky Pigeon asks for a Cheesy Street Hot Dog. After both payments and customer exits,
the localized shift-complete result appears with a replay action. Replaying the same shift keeps the
wallet, unlocks, and discovery history and creates new transaction identities for the new run.

The content is data-driven through typed registries in `src/content/registries.ts`, with authored
customer, ingredient, recipe, order, shift, chapter, and transformation definitions. Startup
validation checks registry IDs and references, recipe/order agreement, customer compatibility, prep
and grill requirements, and production-approved manifest assets. Every image reference is a stable
ID from `public/assets/manifest.json`.

A recipe owns its base food and station contract plus every approved ingredient it can contain. An
order owns its requested subset: required, optional, and forbidden ingredients, with an optional
variation containing zero or more post-assembly modifiers. This lets a future Modified, Weird, or
Chaos order reuse a recipe instead of duplicating it. `OrderContent` resolves the exact player
ingredient pool from those authored definitions.

## Flow and ownership

```text
customer-entering → ingredient-selection → prep-board → grilling → assembly
→ modifier-selection → serve → anticipation → payment → customer-leaving
→ next-order-ready
```

`OrderSession` is renderer-free authoritative order state. It composes ingredient selection, Prep
Board state, `GrillSession`, the shared food assembler, customer lifecycle, scoring, payment transaction
creation, and the transformation resolver. It does not own or increment the player's coins.
`EconomySession` owns the runtime wallet and applies an identified payment transaction at most once.
`ShiftSession` tracks the authored sequence, active order index, completed order slots, earnings, and
phase; `ShiftController` applies payment and creates each order session from order/customer content.
`CampaignSession` sits above the shift controller and owns chapter progression, the persistent
wallet snapshot, unlock context, completed runs, and discovered transformations. `OrderScene`
coordinates actions and presentation. Phaser owns pointer events, elapsed-frame input to the grill,
sprites, tweens, and effect playback; no Phaser object is stored in domain state.

The shift controller reads progression through a live, read-only provider when it creates each new
order session. Therefore an unlock recorded after order one is visible to order two without Phaser
or a scene owning progression state.

## Station presentation

The authoritative order phases are presented as distinct player-facing workstations instead of one
cluttered restaurant composition:

```text
Order → Prep → Grill → Build → Serve / Reaction → Results
```

`stationPresentation.ts` maps domain phases onto those modes. The Order and Serve modes use the
restaurant counter and customer. Prep, Grill, and Build hide the customer/counter and show a focused
work surface over a dimmed restaurant backdrop. Results has its own workspace. A station rail shows
which part of the flow is active, while compact/mobile layouts show only the current station label.
This is a presentation-only split; it does not move gameplay rules into Phaser or duplicate domain
state.

Station and character artwork is capped near authored source dimensions rather than scaling as a
large percentage of an arbitrary desktop viewport. Food is deliberately smaller on grill/build/serve
screens so it reads as an object on a workstation instead of filling the scene.

Players first select the five base burger ingredients: bottom bun, patty, cheese, sauce, and top
bun. They prepare the patty on the Prep Board, grill it, and stop the grill before it burns. The
assembled base burger is shown before the player adds the requested Extra Spicy modifier. Adding
the chili updates the FoodInstance tags, Chaos, ingredient order, and finished-burger asset. Picky
Pigeon then selects bun, sausage, cheese, pickle, and mustard, prepares and grills the sausage, and
may optionally add Glow Sauce before serving. Both orders use the same Prep Board and Grill seams;
their timing curves and asset mappings are authored content.

## Cooking

`GrillSession` advances only from elapsed time supplied by the scene:

| Elapsed time | State | Quality |
|---:|---|---:|
| 0–1199 ms | raw | 25 |
| 1200–2499 ms | cooked | 60 |
| 2500–5999 ms | perfect | 60–100, peaking at 3600 ms |
| 6000 ms and later | burned | 0 |

Stopping records the cook state, elapsed processing time, heat quality, and grill visit in the
`FoodInstance`. Leaving the patty on the grill crosses deterministically into `burned`. The exact
ideal stop at 3600 ms produces quality 100; tests exercise that deterministic domain boundary. The
perfect-state curve normalizes distance to the recipe's authored ideal-to-boundary windows, producing
60 at either edge and 100 at the ideal rather than relying on a fixed milliseconds-per-quality slope.

The hot-dog sausage uses its authored curve: cooked at 1000 ms, perfect at 2200 ms, ideal stop at
3200 ms, and burned at 5200 ms. Both recipes still resolve through the shared raw → cooked → perfect
→ burned state machine and record the result on `FoodInstance`.

## Customer patience and persistence

Each customer instance receives `basePatienceMs` from content. `CustomerPatienceSession` pauses while
the page is hidden and resumes from its prior remaining time. It clamps to zero but never rejects an
order or forces the customer to leave; the player can finish after patience expires.

The first Flaming Business Cat and Neon Pigeon results are recorded as discoveries in the campaign
save. Repeated reactions and shift replays retain each discovery without adding it again. The local
versioned save keeps applied payment IDs and run IDs; a duplicate transaction cannot credit the
wallet twice.
Reloading during an unsettled order restores the active shift at that order's entry using the same
run identity. Selection, prep, and grill work from that unsettled order restart; previously settled
order results and coins are retained.

## Tags and transformation

The extra-spicy ingredient contributes 70 Chaos and the `HOT` and `FIRE` tags to the FoodInstance
when added after assembly. `transformation.business-cat.flaming` is eligible when all its authored requirements
match: `HOT` and `FIRE`, at least 60 Chaos, compatible customer type `business-cat`, no `ICE`, and
all required unlocks. Food tags originate only from selected authored ingredient/effect data;
Flaming Business Cat has no implicit `CAT` preference. `resolveTransformation` ranks eligible
definitions by priority, preferred-tag matches, rarity, and stable ID, so selection is deterministic
and does not branch on a customer/recipe pair.

The original Batch 01 fire-accent/glow-eye/singed-tie cutouts were found during visual QA to contain
misaligned duplicated character fragments. They are therefore not loaded by the current shift.
Until a coherent full Flaming Business Cat replacement sprite is authored, the transformation keeps
the neutral Business Cat appearance and uses the approved fire-burst effect. Scoring, discovery and
reward behavior are unchanged; this is a presentation safety fallback, not a rules change.

Glow Sauce is optional on the Picky Pigeon order. It contributes `GLOW` and `ELECTRIC` plus 100
Chaos; with the correct base hot dog this reaches CHAOS 100 and resolves the authored
`transformation.picky-pigeon.neon` definition (minimum Chaos 80, compatible with `picky-pigeon`).
Without Glow Sauce the normal skeptical reaction and base hot-dog payment are used and no
transformation is eligible. Neon Pigeon uses its full authored appearance and electric-sparks/neon-
burst effects.

## Scoring and payment

- **ORDER** starts at 100. The shared `DEFAULT_BALANCE_CONFIG` subtracts 18 per missing required
  ingredient, 6 per extra ingredient, 10 per selected but unprepared required ingredient, and 20 if
  not assembled; clamp to 0–100.
- **COOK** is the recorded FoodInstance cook quality from 0–100.
- **CHAOS** is `round(food.chaosScore / order.chaosTarget × 100)`. It can exceed 100%; payment
  normalizes its bonus at a maximum of 200%.
- Quality bonus is `floor(basePayment × (ORDER + COOK) / 500)` (`qualityBonusScale`).
- Chaos bonus is `floor(basePayment × min(CHAOS, 200) / 1000)` (`chaosBonusCap` and
  `chaosBonusScale`).
- The transformation modifier multiplies base payment plus quality and Chaos bonuses; the displayed
  transformation bonus is the difference after rounding.
- Tip is `floor(baseTip × (ORDER + COOK) / 200)` (`tipScale`). Total payment is modified payment
  plus tip. These values are centralized in `src/game/balance/BalanceConfig.ts`.

For a fully correct order, a 100 COOK, and the 140 CHAOS result produced by the prepared chili, the
payment is 55 coins: 24 base, 9 quality, 3 Chaos, 9 transformation, and 10 tip.

The fully correct base Cheesy Street Hot Dog pays 36 coins (20 base, 8 quality, 0 Chaos, 0
transformation, and 8 tip). With Glow Sauce and Neon Pigeon, the same 100/100/100 result pays 49
coins after the authored 1.35 transformation modifier (20 base, 8 quality, 2 Chaos, 11
transformation, and 8 tip).

## Localization and diagnostics

All runtime UI copy is keyed in the RU/EN dictionaries. In development,
`window.SNACK_LAB.getSnapshot()` returns a cloned read-only snapshot of order phase, selected
ingredients, prepared ingredients, FoodInstance, grill state, scores, transformation result,
payment, shift phase/index/earnings, and persistent/session coin balances. The bridge is loaded only
when `import.meta.env.DEV` is true.
