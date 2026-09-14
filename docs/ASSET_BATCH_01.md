# Snack Lab — Asset Batch 01

All entries below are production plans only. No listed asset currently exists. Every entry is
`planned` and `awaiting-generation` in the manifest. The Business Cat layers share one master
reference that must be approved before any state family is produced.

## Customer: Business Cat

### `customer.business-cat.body`

- **Visual brief:** Compact caramel-orange anthropomorphic cat torso and legs, cream chest, serious professional posture; small, warm, charming silhouette.
- **Source size:** 512×512 px master layer; shared 512×512 character canvas.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Base body for idle, impatient, inspect-food, anticipation, happy, shocked, too-hot, pay, and leave; blink/talk/chew use attached layers and tweens.
- **Runtime notes:** Bottom-center baseline; layered sprite; Phaser tween for breathing, lean, recoil, pop, and exit.
- **Consistency constraints:** Locked master proportions, caramel/cream fur colors, warm top-left light, deep-plum outline, facing, baseline, and attachment points.

### `customer.business-cat.head`

- **Visual brief:** Rounded cat head with triangular ears, cream muzzle/chest transition, small triangular nose, and readable serious expression.
- **Source size:** 512×512 px master layer; head occupies the shared character canvas.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Reused head for all 12 states; inspect-food, bite/chew, anticipation, and too-hot add transform offsets rather than redraws.
- **Runtime notes:** Stable muzzle/ear anchors; Phaser tween for head dip, recoil, squash/stretch, and look direction.
- **Consistency constraints:** Exact master head silhouette, ear geometry, muzzle placement, outline weight, light direction, and baseline must never drift.

### `customer.business-cat.eyes`

- **Visual brief:** Serious almond-shaped eyes with expressive upper lids and simple readable whites/iris treatment.
- **Source size:** 512×512 px layer with aligned state variants; no baked labels.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Idle, blink, inspect-food, anticipation, happy, shocked, too-hot; blink can be a 2–3 frame sheet if needed.
- **Runtime notes:** Layer above head; eye-lid swap and Phaser tweens for widening, narrowing, and quick anticipation pause.
- **Consistency constraints:** Eye angle, spacing, pupil anchor, palette, and expression vocabulary derive from the approved master reference.

### `customer.business-cat.pupils`

- **Visual brief:** Compact dark pupils with small highlight option, capable of focused inspection, widening anticipation, and comic shock.
- **Source size:** 256×256 px aligned layer within the 512×512 character canvas.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Idle micro-look, inspect-food focus, anticipation widen, shocked shrink, too-hot jitter.
- **Runtime notes:** Keep movement bounded to eye sockets; use tweens, not frame-heavy animation.
- **Consistency constraints:** Never change eye spacing or socket geometry; retain deep-plum pupil color and controlled highlight size.

### `customer.business-cat.mouth`

- **Visual brief:** Small expressive muzzle/mouth set: neutral, talk, closed smile, bite, chew, shocked open, and too-hot tongue gag.
- **Source size:** 512×512 px layer with 7 aligned mouth states, or equivalent atlas slots.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Talk loop, bite/chew loop, happy, shocked, too-hot, and negative reaction support.
- **Runtime notes:** Swap authored mouth cells and add tiny squash/stretch; no localized dialogue baked into art.
- **Consistency constraints:** Preserve muzzle shape, mouth baseline, line weight, and expression scale from the master reference.

### `customer.business-cat.arms`

- **Visual brief:** Short shirt sleeves and forearms with clear gesture silhouettes, preserving the compact business-cat posture.
- **Source size:** 512×512 px layer with aligned pose variants.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Idle, talk gesture, impatient tap cue, inspect-food reach, anticipation lift, happy raise, pay extension, leave turn.
- **Runtime notes:** Phaser tweens for gesture arcs; keep touch-critical food area unobstructed.
- **Consistency constraints:** Sleeve color, shoulder anchors, limb length, and gesture range are locked to the master reference.

### `customer.business-cat.hands`

