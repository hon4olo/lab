# Agent skill routing

Use skills selectively. Do not load the full catalog for routine work.

## Default for substantial Snack Lab work

Start with:

- `.agents/skills/snack-lab-production/SKILL.md`

This is the project-specific workflow and overrides generic assumptions about station structure,
assembly, placeholders, and visual QA.

## Compose only when relevant

### UI / station layout

- `game-ui-ux`
- `player-cognition-ux-review`
- `humane-ui-stress-case-review` when appropriate

### Pointer/touch manipulation

- `input-systems`

### Feedback / responsiveness

- `game-feel`
- `audio-design` when audio is in scope

### Asset generation/import

- `create-game-assets`

Always combine with project art/asset docs. Generic asset generation must not override Snack Lab's
approved style or no-placeholder rule.

### Performance

- `performance-optimization`

Use after measuring startup/runtime behavior; do not prematurely rewrite working Phaser systems.

### Saves

- save-system skill if available/relevant; preserve current versioned/idempotent save architecture.

### Portal integration

Only when explicitly working on a portal:

- `yandex-games-dev` / current official Yandex documentation
- `playgama-bridge-integration`
- relevant web-game ad skills
- `portal-publish-readiness`
- `portal-store-page-packaging`
- consent/privacy skills when monetization requires them

Official current portal documentation is the source of truth for changing APIs/policies.

## Current station-development rule

Before implementing Prep/Grill/Build presentation, read:

- `docs/STATION_GAMEPLAY.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_DIRECTION.md`
- `docs/ASSET_BATCH_03_REQUIREMENTS.md`

Do not let a generic skill turn the game back into a single scene or one-click assembly.
