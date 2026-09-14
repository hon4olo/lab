# First playable order

## Scope

The first authored shift contains one order: Business Cat asks for a Hot Cheese Burger — Extra
Spicy. After payment and customer exit, the localized shift-complete result appears with a replay
action. Replaying the same shift keeps the wallet, unlocks, and discovery history and creates a new
transaction identity for the new run.

The content is data-driven through typed registries in `src/content/registries.ts`, with authored
customer, ingredient, recipe, order, shift, chapter, and transformation definitions. Startup
validation checks registry IDs and references, recipe/order agreement, customer compatibility, prep
and grill requirements, and production-approved manifest assets. Every image reference is a stable
ID from `public/assets/manifest.json`.

## Flow and ownership

```text
customer-entering → ingredient-selection → prep-board → grilling → assembly
→ modifier-selection → assembly/serve → anticipation → payment → customer-leaving
→ next-order-ready
```

`OrderSession` is renderer-free authoritative order state. It composes ingredient selection, Prep
Board state, `GrillSession`, the burger assembler, customer lifecycle, scoring, payment transaction
creation, and the transformation resolver. It does not own or increment the player's coins.
`EconomySession` owns the runtime wallet and applies an identified payment transaction at most once.
`ShiftSession` tracks the authored sequence, active order index, completed order slots, earnings, and
phase; `ShiftController` applies payment and creates each order session from order/customer content.
`CampaignSession` sits above the shift controller and owns chapter progression, the persistent
wallet snapshot, unlock context, completed runs, and discovered transformations. `OrderScene`
coordinates actions and presentation. Phaser owns pointer events, elapsed-frame input to the grill,
sprites, tweens, and effect playback; no Phaser object is stored in domain state.

Players first select the five base ingredients: bottom bun, patty, cheese, sauce, and top bun. They
prepare the patty on the Prep Board, grill it, and stop the grill before it burns. The assembled
base burger is shown before the player adds the requested Extra Spicy modifier. Adding the chili
updates the FoodInstance tags, Chaos, ingredient order, and finished-burger asset. The grill exposes
the same large tap target as its start/stop button; the order can be served after the modifier is
added.

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
ideal stop at 3600 ms produces quality 100; tests exercise that deterministic domain boundary.

## Customer patience and persistence

Each customer instance receives `basePatienceMs` from content. `CustomerPatienceSession` pauses while
the page is hidden and resumes from its prior remaining time. It clamps to zero but never rejects an
order or forces the customer to leave; the player can finish after patience expires.

The first Flaming Business Cat result is recorded as a discovery in the campaign save. Repeated
reactions and shift replays retain the discovery without adding it again. The local versioned save
keeps applied payment IDs and run IDs; a duplicate transaction cannot credit the wallet twice.
Reloading during an unsettled order restores the active shift at that order's entry using the same
run identity. Selection, prep, and grill work from that unsettled order restart; previously settled
order results and coins are retained.

## Tags and transformation

The extra-spicy ingredient contributes 70 Chaos and the `HOT` and `FIRE` tags to the FoodInstance
when added after assembly. `transformation.business-cat.flaming` is eligible when all its authored requirements
match: `HOT` and `FIRE`, at least 60 Chaos, compatible customer type `business-cat`, no `ICE`, and
all required unlocks. It prefers `CAT`. `resolveTransformation` ranks eligible definitions by
priority, preferred-tag matches, rarity, and stable ID, so selection is deterministic and does not
branch on a customer/recipe pair.

The appearance keeps the neutral Business Cat stack and adds its manifest-defined fire accents,
glow eyes, and singed tie. The presentation plays an anticipation beat, transformation flash/fire
burst (suppressed under reduced motion), then coin sparkle and customer exit.

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

## Localization and diagnostics

All runtime UI copy is keyed in the RU/EN dictionaries. In development,
`window.SNACK_LAB.getSnapshot()` returns a cloned read-only snapshot of order phase, selected
ingredients, prepared ingredients, FoodInstance, grill state, scores, transformation result,
payment, shift phase/index/earnings, and persistent/session coin balances. The bridge is loaded only
when `import.meta.env.DEV` is true.
