# Project Instructions

## Product

This repository contains a new browser-based HTML5 game.

The exact game concept, genre, mechanics, progression, audience, monetization constraints,
and art direction are defined by project documentation and explicit user decisions.
Do not invent major product decisions without a request.

Potential targets include desktop browsers, mobile browsers, Yandex Games, CrazyGames, Poki,
GameDistribution, Playgama, and other suitable HTML5 portals.

## Engineering principles

- Keep gameplay/domain state separate from rendering and visual effects.
- Keep platform SDK integrations separate from gameplay code.
- Prefer deterministic and testable gameplay systems where practical.
- Prefer small modules with explicit responsibilities.
- Avoid unnecessary framework complexity and backend infrastructure.
- Avoid new production dependencies without a concrete benefit.
- Do not migrate frameworks or engines casually after one is selected.

## Module size and responsibility

- Hand-maintained runtime source files should ordinarily remain below roughly 300 lines. This is
  a firm architectural guideline, not a parser limit.
- Split files before they become monoliths, by cohesive responsibility rather than arbitrary
  line-count chunks. Scenes coordinate; domain services, controllers, presenters, queues, and
  station modules implement behavior.
- Do not create giant scene classes, catch-all managers, miscellaneous `Utils` modules, or
  multi-thousand-line content catalogs.
- Split authored content by chapter, content family, restaurant, rarity, or owning system.
- Generated files may exceed the guideline only when they are genuinely generated and clearly
  marked. Generation is not an excuse for maintaining a manual monolith.

## Platform boundary

Gameplay must not directly depend on YaGames, PokiSDK, CrazyGames SDK, GameDistribution SDK,
Playgama Bridge, or other portal SDK implementations.

When platform support is added, use a small capability-based provider/adapter boundary for
initialization, game ready, gameplay start/stop, ads, rewarded ads, saves, player, leaderboards,
purchases, language, platform/device information, and analytics hooks. Do not assume every portal
supports every capability.

## External platform source of truth

For external SDKs, APIs, portal requirements, monetization rules, and publishing requirements:

current official documentation > relevant installed Agent Skill > examples, blogs, and legacy code.

Verify changing platform APIs against current official documentation before implementation.

## Browser targets and performance

Design and validate relevant desktop and mobile sizes, touch, mouse, keyboard where appropriate,
responsive resizing, orientation changes, safe areas, and visibility/background changes.

Browser performance is a product requirement. Prefer fast startup, controlled bundle size,
predictable frame pacing, minimal hot-path allocations, optimized asset loading, and no unused
portal SDKs in a target build. Measure performance when practical rather than guessing.

## Skills

Use Agent Skills selectively. Start with the gamedev `router` for game-development work.
Use `develop-web-game` when available for browser implementation/testing. Use `game-ui-ux`,
`game-feel`, `input-systems`, `save-systems`, `performance-optimization`, `yandex-games-dev`,
the Playgama Bridge integration skill, relevant web-game-ad skills, and `portal-publish-readiness`
only when the task calls for them. Use engine-specific skills only after an engine is explicitly
selected. Do not load unrelated engine or platform skills.

## Testing and inspectability

For logic changes, run focused automated/state tests where practical. For visual, UI, or game-feel
changes, run the game in a browser and inspect rendered output. For input/mobile work, test the
relevant viewport and input method. For platform/lifecycle work, test initialization, pause/resume,
visibility, ad interruptions, and failure paths where feasible. Do not claim testing not performed.

As the game grows, prefer DEV-only deterministic scenarios, named test states, browser automation,
screenshots, state inspection, console-error inspection, and performance counters. Do not expose
unnecessary debug interfaces in production builds.

## Documentation routing

Use progressive disclosure; do not require every document for every task.

- `docs/GAME_DESIGN.md` — approved concept and design
- `docs/GAMEPLAY.md` — authoritative gameplay rules
- `docs/ARCHITECTURE.md` — actual technical architecture
- `docs/PLATFORMS.md` — actual portal integration strategy
- `docs/TESTING.md` — actual validation workflow
- `docs/RELEASE.md` — actual release/build requirements

Create these documents only when real project decisions exist.

## Instruction maintenance and external actions

Do not modify the global `AGENTS.md`, Codex configuration, this project `AGENTS.md`, or installed
third-party skills during ordinary feature work unless the user explicitly requests instruction
maintenance. Do not publish, deploy production, submit to portals, activate production ads or real
purchases, or change production credentials without explicit user instruction.

## Definition of done

For implementation tasks: inspect relevant context, implement, run relevant validation, inspect
actual behavior where applicable, fix regressions caused by the change, and report what was really
validated. Keep this document concise.