- **Visual brief:** Two small cat paws/hands with readable mitten-like silhouettes; one hand can present a coin.
- **Source size:** 256×256 px per hand layer within the shared canvas.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Inspect-food point/reach, bite support, pay pose, happy gesture, and leave follow-through.
- **Runtime notes:** Layer above arms; use small pose swaps and eased tweens, never pixel-perfect placement.
- **Consistency constraints:** Paw shape, cream fur accent, hand attachment points, and outline match the master reference.

### `customer.business-cat.accessories`

- **Visual brief:** Off-white shirt collar and slightly oversized deep-plum tie; tie is the core business joke and silhouette cue.
- **Source size:** 512×512 px aligned accessory layer.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Static base plus tie flick for impatient, lift for shocked, settle for pay/leave, and singed variant for Flaming Business Cat.
- **Runtime notes:** Separate collar/tie sublayers if that reduces redraws; tween tie rotation and vertical offset.
- **Consistency constraints:** Collar angle, tie width, knot, plum color, and attachment anchor remain identical across every state and transformation.

### `customer.business-cat.mutation.fire-accents`

- **Visual brief:** Playful rounded flame tufts at ear tips and tail, warm rim-light accents, and a few small ember shapes; clearly funny, not scary.
- **Source size:** 512×512 px attachment layer; optional 4-frame 512×512 effect strip only if motion cannot be tweened.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Flaming Business Cat transformation attachment; fire tail/ear accents remain readable in happy, shocked, too-hot, pay, and leave variants.
- **Runtime notes:** Layered over master character; Phaser additive/alpha tween and pooled ember particles.
- **Consistency constraints:** Preserve master head/body/tie identity; fire palette uses orange/coral/yellow, no horror spikes, no full-body replacement.

### `customer.business-cat.mutation.glow-eyes`

- **Visual brief:** Small controlled eye-glow overlay with visible pupils retained; comedic “too much spice” energy.
- **Source size:** 256×256 px aligned eye overlay.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Flaming Business Cat eye reveal and anticipation accent.
- **Runtime notes:** Phaser alpha/pulse tween; glow must remain localized and cheap on mobile.
- **Consistency constraints:** Eye shape and pupil positions remain those of the master; mint/yellow glow cannot erase the face.

### `customer.business-cat.mutation.singed-tie`

- **Visual brief:** Master tie with a small singed edge and one curled smoke wisp, preserving the business silhouette.
- **Source size:** 256×256 px aligned accessory variant.
- **Transparency:** Transparent PNG/WebP layer.
- **Layer/animation role:** Flaming Business Cat joke attachment for transformation reveal and post-reveal idle.
- **Runtime notes:** Swap only the tie edge variant; smoke is a separate reusable FX asset.
- **Consistency constraints:** Same knot, width, anchor, and plum base color as the master tie; singe is a small readable joke, not damage detail.

## Food: Hot Cheese Burger — Extra Spicy

### `food.burger.bottom-bun`

- **Visual brief:** Warm toasted bottom bun, broad rounded base, soft crumb edge, appetizing highlight.
- **Source size:** 384×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Burger stack base and assembly layer.
- **Runtime notes:** Bottom-center anchor; stackable sprite with small landing bounce.
- **Consistency constraints:** Shared burger perspective, warm key light, cream/toast palette, deep-plum outline, readable at 48 px wide.

### `food.burger.patty.raw`

- **Visual brief:** Raw rounded patty with cool red-brown center and subtle texture, clearly uncooked but still appetizing.
- **Source size:** 384×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Raw Grill input state.
- **Runtime notes:** Same stack bounds as all patty variants; state swap, no unnecessary animation sheet.
- **Consistency constraints:** Identical silhouette and anchor to cooked/perfect/burned variants; state difference comes from value, heat cues, and texture.

### `food.burger.patty.cooked`

- **Visual brief:** Cooked patty with warm brown sear, readable grill marks, and soft edge.
- **Source size:** 384×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Cooked-but-not-perfect Grill state.
- **Runtime notes:** Shared patty slot; optional one-frame steam/shine effect handled by FX, not baked.
- **Consistency constraints:** Same silhouette, perspective, and stack alignment as every patty state.

### `food.burger.patty.perfect`

