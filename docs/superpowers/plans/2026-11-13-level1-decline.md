# Round 2: Level 1 becomes "Not What It Used to Be", plus the deferred minor fixes

## Context

Version 1 (branch `arnav/web-game`, commit `0ee65b8`, pushed) tells Level 1 as an urgent fix: a leaking toilet, a near-fall for David's mother, and a slip that hurt Elena. Arnav wants the pain point journey to be a fixture that **still works, just not as well as it used to**. The friction moves from speed to doubt: is it bad enough to replace, which one is really the same, and the pull of "good enough" and "later". The research supports this: "good enough" usually wins, people would rather adjust than replace, and the "if I'm replacing it anyway, maybe something nicer" fork. He also asked for the seven minor issues from the review to be fixed.

The build plan PDF's locked decision "Elena, Level 1: she slips on the leaking floor and is hurt" is overturned by Arnav's direction on 13 Nov. The design doc records that.

## Summary

**Goal:** Level 1 reads as a slow decline with no injury and no urgency, and the seven minor issues are fixed. Everything else stays as it is.

**Decisions (Arnav, 13 Nov)**

| # | Decision |
|---|---|
| R1 | The fixture is still the toilet: a weak flush that runs on and needs a second flush or a jiggle of the handle. The rooms, the art and the real Highline / Highline Arc / Elliston facts stay. |
| R2 | The triggers are small daily friction with no injury. David notices his mother has started flushing twice and leaving it running rather than mention it. Elena notices the weak flush, and how hard the low seat is to stand up from after training. |
| R3 | The level is renamed "Not What It Used to Be". Pitch: "It still works. Just not well. Fix it, replace it, or live with it a little longer?" |
| R4 | The friction is doubt and putting it off. The three store choices stay. A new "live with it a bit longer" choice when leaving home does not escape: weeks pass, the problem stays, and the store card and the ending remember it. |

**What changes:** `web/js/story.js` (Level 1 text and flow, persona triggers, sign words), `web/js/rooms.js` and `web/js/props.js` (the puddle is replaced by a plunger; sign words come from the story), `web/js/art.js` (marker clamp), `web/js/game.js` (minor fixes), `web/test/*` (scene ids, new checks), `web/README.md`, and the design doc. Level 2 is untouched apart from one ending line that uses its `waited` flag.

**What Arnav checks on device:** play Level 1 as David and as Elena. Does it feel like a slow decline, not an emergency? Does "live with it" feel like a trap, not an escape? Is it still about 5 minutes? On the Mac, check P as the pause key.

**Risks:** "No urgency" can read as "no stakes". The stakes now come from his mother's silence (David), the measured daily friction (Elena), and money spent on doubt. The extra choice adds about 10 to 15 seconds; Level 1 sits at about 4.5 minutes, so it stays inside the 4 to 6 minute window, and the story test enforces that.

## Level 1 rewrite (story.js)

Rooms, act order, required objects and the store's three choices stay. What each beat says:

| Where | Now | Becomes |
|---|---|---|
| Persona cards | David: "A scare in his mother's bathroom". Elena: "slipped… hurt her hip" | David: "His mother's toilet has stopped flushing properly. She hasn't said a word." Elena: "Her toilet takes two flushes now, and the low seat is getting harder to stand up from." |
| Act 1 card and intro | "Day five of the leak" | "Tuesday, 7:10 AM" stays as a time, with an ordinary-morning line. David is visiting before work; Elena is just back from the gym. |
| Toilet (required) | Rocks, water pools | One weak flush, then a second. The tank keeps hissing. David: she has been coping and not telling him. Elena: a small drag she can measure, twice a day, every day. |
| Toolbox (required) | Tighten bolts | Lift the tank lid: a warped flapper and a kinked chain. Adjust it. It flushes better for a while, then runs again. Thought: fix or replace something that technically works. |
| Puddle and towels (optional) | Soaked towels | **Plunger** (new prop, same spot). David: new, she bought it and never mentioned it. Elena: bought two months ago, used more than she would like. |
| Sink (optional) | Same age | Unchanged idea: everything in here is the same age. |
| Laptop (required) | "fix or replace" for a leak | Query "toilet weak flush fix or replace". Results: a "$12 flapper fixes it" video, a sponsored cheap toilet, a "7 signs it's time to replace your toilet" article, a forum thread that disagrees, and Kohler.com's Highline (FACTS). Thought: "if I'm replacing it anyway, maybe something nicer", then "two weeks by truck, and nothing is forcing me to choose". |
| Phone (required) | Unchanged (stock, three names) | Unchanged. |
| Plumber card (optional) | "Nine more days of towels" | The card says "weak flush? usually a $12 part" and still charges a $95 visit. The choice stays; the `plumber` flag is now used in Act 4 ("You cancelled the plumber's visit" / "You never called"). |
| Mother / training log (optional) | "Don't make a fuss" | Mother: "It works fine if you hold the handle down." Elena: everything is tracked except the two flushes a day. |
| Leaving home | One line | **New choice:** "Go to the store on Saturday" or "Live with it a bit longer". Living with it plays a short beat (weeks pass, the second flush becomes habit, then the moment that tips it) and sets `waited`. Both lead to the store. |
| Act 3 card | "Saturday, 9:40 AM" | "Saturday, 9:40 AM", or "Three weeks later, a Saturday" if `waited`. |
| Store shopper (optional) | "Mine broke Thursday" | "Mine's fifteen years old. Still works, mostly. I'm just looking." |
| Store choice | "Two more weeks of towels" | The same three choices. Thoughts move to doubt: nothing forces a decision, so every option feels arbitrary. |
| Act 4 | Box, valve, new toilet, manual | Same objects. No towels or curb urgency. The first flush is quiet and complete. Thought: "was the old one really that bad?" |
| Endings (6) | Leak, two weeks of towels | Rewritten around doubt, settling and putting it off. Line 3 still varies by purchase. One line varies when `waited` is set. |

Voice rules hold: no "accessible", no "extends my life", no solutions, no stage names shown. Level 2 uses its existing `waited` flag in one ending line, so that flag is no longer set and ignored.

## Minor fixes

1. **Esc auto-repeat.** Ignore `ev.repeat` for Esc in `onKeyDown` (`game.js`).
2. **Pause highlight under a resting cursor.** Highlight an option on `mousemove`, not `mouseenter`, so a still cursor can't pre-select "Restart level" (`setSel` in `game.js`).
3. **Safari full screen and Esc.** Add **P** as a second pause key. The README tells the facilitator to use P on the Mac.
4. **Frozen walk frame.** `playSteps` resets `player.frame` to 0 when dialogue starts.
5. **Clipped exit marker.** `ART.marker` clamps its top to y ≥ 1.
6. **Sign words outside story.js.** Add `STORY.signs` (`bath`, `kohler`, `proDesk`, `exit`; the aisle sign is derived from `FACTS.homeDepot.aisle`). `props.js` and `rooms.js` read them at draw time, with fallbacks.
7. **Unused flags.** `plumber` (Level 1, Act 4) and `waited` (Level 2 ending) now change a line.

## Steps

1. Update the design doc (`docs/superpowers/specs/…-design.md`) with R1 to R4 and the overturned locked decision, and append this plan as `docs/superpowers/plans/2026-11-13-level1-decline.md`.
2. **Tests first (RED):**
   - `load.js` scene ids: `puddle` becomes `plunger`.
   - Story checks: Level 1 has no "leak", "puddle", "towel", "slip" or "hip"; Level 1 is named "Not What It Used to Be"; the leave choice exists and `waited` changes the Act 3 card and an ending line; `plumber` changes an Act 4 line; the aisle sign matches `FACTS`.
   - Logic checks: the Esc repeat guard and P (via a pure helper); a marker clamp check with a recording fake canvas.
3. Make them pass: story.js rewrite, the plunger prop and room item, the sign words, the game.js fixes.
4. Run `node --test "web/test/*.test.js"` and `node web/test/run-playtest.js` (all 21 runs, plus a run that takes "live with it"). Then `--smoke`, and screenshots of Level 1 Acts 1 and 2 and the new choice, reviewed.
5. Rebuild `kohler-journey-game-v1.zip` (as v2) and re-verify it from a fresh folder.
6. Arnav commits and pushes from GitHub Desktop. The command-line git on this PC still has no identity of his.

## Verification

- `node --test "web/test/*.test.js"`: all green, including the new checks and the 4 to 6 minute window for every path.
- `node web/test/run-playtest.js`: all runs pass with no browser errors, including "live with it" and mashing E.
- Screenshots of the new Level 1 beats, reviewed for layout and overlap.
- A grep of story.js confirms no leak or injury language remains in Level 1.
