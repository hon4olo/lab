---
name: analytics-retention-instrumentation
description: Use when deciding what to track in a web game — building an event taxonomy, funnels, retention metrics and a validation plan, or fixing analytics that cannot answer the question being asked. Run before launch, and before any ad revenue debugging, since bad instrumentation makes diagnosis impossible.
---

# Analytics Retention Instrumentation

Use this skill when adding analytics to a prototype, soft launch, portal release, or live update.

Source layer: GameAnalytics design/progression events, GA4/Firebase event model, Amplitude-style taxonomy planning, and game-specific telemetry practice.

## Core goal

Turn design questions into events, funnels, segments, and metrics. Do not track everything. Track decisions.

## Inputs

- Game genre
- Core loop
- First 60 seconds
- Level/run structure
- Progression/economy
- Ad placements
- Current hypotheses
- Known churn points
- Analytics tool

## Event design principles

1. Every event should answer a question.
2. Use consistent names.
3. Add useful properties, not huge payloads.
4. Track progression states separately from generic custom events.
5. Track both ad offer and ad acceptance.
6. Track decline/continue-without-ad.
7. Track first-session milestones.
8. Track failure reason if knowable.
9. Segment by device/input/version/source when possible.
10. Avoid personally sensitive data.

## Core event taxonomy

### Lifecycle

- game_loaded
- loading_complete
- session_start
- session_end
- app_focus_lost
- app_focus_returned

### First session

- first_input
- first_core_action
- first_success
- first_fail
- first_reward
- tutorial_step_start
- tutorial_step_complete
- tutorial_skip

### Progression

- level_start
- level_complete
- level_fail
- run_start
- run_end
- checkpoint_reached
- world_unlocked
- mechanic_unlocked

### Gameplay

- core_action_used
- enemy_defeated
- item_collected
- damage_taken
- death
- combo_reached
- objective_complete

### Economy

- currency_earned
- currency_spent
- upgrade_view
- upgrade_buy
- item_unlock
- shop_open

### Ads

- ad_offer
- ad_accept
- ad_decline
- ad_start
- ad_complete
- ad_fail
- rewarded_reward_granted
- interstitial_shown

### UX problems

- settings_open
- controls_changed
- restart_clicked
- quit_to_menu
- error_shown
- performance_warning

## Required funnels

### First-session funnel

```txt
game_loaded -> loading_complete -> first_input -> first_success -> first_reward -> level_complete
```

### Level funnel

```txt
level_start -> first_fail or level_complete -> next_level_start
```

### Rewarded ad funnel

```txt
ad_offer -> ad_accept/ad_decline -> ad_start -> ad_complete -> reward_granted -> continue_playing
```

### Upgrade funnel

```txt
currency_earned -> shop_open -> upgrade_view -> upgrade_buy -> next_level_start
```

## Key metrics

- time_to_first_input
- time_to_first_reward
- first_session_length
- level_1_completion_rate
- level_fail_rate_by_reason
- tutorial_completion_rate
- first_upgrade_time
- upgrade_pick_rate
- rewarded_ad_accept_rate
- rewarded_ad_decline_rate
- churn_after_ad_offer
- churn_after_interstitial
- replay_rate
- return_rate
- device/input split

## Output

```md
# Analytics Retention Instrumentation Plan

## Main Questions
1.
2.
3.

## Event Taxonomy
| Event | When fired | Properties | Question answered |
|---|---|---|---|

## Funnels
| Funnel | Steps | Success metric | Risk measured |
|---|---|---|---|

## Segments
- device:
- input:
- version:
- level:
- player type:
- acquisition/source:

## Metrics Dashboard
| Metric | Why it matters | Good/bad signal |
|---|---|---|

## Implementation Notes
- Naming:
- Required properties:
- Events to avoid:
- Privacy risks:

## Validation
- Test script:
- Debug checks:
- Expected event order:
```

## References

Read these alongside this skill:

- [Event Taxonomy Rules](references/event-taxonomy.md)
- [Funnel Templates](references/funnel-templates.md)
