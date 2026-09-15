# Snack Lab documentation

Read documentation progressively; do not load every file for every task.

## Current source of truth

1. `../AGENTS.md` — repository-wide engineering/product instructions.
2. `GAME_DESIGN.md` — product concept, scale, progression, retention intent.
3. `STATION_GAMEPLAY.md` — canonical hands-on Order → Prep → Grill → Build → Serve flow.
4. `GAMEPLAY.md` — current rules, scoring, transformations, shift behavior, migration status.
5. `ARCHITECTURE.md` — code ownership and technical boundaries.
6. `ART_DIRECTION.md` — visual style and station-screen composition rules.
7. `ASSET_PIPELINE.md` — production asset contract and approval process.
8. `ASSET_BATCH_03_REQUIREMENTS.md` — exact art required to enable the next station rebuild.
9. `TESTING.md` — automated/domain/browser/visual QA workflow.
10. `AGENT_SKILLS.md` — project skill routing.

## Historical / batch QA documents

- `ASSET_BATCH_01.md`
- `ASSET_BATCH_02.md`

These record earlier import/QA history. They are not allowed to override newer gameplay, art, or
station decisions.

## Key current decision

Snack Lab is a hands-on station game. Do not regress to a single cluttered scene or to
`select ingredients → press Assemble → finished-food PNG`. Spatial food preparation is now an
authoritative gameplay requirement; see `STATION_GAMEPLAY.md`.
