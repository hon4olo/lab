---
name: ad-consent-privacy-compliance
description: Use when a web game shows ads and needs consent, privacy or child-audience handling — GDPR/TCF consent flow, CCPA/CPRA opt-out, COPPA and child-directed treatment, analytics identifiers, data in localStorage, privacy policy content, or "is our game child-directed?" questions. Use before publishing to any ad-supported portal.
---

# Ad Consent Privacy Compliance

Use this skill when a game monetizes with ads or collects analytics, and you need to know what consent and privacy obligations follow.

Source layer: GDPR/ePrivacy, IAB TCF, CCPA/CPRA, COPPA and platform publisher terms. Verify against current regulator and platform documentation before shipping — this area changes faster than SDK APIs do.

**This is not legal advice.** It is an engineering checklist that tells you which questions have expensive answers.

## Core goal

Determine three things, in this order:

1. **Who is running the consent flow** — you, or the portal?
2. **Is the game child-directed or mixed-audience?** This changes everything downstream.
3. **What identifiers does the game itself store or transmit**, separately from the ad SDK?

Most web game developers get 1 wrong (assuming they must build a CMP when the portal already has one) and 3 wrong (forgetting their own analytics and save data).

## Who runs consent

| Distribution | Who typically handles consent | What you still own |
|---|---|---|
| Portal-hosted (CrazyGames, Poki, Yandex Games) | The portal, as the publisher of record | Your own analytics, your own storage, your own third-party scripts |
| Self-hosted with a portal SDK | Usually you | Everything |
| Self-hosted with a direct ad network | You | Everything |
| Embedded via iframe on someone else's site | The embedding site, usually | Your own analytics and storage |

**The trap:** developers on portals correctly conclude "the portal handles ad consent" and then ship their own GameAnalytics or GA4 integration with no consent gate at all. The portal's consent covers the portal's ad stack, not your telemetry.

**Action:** confirm in writing (publisher terms or support ticket) who is the controller for ad data on your target platform. Record the answer in your repo. Do not infer it.

## Child-directed determination

This is the highest-stakes question in the whole skill, because getting it wrong exposes you to COPPA penalties and gets you removed from ad networks.

A game is likely **child-directed** if several of these hold:

- subject matter aimed at under-13s: cartoon animals, nursery themes, simple colouring/dress-up
- visual style and music aimed at young children
- child actors or child-oriented celebrities/characters
- advertising for the game placed on child-directed media
- your own analytics show a substantial under-13 audience
- the portal categorises it under a kids/children section

A game is likely **mixed-audience** if it appeals broadly but attracts a meaningful child audience — which describes a large share of casual browser games. Mixed-audience games may use a neutral age screen rather than treating all users as children.

**If child-directed or treating a user as a child:**

- no personalized/behavioural advertising — contextual only
- no persistent identifiers for ad targeting
- no collection of geolocation, contacts, photos, voice, or free-text chat
- verifiable parental consent required before any personal data collection
- the ad SDK must be told: most SDKs expose a "tag for child-directed treatment" or child-audience flag. Set it. It is usually one boolean and it is the difference between compliant and not
- no external links, social sharing or "rate us" prompts that leave to unrestricted destinations

**Do not guess.** If two people on the team disagree about whether the game is child-directed, that disagreement is itself the signal to get a lawyer.

## GDPR / ePrivacy checklist

Applies when any of your players are in the EU/EEA or UK, regardless of where you are.

- **Consent before, not after.** Non-essential storage and ad calls must not fire before the player has made a choice. A consent banner that loads after the ad SDK has already initialised is decorative.
- **Rejecting must be as easy as accepting.** Equal prominence, same number of clicks. "Accept all" vs a buried "Manage preferences" link is a documented enforcement target.
- **No pre-ticked boxes**, no legitimate-interest fallback for ad personalisation.
- **Withdrawal must be available** at any time — a "Privacy settings" entry in your options menu.
- **Record the consent signal** and pass it to every downstream SDK. If you use an IAB TCF CMP, the TC string must reach your analytics too.
- **Contextual ads still need care.** Serving non-personalized ads reduces obligations but does not eliminate them; the ad request still involves an IP address.

