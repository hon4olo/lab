---
name: portal-store-page-packaging
description: Use when preparing or fixing what players see before they click — title, thumbnail, screenshots, short description, tags and positioning for a portal listing. Also use when a game has decent retention but low traffic, which is usually a thumbnail problem rather than a game problem.
---

# Portal Store Page Packaging

Use this skill before publishing a browser game to a portal.

Core idea: players click the promise of the game before they play the game. Title, thumbnail, screenshots, tags, and short description must instantly communicate fantasy, genre, core verb, and reason to click.

## Inputs

- Game title
- One-sentence pitch
- Core fantasy
- Core verb
- Target player
- Thumbnail/icon
- 3-5 screenshots
- Short description
- Tags/genre
- Comparable games

## Review steps

1. Define positioning: target player, genre promise, fantasy promise, differentiator, reason to click.
2. Review title: readable, searchable, memorable, genre/fantasy signal, not misleading.
3. Review thumbnail: readable at 128x128, one strong subject, clear action/fantasy, high contrast, not too busy, no misleading render.
4. Review screenshots: #1 core action/fantasy, #2 reward/progression, #3 challenge/conflict, #4 variety/surprise.
5. Review description: fantasy/action, core loop/reward, progression/twist.
6. Review tags: match actual gameplay, do not overpromise, primary genre is clear.

## The thumbnail is the product

On a portal, the thumbnail competes against 40 others in a grid, at small size, against a player who is scrolling. It gets roughly **half a second** of attention, and no amount of game quality compensates for losing that half-second.

Diagnostic rule of thumb: if retention is decent but traffic is low, the problem is almost never the game. It is the thumbnail, then the title, in that order.

### Thumbnail rules

1. **Test at the size it will be seen.** Shrink it to 128×128 and look at it in a grid of competitors, not full-screen in isolation. Most thumbnails that fail, fail because they were only ever reviewed at 100%.
2. **One subject.** A character, a vehicle, a single dramatic object. Two competing focal points read as noise at small size.
3. **Face or front-facing subject if you have one.** Eyes attract attention in a grid; a rear view of a character does not.
4. **The subject should be doing the core verb.** If the game is about jumping, show mid-jump. A static portrait sells nothing.
5. **High contrast between subject and background.** Squint at it: the silhouette should still be legible.
6. **Avoid small text.** It is unreadable at thumbnail size and portals often overlay the title anyway. If you use a word, one word.
7. **Do not use a raw screenshot.** Gameplay framing is designed for playing, not for a 128px grid cell.
8. **Do not promise visuals the game does not deliver.** Overpromising raises the click and destroys the retention behind it, which is worse than a low click rate.

### Title rules

- **Two to four words.** Long titles get truncated in grids, and the truncation is not under your control.
- **Front-load the distinctive word.** If it truncates, what survives should still identify the game.
- **Genre or verb should be inferable.** "Rooftop Dash" tells you more than "Aetheria".
- **Searchable beats clever.** Players search for what they want to do.
- **Avoid names that collide** with an established game — you will lose the search result to it forever.

### Screenshot order

Portals show them in order and most players see the first two. Spend them accordingly.

| Slot | Job | Common mistake |
|---|---|---|
| 1 | The core verb, mid-action | A menu, or a wide shot with nothing happening |
| 2 | Reward or progression — what you are working toward | Another shot that looks like #1 |
| 3 | Challenge or conflict — why it is not trivial | Empty level geometry |
| 4 | Variety — a different biome, mode or enemy | More of the same |

If two screenshots are indistinguishable at a glance, one of them is wasted.

### Description

Portal listings truncate hard. Write it in this order:

1. **First sentence:** the fantasy and the verb. This is the only sentence most people read.
2. **Second sentence:** the loop and the reward.
3. **Third sentence:** the twist, mode, or variety hook.

No studio history, no "we hope you enjoy", no feature bullet lists. The description competes with the play button, and the play button should win.

### Tags

- Match what the game actually is. Mis-tagging sends you traffic that bounces, and bounce rate feeds portal ranking.
- Primary genre first and unambiguous.
- Do not tag a genre you merely gesture at. A runner with three upgrades is not an RPG.

## Testing, not guessing

If the portal supports thumbnail A/B tests, use them — this is one of the few places where a small change has a large, measurable effect.

- Test **one variable** at a time. A new thumbnail with a new title teaches you nothing.
- Run for at least a full week to cover weekday and weekend traffic.
- Judge on click-through **and** on what happens after the click. A thumbnail that raises clicks and lowers play time is a lie that the portal's ranking will eventually punish.

Without platform A/B support, the cheap substitute is a grid test: put your thumbnail among ten competitors, show it to five people for two seconds, and ask which they would click and what they think the game is.

## Output

```md
# Portal Store Page Packaging Review

## Verdict
Pass / Needs Work / Blocker

## Positioning
- Target player:
- Genre promise:
- Fantasy promise:
- Core verb:
- Differentiator:
- Reason to click:

## Title
- Current:
- Status:
- Risks:
- Better alternatives:

## Thumbnail
- Status:
- Main issue:
- Suggested composition:
- Remove:
- Emphasize:

## Screenshots
| Order | Purpose | Issue | Fix |
|---|---|---|---|
| 1 | Core action/fantasy |  |  |
| 2 | Reward/progression |  |  |
| 3 | Challenge/conflict |  |  |
| 4 | Variety/surprise |  |  |

## Description
- Current problem:
- Suggested version:

## Tags
- Keep:
- Add:
- Remove:

## Top Problems
1. **[Severity] Problem**
   - Fix:
   - Validation:

## A/B Tests
- Title A/B:
- Thumbnail A/B:
- Description A/B:
```

## References

Read these alongside this skill:

- [Thumbnail Checklist](references/thumbnail-checklist.md)
- [Title and Description Template](references/title-description-template.md)
