# Snack Lab — Game Design v0.1

## Product direction

Snack Lab is a fast, mobile-first 2D casual cooking and restaurant-management game for browsers.
The primary launch target is Yandex Games, followed by other suitable HTML5 portals. This is a
commercial production game, not a prototype or an MVP.

The player begins with a poor street snack bar and grows it into the strangest restaurant in the
universe. Structural inspiration comes from the readable station flow of classic browser
restaurant-management games, including Papa's-style games, but Snack Lab must not copy their IP,
characters, interface, art, layouts, or writing. Snack Lab is an original cartoon universe.

The three promises are:

- **COOK IT:** short, physical, satisfying cooking interactions.
- **FEED IT:** anticipation and expressive customer reactions.
- **MUTATE IT:** absurd transformation payoffs and a long-term discovery collection.

Short pitch: *Cook weird food. Feed weird customers. Discover even weirder transformations.*

## Audience and experience goals

Primary audience: ages 8–16. Secondary audiences include casual players, mobile-browser players,
Yandex Games users, and adults who enjoy satisfying, absurd management games.

The game must be understandable without long instruction sequences, touch- and mouse-friendly,
bright, funny, high-stimulation, visually readable on small screens, and deep enough for long-term
progression. It is not marketed through medical terminology or references to ADHD.

Target cadence:

- every 1–3 seconds: meaningful visual or audio response;
- every 5–15 seconds: a small success, combo, reaction, or new cooking state;
- every 25–60 seconds: a completed order and customer payoff;
- every 3–6 minutes: shift completion, upgrade, unlock, or new content.

Feedback remains proportional. Routine actions receive small responses; discoveries and
transformations receive the strongest layered effects. Accessibility settings must support
reduced shake and reduced flashing.

## Core order loop

```text
Customer enters
→ order appears
→ player selects ingredients
→ player uses 1–4 cooking stations
→ player assembles food
→ player optionally adds or risk-manages Chaos
→ player serves the customer
→ anticipation beat
→ customer reaction
→ possible transformation
→ scoring
→ payment and tip
→ next customer
```

Early orders target roughly 25–45 seconds. Later orders may reach about 60 seconds. Complexity
comes from station combinations, simultaneous orders, modifiers, patience, special customers,
difficult recipes, and meaningful Chaos decisions—not long instructions or precision controls.

Cooking operations are usually 1–5 seconds and provide immediate feedback:

- prep: drag and swipe;
- grill/oven/freezer: timing and state stopping;
- mixer: circular movement;
- blender: hold and release;
- sauce: drag path;
- Mutation Machine: readable risk/reward Chaos control.

## Orders and scoring

Order families:

- **Normal:** familiar recipes that establish rules and contrast.
- **Modified:** exact additions, removals, temperature, or doneness requests.
- **Weird:** unusual ingredients or treatment.
- **Chaos:** requests describe a desired transformation or effect rather than an exact recipe.
- **Secret:** clue-based requests using sensory and tag language.

Each served dish receives:

- **ORDER:** accuracy against requested ingredients, modifiers, and assembly.
- **COOK:** quality of station execution and cooking states.
- **CHAOS:** novelty and strength of experimental effects; it may exceed 100%.

Example: ORDER 94%, COOK 100%, CHAOS 142%.

A mistake is content, not a dead-end `FAILED` state. It can create a strange reaction, alternate
transformation, reduced payment, altered tip, or unexpected visual event. One error never causes a
hard loss by itself.

## Ingredients and FoodInstance

Ingredients are authored data with stable identifiers, localization keys, asset keys, category,
price, rarity, cooking behavior, visual properties, and typed gameplay tags such as `HOT`, `FIRE`,
`ICE`, `SLIME`, `SPACE`, `ROBOT`, `CAT`, `DRAGON`, `ELECTRIC`, `GLOW`, `SWEET`, `TOXIC`, and
`MAGIC`. Tags are controlled identifiers, never scattered free-form strings.

A runtime `FoodInstance` records ingredients and their order, per-ingredient cook states, station
history, quality, accumulated tags, Chaos score, mistakes, and visual variant. The same plain-data
record feeds scoring, reactions, transformation resolution, saves where appropriate, and analytics.

## Transformation system

Transformations are the central USP. The resolver receives a `FoodInstance`, `CustomerInstance`,
and current unlock/progression context. It evaluates authored `TransformationDefinition` data and
selects the best eligible result deterministically, using an explicit tie-break policy.

Definitions can specify:

- required, preferred, and forbidden tags;
- minimum Chaos;
- priority and rarity;
- compatible customer types;
- result appearance;
- reaction sequence;
- reward modifier;
- unlock or discovery requirements.

Content grows by adding validated definitions, not by expanding a giant conditional chain.
Runtime does not procedurally assemble low-quality visual results from arbitrary parts. Every
shippable transformation is an art-directed, authored result compatible with the modular character
system.

Transformation reveal targets 2–4 seconds: bite, pause, facial anticipation, shake and
squash/stretch, flash/particles, authored appearance swap, new pose/reaction, and reward burst.
Timing may be shortened for repetition while preserving the payoff.

## Customers and characters

