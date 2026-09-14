# Snack Lab — Art Direction

## Creative target

Snack Lab is an original polished 2D cartoon universe: bright, chunky, expressive, funny,
appetizing, and slightly absurd. The first location is a small, cheap but charming Street Snack
Bar. It is visibly worn but cared for, with clear room for upgrades. Every object should feel like
it could become a more outrageous version later.

The visual priority order is:

1. food readability and appetite;
2. customer face and reaction readability;
3. transformation payoff;
4. station affordance;
5. restaurant charm and upgrade potential.

The tone is mischievous and warm rather than gross, frightening, cynical, or chaotic for its own
sake. Flaming Business Cat is a joke about office seriousness colliding with spicy food, not a
horror creature.

## Originality guardrails

Snack Lab must not copy Papa’s games, Roblox, brainrot/meme characters, silhouettes, UI language,
character designs, restaurant layouts, or other third-party IP. Do not use recognizable templates
such as a generic block avatar, an existing meme face, or a direct fast-food mascot reference.

The original visual IP is defined by a compact laboratory-diner vocabulary: worn teal enamel,
violet plum shadows, hot coral accents, electric mint highlights, chunky rounded shapes, expressive
eyes, and food that behaves a little too dramatically.

## Shape language and silhouettes

- Primary forms are rounded, chunky, and slightly asymmetrical, with a few crisp graphic cuts for
  readability.
- Characters have a large readable head, compact body, short limbs, and one strong accessory
  silhouette. Business Cat's shirt collar and tie must read before fur detail.
- Food uses broad stacked layers, clear separation between bun/patty/cheese, and a generous plate or
  tray silhouette. Chili and sauce need distinct silhouettes at 32–48 px display size.
- Stations use one dominant silhouette and one obvious interaction surface. Prep Board reads as a
  board; Grill reads as a hot grate with a lid/handle and a warm glow.
- Transformation attachments exaggerate the existing silhouette instead of replacing identity.

## Palette and value structure

Use these palette roles as anchors, not as a requirement that every pixel use them:

| Role | Swatch | Use |
|---|---|---|
| Deep plum | `#241332` | outlines, deepest shadow, text contrast |
| Night violet | `#3A2053` | background depth and recesses |
| Worn teal | `#247C78` | diner enamel, station accents |
| Cream | `#FFF1D0` | paper, bun highlights, warm UI surfaces |
| Hot coral | `#FF5C70` | spicy cues, alerts, expressive reaction accents |
| Electric mint | `#5DF2C6` | active states, glow, positive feedback |
| Mustard yellow | `#F7C84B` | cheese, coins, reward bursts |
| Chili red | `#E33D3D` | chili, heat, warning state |
| Charcoal | `#332A31` | grill, patty, worn hardware |
| Fire orange | `#FF8A3D` | flame core and hot food payoff |

Use a clear value ladder: deep plum outlines/shadows, mid-color local materials, light cream food
highlights, and small mint/coral/yellow accents. The background stays lower contrast behind the
customer, order bubble, and active station.

## Line, material, and lighting treatment

- Use a soft, dark plum outline with a consistent family weight; avoid noisy ink texture.
- Surfaces are matte with a few deliberate highlights: enamel has worn edge glints, buns have
  toasted gradients, cheese has soft stretch highlights, metal has simple cool reflections.
- Lighting is warm top-left key light with cool violet ambient shadow. Fire adds warm orange light
  locally but does not recolor the entire scene.
- Detail density is highest on faces, food toppings, interaction surfaces, and transformation
  accents. Large backgrounds use simplified shapes and quiet texture.
- Avoid photorealism, pixel-art dithering, excessive grime, gore, horror anatomy, or photographic
  noise.

## Street Snack Bar composition

The first scene is a compact three-quarter 2D diner interior with a service counter in the lower
middle, customer presentation zone behind it, and stations readable in the foreground. It should
feel like a believable tiny business assembled from second-hand furniture: scuffed teal counter,
cream tile patches, warm pendant light, handwritten-looking decorative marks rendered as art only
when they are not localized copy, and a few empty upgrade sockets.

The background must leave low-detail negative space for UI overlays and preserve a strong contrast
plane behind Business Cat's face. The service counter is a separate asset so future upgrades can
replace it without repainting the room.

## Business Cat master reference

The first generated character asset must be a single approved **Business Cat master reference**.
No state, transformation, or attachment is generated before this reference is approved at native
game scale against the Street Snack Bar background.

Master design:

- small anthropomorphic cat with a compact, upright silhouette;
- warm caramel-orange fur with cream muzzle/chest and deep plum ear interiors;
- serious almond-shaped eyes, expressive brows, small triangular nose, compact muzzle;
- off-white shirt, slightly oversized plum tie, tiny collar points;
- short arms and visible paws designed as separate attachment layers;
- tail visible enough to become a readable fire accent later;
- neutral stance with feet and baseline fixed for every state;
- serious professional posture that becomes funny when the face betrays the food.

