# Kohler Customer Journey Game: design

## Summary

**Goal.** A short, guided, browser-based game that lets Kohler executives live today's customer journey for buying bathroom products, so they feel the friction instead of reading about it. Top-down pixel art, two levels (one per journey map), three rooms (Home, Bathroom, Store), about five minutes per run, played at an installation with a facilitator present.

**Full spec.** Arnav's build plan, "Kohler Customer Journey Game: Build Plan" (12 Nov 2026, 17 pages), is the source of truth: locked decisions, story bible, technical architecture, `story.js` schema, art direction and build phases. It is kept outside this public repository, together with the research notes. This document records only what was decided on top of it.

**What changes.** New files only, under `web/` and `docs/superpowers/`, on branch `arnav/web-game`. The RPG Maker project in `Project1/` is untouched.

**Decisions**

| # | Decision | Reason | Alternatives considered |
|---|---|---|---|
| D1 | `web/js/art.js` was rewritten from the build plan's spec. | The earlier local copy was never pushed, so it was not in the clone. | Wait for the earlier file to be copied over. |
| D2 | Arnav reviews the story inside the playable version 1. | Pacing is judged best in the game; text fixes are quick edits in `story.js`. | Approve a full script first; approve one sample act first. |
| D3 | Source material: the two journey maps ("Pain Point" = Restoration = Level 1, "Desire" = Renovation = Level 2) and the persona slides of the brand deck. Nothing else from that deck is used. | Arnav's instruction. | Write from the build plan alone. |
| D4 | Build in the plan's seven phases, across both levels. | The installation is one to two weeks away. | One level end to end first as a fallback. |
| D5 | Branch `arnav/web-game`, local commits, nothing pushed unless Arnav asks. | The web version lives on its own branch; pushing to a shared repository is his call. | |
| D6 | No installs. Checks run on Node's built-in test runner; the self-play run drives headless Chrome through its debugging port. | Node and Chrome were already on the build PC. | Playwright (needs an install). |
| D7 | The plan's five-script layout is kept. Pure logic sits at the top of `game.js` and the engine starts only when a page exists, so Node can load the same file. Dev-only files live in `web/test/`. | Keeps the folder layout while making the logic testable. | A separate `logic.js`. |
| D8 | Level 1 tells the researched version of the Kohler story with real names and numbers (table below). | Arnav's choice: it is the documented friction and executives will recognise it. | Invented names and prices; the build plan's "special order" version. |
| D9 | No interviewee is named and no interview quote is used verbatim. Competitor brands are invented. Retailers and sites the build plan names stay. | Interviewees are private people; the plan asks for original lines. | |
| D10 | Research notes and the build plan stay outside the repository. | The repository is public. | |

**Level 1 change (D8).** Objects, rooms and act structure follow the build plan; what the objects show follows the research (checked 22 Oct 2026, kept in the `FACTS` block at the top of `story.js`):

| Object | What it shows |
|---|---|
| Laptop (Act 2) | Search results with sponsored non-Kohler toilets on top, and Kohler.com's Highline at $343.57 with 32 reviews, about two weeks by truck, left at the curb, no installation offered. |
| Phone (Act 2) | Home Depot has a Kohler "Highline Arc" at $189, in stock today. Lowe's lists an "Elliston". The saved Highline returns no results, and Kohler's Find on Display has nothing nearby. |
| Kohler shelf and associate (Act 3) | The box on the shelf has a different name and model number from the one saved online. Nobody can say whether it is the same toilet. |
| Store choice (Act 3) | Order the Highline from Kohler.com and wait about two weeks; take the shelf Kohler today, unsure it is the same; or take a cheaper in-stock brand. |
| Act 4 | "Two weeks later", with the box left at the curb, if the player ordered from Kohler.com. |

**Tests and verification.** `node --test "web/test/*.test.js"` covers room layouts (every usable object is at least 12 by 12 px and reachable), engine logic (text resolution, dialogue stepping, gating, movement), and the story (every path finishes, required objects have a thought per persona, banned words are absent, every journey stage is covered by a required object, each path takes 4 to 6 minutes by estimate). `node web/test/run-playtest.js` plays every path in headless Chrome with real key events and fails on any browser error.

**What to check by hand.** Chrome on Windows by double-click; Safari and Chrome on a Mac; a first-time player's real time per level; the story text, line by line; Level 1's prices and stock against the live sites.

**Risks.** Safari was not tested on the build PC. Reading time is an estimate until the playtest. Level 1's numbers are a dated snapshot. Because the repository is public, pushing the branch publishes the game text; that remains Arnav's decision.

## Rules that must keep holding

- Classic `<script>` tags only: no ES modules, no `fetch()`, no `.json`, no `getImageData`, no network calls, no web fonts.
- Script order: `art.js`, `props.js`, `rooms.js`, `story.js`, `game.js`.
- Canvas 384 by 224 logical pixels (16 px tiles), stage 768 by 448 scaled to fit the window. Text and menus are HTML.
- All words live in `story.js`. Current journey only: no future concept, no solutions, no opportunities. Text signs, no real logos.
- Voice: Maya's text never says "accessible"; Elena says "protects my independence", never "extends my life".

## Round 2 (13 Nov 2026): Level 1 becomes "Not What It Used to Be"

Arnav changed the pain point journey: the fixture still works, just not as well as it used to. This overturns the build plan's locked decision that Elena slips on a leaking floor and is hurt in Level 1.

| # | Decision |
|---|---|
| R1 | The fixture stays the toilet: a weak flush that runs on and needs a second flush or a jiggle of the handle. The rooms, the art and the real Highline / Highline Arc / Elliston facts stay. |
| R2 | The triggers are small daily friction with no injury. David's mother has started flushing twice rather than mention it; Elena notices the weak flush and how hard the low seat is to stand up from after training. |
| R3 | The level is renamed "Not What It Used to Be". Pitch: "It still works. Just not well. Fix it, replace it, or live with it a little longer?" |
| R4 | The friction is doubt and putting it off. The three store choices stay. Leaving home offers "Live with it a bit longer": weeks pass, the problem stays, and the store's title card and one ending line remember it. |

Also in this round: the puddle became a plunger; the plumber booking and Level 2's "wait another year" now change a line; sign words moved to `STORY.signs`; P pauses as well as Esc (Safari leaves full screen on Esc); held Esc no longer flickers the menu; a resting mouse cursor no longer pre-selects a pause option; the player stands still while reading; the exit marker no longer clips at the top of the screen.