- **Visual brief:** Rich brown patty with clear sear pattern, juicy highlight, and a small satisfying heat cue.
- **Source size:** 384×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Perfect Grill state and high-COOK reward presentation.
- **Runtime notes:** State swap plus tiny bounce/score burst; no baked score text.
- **Consistency constraints:** Same patty outline/crop/anchor as raw, cooked, and burned; clearly superior without photorealistic detail.

### `food.burger.patty.burned`

- **Visual brief:** Comically over-charred patty with blackened edge, a few gray ash marks, and a tiny smoke cue; funny, not gross.
- **Source size:** 384×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Burned Grill state and alternate-reaction input.
- **Runtime notes:** Add smoke through reusable FX; no baked flame loop.
- **Consistency constraints:** Preserve exact patty silhouette and anchor; dark state remains legible against the counter.

### `food.burger.cheese`

- **Visual brief:** Bright mustard-yellow cheese slice with soft corners and two melted drips over the patty.
- **Source size:** 384×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Burger stack layer; melt accent after Grill.
- **Runtime notes:** Layer above patty; Phaser tween for a short melt settle, not a long pre-rendered animation.
- **Consistency constraints:** Must align to the common burger stack, use `#F7C84B` role color, and retain a readable cheese silhouette at mobile scale.

### `food.burger.chili`

- **Visual brief:** Three chunky red chili slices with seeds and curved silhouettes, instantly reading as spicy.
- **Source size:** 256×256 px atlas with 3 aligned chili variants.
- **Transparency:** Transparent PNG/WebP sprite/atlas.
- **Layer/animation role:** Ingredient selection, assembly, and extra-spicy quantity cue.
- **Runtime notes:** Reusable instances with small rotation/bounce; avoid tiny scattered pieces.
- **Consistency constraints:** Chili red, strong silhouette, same warm key light, no text labels or localization baked into the art.

### `food.burger.sauce`

- **Visual brief:** Glossy red-orange spicy sauce dollop/stripe with controlled highlight and a playful drip.
- **Source size:** 384×256 px master sprite plus one short drag-path variant if required.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Sauce station/assembly layer and heat cue.
- **Runtime notes:** Use Phaser tween for squeeze/pop and a small particle accent; preserve broad touch target.
- **Consistency constraints:** Sauce remains distinct from chili and cheese by silhouette and gloss; no text baked in.

### `food.burger.top-bun`

- **Visual brief:** Rounded toasted top bun with sesame seeds, warm highlight, and slightly imperfect handmade charm.
- **Source size:** 384×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Burger stack cap and serve reveal.
- **Runtime notes:** Top-center anchor; Phaser squash/stretch on final assembly.
- **Consistency constraints:** Same burger perspective, outline, light direction, and stack width as bottom bun and finished burger.

### `food.burger.finished`

- **Visual brief:** Fully assembled Hot Cheese Burger with visible layers, one chili, sauce, melted cheese, and a clean tray/plate separation.
- **Source size:** 512×512 px assembled master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Served food, inspection, bite, payment, and result reveal; can be assembled from layers when interaction needs it.
- **Runtime notes:** Keep layered source references available; finished composite is a performance-friendly presentation asset where appropriate.
- **Consistency constraints:** Exact component alignment and palette; appetizing silhouette must read at small mobile display size.

### `food.burger.extra-spicy`

- **Visual brief:** Finished burger with visibly increased chili, warmer sauce glow, tiny steam curls, and a comedic “this is a lot” silhouette.
- **Source size:** 512×512 px assembled variant.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Extra-Spicy order target and transformation trigger input.
- **Runtime notes:** Reuse finished burger layers; steam/glow come from pooled FX/tweens where possible.
- **Consistency constraints:** Must remain the same burger, not a new food; heat accents use coral/orange and never obscure ingredient identity.

## Stations and location

### `station.prep-board.street`

- **Visual brief:** Worn rounded prep board with teal edge, warm wood work surface, safe knife cue, and generous ingredient placement area.
- **Source size:** 768×512 px scene sprite.
- **Transparency:** Transparent PNG/WebP with separate board shadow if needed.
- **Layer/animation role:** Prep Board station body and touch interaction surface.
- **Runtime notes:** Anchor at work-surface center; use Phaser highlight/bounce for selected ingredients rather than baked states.
- **Consistency constraints:** Street Snack Bar materials, warm top-left light, chunky silhouette, no tiny text, no false collision edges.