The reference locks exact proportions, fur colors, eye shape, muzzle placement, collar/tie geometry,
baseline, facing, outline, light direction, and attachment points. Every later state reuses this
reference and preserves identity. It is a production requirement, not an asset that exists yet.

## Character layers and state strategy

Required modular slots are body, head, eyes, pupils, mouth, arms, hands, accessories, and
mutation attachments/effects. Layers share one canvas, pivot, baseline, and color treatment.

Required readable states are idle, blink, talk, impatient, inspect-food, bite/chew, anticipation,
happy, shocked, too-hot, pay, and leave. Prefer static layer swaps plus Phaser tweens for body
lean, squash/stretch, small rotations, eye/pupil movement, and hand gestures. Use small sprite
sheets only for mouth/arms/attachments when a repeated frame sequence is clearer than tweening.

State direction:

- **idle:** upright, tiny breathing, occasional blink;
- **blink:** same head and eye anchors, short eye-lid swap;
- **talk:** mouth variants and one paw gesture, no full redraw;
- **impatient:** tie flick, brow angle, foot tap, restrained bounce;
- **inspect-food:** head/eye aim toward dish, paw reaches without changing baseline;
- **bite/chew:** mouth swap, head dip, cheek/muzzle squash;
- **anticipation:** pupils widen, shoulders lift, held micro-pause before reveal;
- **happy:** open smile, raised brows, small celebratory body pop;
- **shocked:** pupils shrink, mouth open, ears and tie pop upward;
- **too-hot:** red cheeks, watery eyes, tongue/steam gag, quick recoil;
- **pay:** relaxed smile, paw extends coin, tie settles;
- **leave:** three-quarter turn, tail follow-through, two-step exit loop.

## Flaming Business Cat

Flaming Business Cat keeps the exact master head, muzzle, body proportions, shirt collar, and
recognizable tie silhouette. It adds authored fire accents: small flame tufts at ear tips/tail,
glowing mint-to-yellow eyes with readable pupils, a singed tie edge as the visual joke, warm rim
light, and a compact fiery tail/effect attachment. Flames are rounded and playful with orange core,
coral midtone, and yellow highlight; no sharp horror spikes or threatening anatomy.

The transformation is communicated by authored attachment layers and effects, not arbitrary runtime
part mixing. The face remains cute and recognizable. The fire burst and transformation flash are
short pooled effects, with Phaser tweens/particles doing motion work instead of pre-rendering every
frame.

## Food direction: Hot Cheese Burger

The first order is **Hot Cheese Burger — Extra Spicy**. Burger layers must remain individually
legible: bottom bun, patty, cheese, chili, sauce, and top bun. Raw, cooked, perfect, and burned
patty states differ through clear color/value/texture cues, not tiny text labels. The extra-spicy
version adds a visible chili quantity/heat cue and a warm glow or steam accent without obscuring
the burger silhouette.

Food should look satisfying at small scale: broad highlights, soft irregularity, visible melt,
controlled sauce gloss, and a clean plate/tray separation. Burned is funny and darkened but not
inedible horror. Localized names and order copy stay runtime-rendered.

## Stations

Prep Board is a worn rounded wooden/teal board with a clear work surface, ingredient placement
areas, and a readable knife-safe visual cue. Grill is compact charcoal hardware with a warm grate,
handle, heat bands, and a small steam/sizzle area. Station art should expose a generous interaction
surface for touch and mouse, with no pixel-perfect target requirement.

## UI and effects

UI uses chunky rounded cards, high contrast, large touch targets, and runtime-rendered text. Order
bubbles feel like diner ticket + speech bubble hybrid; result cards are compact and scannable. Coin,
patience, station, and ingredient visuals must work without color alone. Every state has a shape or
motion cue in addition to color.

Small FX are reusable: sparkle, smoke, grill steam, fire burst, transformation flash, and coin
sparkle. Use them sparingly in tiers. Routine feedback gets a pop/bounce and one small particle
accent; transformations get a short anticipation pause, flash, burst, squash/stretch, and reward
burst. No constant screen shake, no persistent bloom, and no effect that blocks input.

## Technical art contract

- PNG/WebP only; transparent backgrounds for sprites, layers, UI ornament, and FX where appropriate.
- Source at the listed manifest resolution; export a mobile-appropriate runtime size after native
  scale review. Do not ship masters automatically.
- sRGB, clean alpha, stable crop bounds, shared pivots, and no baked text/localization.
- Use texture atlases by family/lifetime after measurement; keep large background separate.
- Prefer layered sprites, Phaser tweens, and pooled particles over unnecessary animation frames.
- Every generated/source asset remains unapproved until alpha, native-scale, in-engine, visual
  consistency, and provenance checks pass.
