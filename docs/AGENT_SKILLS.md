# Agent Skills

Project-local skills are installed under `.agents/skills/` and are discovered by Codex from this
repository. This file records provenance and routing only; the installed `SKILL.md` files remain the
source for each skill's instructions.

Current project-local skill count: 25.

## Built-in

- `develop-web-game` — not available in the current Codex skill catalog or official OpenAI skills
  repository at bootstrap time.

## Game development pack

- `router`, `create-game-assets`, `save-systems`, `audio-design`, `level-design`, `input-systems`,
  `game-feel`, `game-ui-ux`, `performance-optimization`, `prototype-fast`, `puzzle`,
  `procedural-gen`, `physics-tuning`, `camera-systems`
  — `gamedev-skills/awesome-gamedev-agent-skills`.

- `web-game-foundations` — official OpenAI [Game Studio plugin](https://github.com/openai/plugins),
  architecture-first browser-game foundation. Its references are vendored inside the skill so
  relative links remain valid in project-local discovery.

## Platform and review skills

- `yandex-games-dev` — `Ayubjon/yandex-games-skill`; complete bundle retained.
- `playgama-bridge-integration` — `Playgama/bridge-claude-plugins`; the source skill is named
  `integration`, so its local metadata name was made unique without changing its instructions.
- `web-game-ad-monetization-implementation`, `f2p-monetization-ethics-review`,
  `ad-consent-privacy-compliance`, `portal-publish-readiness`, `virtual-economy-review`,
  `multi-lens-design-review`, `player-cognition-ux-review`, `systems-balance-characteristics-review`,
  `humane-ui-stress-case-review`, `portal-store-page-packaging`, `analytics-retention-instrumentation`,
  `web-performance-input-qa` — `horn111/web-game-ad-skills`.

## Important boundaries

- No engine-specific skills are installed until an engine is selected.
- No SDK, ad manager, analytics runtime, or Playgama Bridge runtime is part of the project.
- Official platform documentation remains authoritative over skill references.