### `station.grill.street`

- **Visual brief:** Compact charcoal grill with worn teal housing, dark grate, handle, heat bands, and a readable warm center.
- **Source size:** 768×512 px scene sprite.
- **Transparency:** Transparent PNG/WebP with separate heat/steam overlays.
- **Layer/animation role:** Grill station body; raw/cooked/perfect/burned states are food/FX states, not separate grill redraws.
- **Runtime notes:** Phaser tween for lid/heat feedback; pooled grill steam and sizzle FX; large interaction surface.
- **Consistency constraints:** Same Street Snack Bar material language, strong silhouette at mobile scale, no photorealistic metal noise.

### `background.street-snack-bar`

- **Visual brief:** Small cheap but charming diner interior: worn teal/cream walls, warm lamp, modest shelves, scuffed tile, and visible upgrade sockets.
- **Source size:** 2048×1152 px scene background master.
- **Transparency:** Opaque WebP runtime background; PNG master if needed for edge fidelity.
- **Layer/animation role:** First restaurant background; static low-contrast playfield behind customer/UI/stations.
- **Runtime notes:** Keep separate background/counter planes where composition benefits; compress and inspect on mobile.
- **Consistency constraints:** Quiet contrast behind Business Cat face, warm top-left light, no localized text baked into signage, clear upgradeable charm.

### `environment.service-counter.street`

- **Visual brief:** Scuffed teal service counter with cream trim, tray shelf, small register space, and visible but non-intrusive upgrade attachment points.
- **Source size:** 1536×768 px scene sprite.
- **Transparency:** Transparent PNG/WebP foreground layer with separate shadow if useful.
- **Layer/animation role:** Counter plane between customer and stations; future upgrade replacement target.
- **Runtime notes:** Anchor to a stable world baseline; keep foreground edge from covering touch targets or customer face.
- **Consistency constraints:** Must belong to the same worn-enamel material family as Prep Board and Grill; no baked UI labels.

## UI assets

### `ui.order-bubble.street`

- **Visual brief:** Chunky cream ticket/speech bubble hybrid with a small coral heat tab and clean interior for runtime order text/icons.
- **Source size:** 768×384 px 9-slice master.
- **Transparency:** Transparent PNG/WebP frame/ornament; text area remains empty.
- **Layer/animation role:** Order display for Hot Cheese Burger — Extra Spicy and future order families.
- **Runtime notes:** 9-slice/container-friendly; anchor to customer/order region; responsive portrait and desktop layouts.
- **Consistency constraints:** No baked language, words, numbers, or fixed ingredient labels; high contrast against Street Snack Bar background.

### `ui.ingredient-slot`

- **Visual brief:** Rounded compact slot with cream base, deep-plum border, selected mint state, and warning coral state.
- **Source size:** 192×192 px 9-slice/slot master.
- **Transparency:** Transparent PNG/WebP ornament with empty center for runtime icon.
- **Layer/animation role:** Ingredient picker, assembly list, and modifier slot.
- **Runtime notes:** Large touch target; state communicated by shape/outline plus color; icon and label rendered separately.
- **Consistency constraints:** Same UI corner radius, outline, palette roles, and no baked text.

### `ui.station-tab`

- **Visual brief:** Chunky station button/tab frame with active mint glow notch, inactive teal/cream treatment, and clear touch affordance.
- **Source size:** 384×192 px 9-slice master.
- **Transparency:** Transparent PNG/WebP frame/ornament.
- **Layer/animation role:** Prep Board and Grill tabs; extensible to later stations.
- **Runtime notes:** Container-resized, focus/pressed states via runtime styling/tweens; icon and text separate.
- **Consistency constraints:** No baked station names; active state must remain readable without hover.

### `ui.coin-icon`

- **Visual brief:** Original chunky coin with a stylized snack-lab star/spark mark, mustard face, coral rim, and deep-plum shadow.
- **Source size:** 256×256 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Currency HUD, payment burst, result card, and coin sparkle anchor.
- **Runtime notes:** Phaser pop/rotate tween; atlas with other small UI reward icons only after measurement.
- **Consistency constraints:** Must not resemble a portal coin or known game currency; no baked denomination.