Initial archetypes include normal, kid, picky, influencer, scientist, monster, alien, VIP, and
mystery customers. Customers vary in preferences, patience, reward profile, compatible reactions,
and transformation presentation.

Characters use modular raster layers: body, head, eyes, pupils, mouth, arms, hands, accessories,
mutation attachments, and effects. Reusable actions include enter, idle, blink, talk, wait,
inspect food, bite, chew, anticipate, happy, negative reaction, transform, pay, and leave.
Layered PNG/WebP sprites, selective sprite sheets, tweens, particles, and short loops are preferred
over unique full frame-by-frame animation for every variant.

## Stations

Main planned modules are Prep Board, Grill, Mixer, Blender, Oven, Freezer, and Mutation Machine.
Later chapters may add Laser Cooker, Gravity Oven, Slime Injector, Portal Fryer, and other authored
stations. Each station owns its physical interaction, state, rules, and presentation adapter; shift
scenes only coordinate navigation and lifecycle.

## Shifts, progression, and campaign

A shift lasts roughly 3–6 minutes: restaurant opening, customer sequence, escalating conditions,
special event, final unusual or VIP customer, results, rewards, and upgrade choice. It is the main
session unit and a natural interstitial boundary.

Campaign progression:

1. Street Snack Bar
2. Weird Diner
3. Monster Kitchen
4. Space Cafe
5. Mad Food Lab
6. Interdimensional Food Court

Across the campaign the player unlocks ingredients, recipes, stations, upgrades, customers,
transformations, decorations, restaurant zones, random events, and secrets. The Chaos Cookbook
tracks recipes, ingredients, customers, transformations, rare orders, partial clues, and discovery
completion.

Architecture targets 5–6 chapters, 40–60 shifts, 50+ customer variants, 50+ recipes/orders,
80–120 ingredients, 75–120 transformations, 6–10 core stations, 40+ meaningful upgrades, 60+
decorations, random events, and collections. These are release-scale targets, not the scope of the
initial scaffold.

## Economy, upgrades, and monetization

Coins are the sole launch currency unless a later economy review proves a distinct need. Sources
include base payment, ORDER/COOK quality bonus, Chaos bonus, tips, shift rewards, and discoveries.
Sinks include equipment, station upgrades, ingredients, décor, restaurant expansion, new zones,
and functional absurd items. Early purchases should be reachable in the first session; later
pricing and ad rewards require measured economy balancing.

Upgrades change visible equipment and meaningful behavior, not only hidden percentages. Décor may
be cosmetic or grant small, understandable bonuses without creating one mandatory build.

Advertising is the primary monetization model. Interstitials appear only at completed, natural
breaks such as shift completion or chapter transition. Rewarded offers are voluntary, clearly
labelled, and provide an exact bonus such as double shift tips, a rare ingredient, a VIP customer,
one second chance, or a Chaos boost. The full game remains playable without rewarded ads. No
manufactured pain, guilt copy, disguised ad buttons, or progression dependency is permitted.

## Art, UI, audio, and localization

Art direction is original 2D cartoon: bright, chunky shapes; strong silhouettes; expressive faces;
appetizing but absurd food; exaggerated proportions; controlled chaos; and mobile-scale clarity.
Food, customer face/reaction, and transformation are the top visual priorities. Existing meme or
brainrot characters must not be copied.

Gameplay art is production raster PNG/WebP, transparent where a sprite requires it. No SVG game
assets, programmer-art substitutes, colored-box characters, or temporary food icons enter the
player-facing pipeline. Code-native UI text and simple technical layout are allowed. All authored
assets follow the manifest and approval gates in `ASSET_PIPELINE.md`.

Portrait composition flows customer → order → station → ingredients/actions. Desktop uses a
purposeful multi-column composition: customer/order | active station | ingredients/tools. Desktop
is not a scaled-up portrait canvas. Critical controls respect safe areas and do not require hover,
right-click, pixel-perfect placement, or complex gestures.

Audio uses short UI, cooking, cash, transformation, reaction, combo, and discovery sounds with
brief non-verbal character vocalizations. Localized full dialogue audio is not required. Mixer
buses separate Master, Music, SFX, UI, Ambience, and Voice.

English and Russian are mandatory release languages. Gameplay uses localization keys, layouts
allow text expansion, and localizable copy is not baked into raster images without a specific need.

## Saves, analytics, and platform behavior

Saves cover campaign and restaurant progress, coins, upgrades, unlocked ingredients/recipes/
transformations, decorations, settings, and collections. Platform cloud storage is preferred where
available, with a local fallback. Schema versioning, migrations, validation, backup/recovery, and
conflict policy begin at version 1.

Planned internal analytics events include session/shift start, order received/completed/failed,
transformation discovered, ingredient unlocked, upgrade bought, shift completed, ad opportunity,
rewarded started/completed, and interstitial shown. No analytics SDK is selected in this phase.

Core gameplay never imports portal SDKs. Platform capabilities and lifecycle—including game-ready,
gameplay start/stop, visibility, pause/resume, ads, audio muting, and storage—cross the platform
boundary described in `ARCHITECTURE.md`.