## CCPA / CPRA checklist

Applies to California residents; several US states have similar laws with different thresholds.

- Provide a "Do Not Sell or Share My Personal Information" path if ad data is shared for cross-context behavioural advertising.
- Honour Global Privacy Control signals where applicable.
- Disclose in the privacy policy what categories are collected and shared.
- Under-16 users require opt-in rather than opt-out for sale/sharing.

## What your game stores, separately from ads

Inventory this explicitly. It is the part developers forget.

| Thing | Consent-relevant? | Notes |
|---|---|---|
| `localStorage` save data (level, coins, settings) | Usually not | Strictly necessary for the service; keep it functional-only |
| A random player id you generated for analytics | **Yes** | A persistent identifier is personal data under GDPR even without a name |
| Session/run analytics events | **Yes** if tied to a persistent id | Consider session-scoped ids for pre-consent telemetry |
| Crash logs including user agent + IP | **Yes** | Common blind spot |
| Leaderboard names entered by players | **Yes**, and moderation risk | Free-text from children is a COPPA problem |
| A/B test bucket assignment | Depends | Functional if session-scoped, tracking if persistent |

Rule of thumb: if you can recognise the same player across sessions, you are processing personal data.

## Implementation contract

Before any ad SDK or analytics SDK initialises:

1. Determine jurisdiction (portal signal, CMP, or geo lookup) — do not assume.
2. Determine child-directed status (game-level flag, plus age screen if mixed-audience).
3. Resolve consent state: `granted` | `denied` | `unknown`.
4. Set the child-directed flag on every ad SDK that supports it.
5. Initialise analytics in the mode matching the consent state.
6. Only then initialise the ad SDK.

On consent change at runtime:

- stop personalized ad requests immediately
- clear identifiers that are no longer permitted
- do not retroactively delete gameplay saves the player still wants — separate functional storage from tracking storage so you can drop one without the other

Never:

- fire an ad request before consent resolution completes
- treat "banner dismissed" as consent
- store an ad identifier under a functional-storage key to dodge the distinction
- ship an age screen that remembers and pre-fills the previous answer

## Privacy policy contents

Even a small web game needs one, and portals ask for it. It must state:

- what is collected, in plain categories
- who it is shared with — name the ad and analytics providers
- legal basis for each purpose
- retention periods
- how to withdraw consent and how to request deletion
- child-audience statement
- a contact address that a human reads

## Output format

```md
# Ad Consent Privacy Compliance Review

## Verdict
Pass / Needs Work / Blocker

## Distribution and Controller
- Platform:
- Who runs the ad consent flow:
- Evidence for that answer:
- What we still own:

## Audience Determination
- Child-directed / mixed-audience / general:
- Evidence:
- Child-directed flag set on ad SDK: Yes/No/N.A.
- Age screen required: Yes/No

## Jurisdictions in Scope
| Region | Applies? | Obligation | Status |
|---|---|---|---|
| EU/EEA + UK | Yes/No | Consent before ad calls | |
| California / US states | Yes/No | Opt-out path | |
| Under-13 audience | Yes/No | Parental consent, no personalized ads | |

## Identifier Inventory
| Data | Where stored | Persistent? | Consent-gated? | Fix |
|---|---|---|---|---|

## Initialisation Order
1.
2.
3.

## Blockers Before Publish
1.
2.

## Privacy Policy Gaps
-

## Escalate to a Lawyer If
-
```

## Escalation rules

Stop and get professional advice when:

- the team disagrees about child-directed status
- the game collects free-text input from players who may be children
- you plan to run a direct ad network deal rather than going through a portal
- you are asked to sign a data processing agreement you do not understand
- a regulator, portal or network contacts you about a complaint

Shipping a compliance guess is cheaper than a lawyer right up until it is very much not.