### `ui.result-card.compact`

- **Visual brief:** Compact layered result card with three visual meter bays for ORDER, COOK, and CHAOS, leaving copy/numbers to runtime UI.
- **Source size:** 768×512 px 9-slice master.
- **Transparency:** Transparent PNG/WebP frame/ornament.
- **Layer/animation role:** Post-serve result and reward burst surface.
- **Runtime notes:** Responsive card; event-driven meter updates; supports portrait bottom sheet and desktop side card.
- **Consistency constraints:** No baked labels/numbers; ORDER/COOK/CHAOS states need shape and icon cues in addition to color.

### `ui.patience-indicator`

- **Visual brief:** Rounded patience meter frame with friendly face/clock cue, calm mint-to-coral progression geometry, and chunky segments.
- **Source size:** 384×128 px 9-slice master.
- **Transparency:** Transparent PNG/WebP frame/ornament.
- **Layer/animation role:** Customer patience HUD and warning state.
- **Runtime notes:** Runtime fill and pulse; readable in portrait near the order and in desktop customer column.
- **Consistency constraints:** No tiny text or color-only state; geometry and icon must remain clear for color-vision differences.

## Reusable effects

### `fx.sparkle.small`

- **Visual brief:** Four-point mint/yellow sparkle with soft secondary dot, clean cartoon edge.
- **Source size:** 128×128 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Small success, selected ingredient, perfect cook accent.
- **Runtime notes:** Pool and rotate with Phaser tween/particle emitter; short lifetime.
- **Consistency constraints:** Match UI mint/yellow palette; no persistent bloom or noisy overdraw.

### `fx.smoke.small`

- **Visual brief:** Two or three rounded violet-gray smoke puffs with a playful curl.
- **Source size:** 192×192 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Burned patty, singed tie, and grill mistake cue.
- **Runtime notes:** Pool; alpha/scale tween; keep opacity low enough not to hide food/face.
- **Consistency constraints:** Funny and lightweight, not toxic/horror smoke; deep-plum/gray palette.

### `fx.grill-steam`

- **Visual brief:** Warm cream-to-teal steam curls with a tiny coral heat glint.
- **Source size:** 256×256 px master sprite or 4-frame 1024×256 strip if a loop needs authored shape changes.
- **Transparency:** Transparent PNG/WebP sprite/sheet.
- **Layer/animation role:** Grill sizzle, perfect patty, and extra-spicy burger heat cue.
- **Runtime notes:** Prefer pooled particles and tweens; keep emission capped for mobile.
- **Consistency constraints:** Must read as steam/heat, not smoke; preserve clear food silhouette.

### `fx.fire-burst`

- **Visual brief:** Compact playful orange/coral/yellow flame burst with rounded lobes and ember dots.
- **Source size:** 256×256 px master sprite; optional 4-frame 1024×256 strip.
- **Transparency:** Transparent PNG/WebP sprite/sheet.
- **Layer/animation role:** Flaming Business Cat reveal and high-Chaos payoff.
- **Runtime notes:** Pooled particle burst plus scale/alpha tween; avoid full-screen fire overdraw.
- **Consistency constraints:** Same fire palette and friendly rounded language as mutation attachments; no scary flame anatomy.

### `fx.transformation-flash`

- **Visual brief:** Short cream/mint flash shape with coral edge starburst, designed as an impact transition rather than a white screen.
- **Source size:** 512×512 px master overlay sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Transformation reveal flash between anticipation and authored appearance swap.
- **Runtime notes:** Alpha tween under reduced-flashing setting; never block input longer than the reveal sequence requires.
- **Consistency constraints:** High contrast but not blinding; no baked text; compatible with all backgrounds.

### `fx.coin-sparkle`

- **Visual brief:** Small mustard coin glint with mint/coral star accents, subordinate to the coin icon.
- **Source size:** 128×128 px master sprite.
- **Transparency:** Transparent PNG/WebP sprite.
- **Layer/animation role:** Payment, tip, and result reward burst.
- **Runtime notes:** Pool with coin icon; Phaser arc/pop tween; cap simultaneous instances.
- **Consistency constraints:** Same original coin language, no denomination, no excessive glitter or screen clutter.
