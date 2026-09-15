# Snack Lab — Game Design

## Product

Snack Lab is a commercial browser cooking / restaurant-management game with fast hands-on food
preparation, absurd customer reactions, and deterministic transformation discoveries.

Primary target: Yandex Games. Secondary HTML5 portals include CrazyGames, Playgama-compatible
portals, GameDistribution, Y8, GamePix, and similar destinations.

The product is not an MVP or throwaway prototype. Build production-ready systems and content
increments that scale to a long-running campaign.

## Player fantasy

The player starts with a cheap street snack bar and grows into increasingly strange restaurants.
Customers order recognizable food, but optional experimental ingredients can trigger funny,
family-friendly mutations.

The pleasure comes from two things at once:

1. **manual craft** — physically preparing and assembling food under time pressure;
2. **curiosity** — discovering what unusual combinations do to customers.

## Core loop

```text
customer arrives
→ take/read order
→ Prep Station
→ Grill/Cook Station
→ Build Station
→ optional Chaos ingredient/risk
→ serve
→ anticipation
→ reaction / possible transformation
→ ORDER / COOK / CHAOS scoring
→ payment / tip / discovery
→ next customer
```

Early orders should usually resolve in roughly 25–60 seconds once the full hands-on station loop is
active. A complete shift should grow toward roughly 3–6 minutes without filling time with fake
duplicate orders.

## Hands-on station design

The player does not merely select ingredients and press Assemble.

Each station is a distinct workspace:

- **Order** — customer, ticket, patience, queue/shift context.
- **Prep** — recipe-specific cutting/portioning/preparation.
- **Grill** — place food on cook surfaces, perform authored actions, remove it at the desired state.
- **Build** — drag/place every component spatially; distribute pieces; draw sauce paths.
- **Serve / Reaction** — return to the customer, deliver the actual FoodInstance, show reaction and
  possible transformation.
- **Results** — scores, coins/tip, discovery, shift progress.

See `STATION_GAMEPLAY.md` for the canonical interaction contract.

## Food skill expression

Food quality must reflect what the player physically did.

Examples:

- a patty can be removed too early, perfectly, or burned;
- cheese can be centered or hanging off one side;
- repeated chili/pickle pieces can be evenly distributed or clumped;
- sauces can be spread across the food or concentrated in one place;
- layers can be placed in the wrong order.

The visual dish must reflect those choices. A pre-rendered finished-food PNG is not the gameplay
truth.

## Scoring pillars

### ORDER

Measures fulfillment and build accuracy. Over time it can include:

- required/forbidden ingredients;
- prep requirements;
- layer order;
- spatial centering;
- repeated-piece distribution;
- sauce coverage;
- recipe-specific presentation rules.

### COOK

Measures cooking quality independent of assembly: timing, authored flip/stir/cut actions, burn state,
and later multi-item station management.

### CHAOS

Measures intentional experimentation, not sloppiness. CHAOS comes from authored experimental
ingredients/combinations/tags and transformation risk. Dropping cheese crookedly should not be a
cheap CHAOS strategy.

CHAOS may exceed 100% when the player pushes beyond the order's normal target.

## Transformation system

Transformations are a core USP and remain deterministic/data-driven.

Ingredients contribute typed tags such as HOT, FIRE, ICE, SLIME, SPACE, ROBOT, ELECTRIC, GLOW,
SWEET, TOXIC, MAGIC, and similar authored concepts. The resolver considers FoodInstance tags,
Chaos, customer compatibility, progression/unlocks, priority, rarity, and forbidden tags.

Never implement transformations as a giant customer/recipe `if/else` chain.

Transformations use authored production character art. Do not force broken procedural composites or
misaligned overlays into the reaction view.

## Current first shift

Current authored content:

1. Business Cat — Hot Cheese Burger — Extra Spicy → Flaming Business Cat.
2. Picky Pigeon — Cheesy Street Hot Dog → normal reaction or optional Glow Sauce → Neon Pigeon.

The current code still contains legacy automatic-assembly behavior from the first vertical slice.
That path is being replaced by the spatial assembly model before adding Customer #3.

## Session / progression goals

Long-term architecture should support approximately:

- 5–6 chapters / increasingly absurd restaurant locations;
- 40–60 shifts;
- 50+ customer variants;
- 50+ recipes/orders;
- 80–120 ingredients;
- 75–120 transformations;
- 6–10 major station types;
- 40+ meaningful upgrades;
- 60+ decor items;
- random events and collection/discovery systems.

The initial restaurant progression concept remains:

Street Snack Bar → Weird Diner / Monster Kitchen → Space Cafe → Mad Food Lab → Interdimensional
Food Court.

## Retention / feedback rhythm

Target a strong but readable feedback cadence:

- meaningful response to player manipulation every ~1–3 seconds;
- small success/reaction every ~5–15 seconds;
- completed order/reaction/transformation every ~25–60 seconds;
- shift completion/upgrade/unlock roughly every ~3–6 minutes.

Do not market around medical/attention conditions.

## Audience / tone

Broad family-friendly casual audience, roughly readable for ages 8–16 and above.

Visual tone:

- funny, charming, polished;
- absurd rather than grotesque;
- readable on phones;
- appetizing food even when experimental;
- expressive customers and transformations.

## Monetization direction

The game is intended for ad-supported browser portals. Monetization systems come after the core
station loop is genuinely fun and retention-worthy. Ads/rewarded ads must remain behind platform
capabilities and must not be hardwired into gameplay rules.

## Non-goals right now

Before Customer #3, do not prioritize:

- more content for its own sake;
- large upgrade/decor catalogs;
- portal SDK integration;
- IAP;
- elaborate meta systems;
- visual placeholders.

Priority is making the first two orders feel like a real hands-on cooking game.
