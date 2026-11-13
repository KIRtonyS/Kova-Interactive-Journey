# Kohler Customer Journey Game: execution plan

## Context

Arnav wants a 5-minute, top-down pixel-art browser game that lets Kohler executives live today's bathroom-buying journey as Maya, David or Elena, so they feel the friction instead of reading about it. The full design is already written and locked in `D:\ArnavKhair\kohler_cjm_game\Kohler Customer Journey Game Build Plan.pdf` (17 pages: locked decisions, story bible for both levels, technical architecture, `story.js` schema, art direction, seven build phases). That PDF is the spec. This plan turns it into an executable sequence on this PC and records the few decisions the PDF left open.

The installation is 1-2 weeks away. The build stops at Arnav's playtest of version 1.

## Summary

**Goal:** a playable version 1 in `web/` that opens by double-clicking `index.html`, covers all four persona paths, and is ready for Arnav's playtest.

**What changes:** new files only, all under `web/` (plus two docs under `docs/superpowers/`) on a new branch. `Project1/` (the RPG Maker project) is not touched.

**Decisions made in this session**

| # | Decision | Why |
|---|---|---|
| D1 | Rewrite `web/js/art.js` from the PDF spec. If Arnav supplies the earlier file before Phase 2 starts, use that instead. | GitHub has only `main` with one commit, and the PDF says `web/` was never pushed, so the clone cannot contain it. |
| D2 | Arnav reviews the story inside the playable v1, not as a script beforehand. | His choice. Pacing is judged best in the game; text fixes are quick edits in `story.js`. |
| D3 | Source material is read (12 Nov): both journey maps from Figma ("Pain Point" = Restoration map = Level 1; "Desire" = Renovation map = Level 2) and persona slides 24-32 of the Brand Guide deck. Nothing else from that deck is used. | Arnav's instruction: only the persona content from the deck. |
| D8 | Level 1 tells the research version of the Kohler story with real names and numbers (see "Level 1 changes" below), replacing the PDF's "no price / limited stock / special order" version. | Arnav's choice. It is the documented friction and executives will recognise it. |
| D9 | No real interviewee names and no verbatim interview quotes in the game; their sentiment is adapted into original lines. Competitor brands on the shelf get invented names. Retailer and site names the PDF already uses (Home Depot, Lowe's, Amazon, Pinterest, Kohler.com) stay. | Interviewees are private people; the PDF says to write original lines. |
| D10 | Research notes and the build-plan PDF stay outside the repo, in `D:\ArnavKhair\kohler_cjm_game\source-notes\`. The spec and plan docs inside the repo carry no research data. | The GitHub repo is public. |
| D4 | Follow the PDF's seven phases in order across both levels. | 1-2 weeks is enough; no need for a one-level fallback. |
| D5 | Branch `arnav/web-game` from `main`. Local commits in the style `Area: what changed`. Nothing is pushed unless Arnav asks. | PDF: web version on its own branch; pushing to a teammate's repo is Arnav's call. |
| D6 | No installs. Logic and story checks run on Node 24's built-in test runner; screenshots and the self-play run use headless Chrome already on this PC. | Node v24.19, Chrome and Edge are present; Playwright is not, and is not needed. |
| D7 | Keep the PDF's five-script layout. Pure logic sits at the top of `game.js`, and the engine only boots when a `document` exists, so Node can load the same file for tests. Dev-only files live in `web/test/` and are left out of the hand-off zip. | Respects the PDF's folder layout while keeping the logic testable. |

**Tests and verification:** see each phase and the Verification section.

**What Arnav checks:** Chrome on Windows by double-click; Safari and Chrome on a Mac (cannot be tested from this PC); a real 5-minute run; the story text.

**Risks:** Safari is untested until Arnav tries it. Reading time is estimated from word counts and walking distance, so the real number comes from the playtest. Level 1's prices and stock are a snapshot from 22 Oct 2026 and may have moved by the installation; the README lists them in one place so Arnav can re-check. The repo is public, so pushing the branch publishes the game text; that stays Arnav's decision.

## Source material and what it changes

**Level 2 (Renovation map):** the PDF's story bible already matches the research. No structural change. Details to draw on when writing: inspiration images have no prices or dimensions; products are sold one by one, not as a whole bathroom; a store existing does not mean the exact product or finish is on display; in the aisle you see boxes, and unboxed products are not shown in context; decision fatigue; the contractor becomes the real decision-maker and runs on a separate timeline; buying and installing feel like two separate jobs.

**Level 1 changes (Restoration map, D8).** Objects, rooms and act structure stay as in the PDF; what these objects show changes:

| Object | PDF version | Version to build |
|---|---|---|
| Laptop (Act 2) | Kohler listing with no price | Search results: a repair video, sponsored non-Kohler toilets on top, a forum thread, and Kohler.com showing the Highline at $343.57 with 32 reviews, ships in about 2 business days then 7-10 business days by truck, curbside drop-off only, no install offered. The "if I'm replacing it anyway, maybe something nicer" thought lands here so Inspiration is felt in a required object. |
| Phone (Act 2) | Kohler limited stock, others in stock | Home Depot app: a Kohler "Highline Arc" at $189, about 14,800 reviews, 5 in stock, pickup today, "Aisle 25, Bay 006". Lowe's shows an "Elliston" at $269. Is any of these the one from Kohler.com? Kohler's "Find on Display" answers: "We're sorry, but this product is not available on display near you." |
| Kohler end cap (Act 3) | Boxed sample tagged special order, 10-14 days | The Highline Arc, boxed. The name and model number do not match what was saved from Kohler.com. Nothing on the shelf says whether it is the same toilet. |
| Associate (Act 3) | Vague answer | Same role; cannot say whether Highline and Highline Arc are the same. |
| Shelf of three (Act 3) | Kohler special order / Brand B / Brand C | Order the Highline from Kohler.com and wait about two weeks (`pick: 'kohlercom'`); take the shelf Kohler today, unsure it is the same (`pick: 'shelf'`); take a cheaper invented-name brand in stock (`pick: 'other'`). |
| Act 4 card and box | "Two weeks later" if special order | "Two weeks later" for `kohlercom`, with the box left at the curb; "Sunday, 4:15 PM" otherwise. |

Other usable Level 1 details: speed decides almost everything ("what will it cost and how fast can I get it"); "good enough" and like-for-like usually win; the plumber or associate often picks the brand; missing parts and getting a heavy toilet home; worry about whether the new one is really an improvement.

**Personas (slides 24-32):** match the PDF. Added details: David's mother lives 20 minutes away and he is weighing moving her in against modifying her house; Maya wants a hotel-spa feel through lighting, materials and warmth and would reject anything that looks like a medical catalog; Elena questions anything that overpromises and worries about data collection.

## Rules carried from the PDF (do not break)

- Classic `<script>` tags only: no ES modules, no `fetch()`, no `.json`, no `getImageData`, no network, no web fonts. Story data is `window.STORY`.
- Script order: `art.js`, `props.js`, `rooms.js`, `story.js`, `game.js`.
- Canvas 384x224 logical px (16 px tiles, 24x14, top 3 rows wall), stage 768x448 scaled with letterboxing. Text and menus are HTML.
- All words live in `story.js`. Current journey only: no Kova, no solutions, no "Opportunities". Text signs, no real logos.
- Voice rules per persona (PDF page 4), including: never "accessible" for Maya; Elena says "protects my independence", never "extends my life".

## Steps

### Step 0: Repo setup
1. Confirm the clone has finished (`git status` clean on `main`, `Project1/` present). Confirm `Project1/img/titles1/Kova_Title_816x624.png` exists.
2. Create branch `arnav/web-game`.
3. Save the full text of both journey maps and the persona slides to `D:\ArnavKhair\kohler_cjm_game\source-notes\` (outside the repo, D10), re-reading from Figma if the session copy is gone.
4. Save `docs/superpowers/specs/2026-11-12-kohler-journey-game-design.md` (short: summary, D1-D10, the Level 1 change table, and a note that the build-plan PDF is the full spec and lives outside the repo) and this plan as `docs/superpowers/plans/2026-11-12-kohler-journey-game.md`. No interviewee names in either. Commit.
5. Create `web/`, copy the title image to `web/assets/title.png`. Commit.

### Phase 2: Art pass (`art.js`, `props.js`, `rooms.js`)
- `art.js`: palette constants, rect/pixel primitives, 3x5 pixel font, character renderer (7 looks from PDF page 15-16, also used as portraits), room shells (bathroom old/new, home, store with orange or navy accent).
- `props.js`: one draw function per object kind, with the variants listed on PDF page 16.
- `rooms.js`: item lists per room `{ id, kind, x, y, w, h, solid, foot, layer, reach, show(state), variant(state) }`, including persona dressing (crutch and mother, toys and partner, training corner).
- Dev page `web/test/gallery.html`: renders every room x variant x persona dressing from a URL query.
- Test (`web/test/rooms.test.js`, `node --test`): every interactable item is at least 12x12 px and reachable by flood fill from the spawn point over non-solid tiles.
- **Done when:** headless Chrome screenshots of each room and variant have been reviewed by me for overlap, blocked paths and readability, and the reachability test passes. Commit.

### Phase 3: Engine core (`game.js`)
- Pure logic first, test-first (`web/test/logic.test.js`): text resolution (string, persona-keyed with `_` fallback, function of state), step expansion (`n`, `t` with skip, `s`, `choice`, `screen`, `fn`), gating (`needs` unlocks exit, `after` orders things), state transitions (`{levelId, personaId, actIdx, done, flags, pick}`), collision against solid footprints, nearest-in-reach, depth-sort order.
- Then the wiring: loop, input (WASD/arrows, E/Space/Enter, mouse), smooth movement at about 60 px/s, hint chip, bobbing gold marker, async dialogue runner with typewriter, title cards, act flow.
- **Done when:** a stub act can be walked, talked through and exited in headless Chrome with no console errors. Commit.

### Phase 4: Menus and overlays (`game.js`, `style.css`, `index.html`)
- Title screen (works without the image), level select, persona select with portraits, Esc pause menu (Resume, Restart level, Main menu), browser and phone overlays, choice UI, ending card, return to level select.
- Thought, narration and NPC speech are visually distinct.
- **Done when:** a full session starts, runs and returns to the menu by keyboard and by mouse. Commit.

### Phase 5: Story content (`story.js`)
- Write original lines for all four paths from the source notes, following the PDF's object tables (pages 7-12) with the Level 1 changes above, and the voice rules, plus 12 endings (4 paths x 3 purchases).
- Level 1's real names and numbers sit together in one clearly marked block at the top of `story.js`, dated 22 Oct 2026, so they can be re-checked and edited in one place.
- Test (`web/test/story.test.js`): every required thing has text for each persona who can reach it; every `needs`/`after`/thing id exists in `rooms.js`; no choice dead-ends; banned words absent (Kova, "pain point", "solution", "opportunit", "accessible" in Maya's lines, "extends my life", and the interviewee names from the research); estimated time per path is 4-6 minutes (words at reading speed + typewriter + walking distance + cards).
- **Done when:** the story test passes. Commit.

### Phase 6: Automated playtest
- `web/test/playtest.html` loads the real game plus `autoplay.js`, which sends real key events: path-finds to each required object, interacts, picks each store option, and reaches the ending. Captures `window.onerror` and console errors and writes a result block to the page.
- Run in headless Chrome for all 4 paths x 3 purchases (12 runs), plus one run with every optional object.
- **Done when:** all runs reach the ending with no errors and no blocked required object. Fix and re-run until true. Commit.

### Phase 7: Package and hand-off
- `web/README.md`: how to run, how to edit `story.js` (with one worked example), how to move Elena to one level, what `web/test/` is.
- Zip `web/` without `test/` to `D:\ArnavKhair\kohler_cjm_game\kohler-journey-game-v1.zip`.
- **Done when:** the zip, extracted to a fresh folder, passes a headless smoke run from there.
- Hand Arnav the playtest checklist (below) and stop. Music, sound, idle reset and a third level wait for his feedback.

## Files

New: `web/index.html`, `web/style.css`, `web/README.md`, `web/assets/title.png`, `web/js/{art,props,rooms,story,game}.js`, `web/test/{gallery.html,playtest.html,autoplay.js,rooms.test.js,logic.test.js,story.test.js}`, `docs/superpowers/specs/…-design.md`, `docs/superpowers/plans/….md`.
Reused: `Project1/img/titles1/Kova_Title_816x624.png` (copied, original untouched).

## Verification

Run by me on this PC:
- `node --test web/test/` : rooms, logic and story checks.
- Headless Chrome on `file://` : room screenshots (reviewed one by one), 12 self-play runs, and the smoke run from the extracted zip.
- A grep of `web/` for `fetch(`, `import `, `type="module"`, `getImageData`, `http` to confirm the cross-platform rules hold.

Arnav's playtest checklist (handed over with v1):
1. Windows: double-click `index.html` in Chrome. Play one path per level.
2. Mac: the same in Safari and in Chrome.
3. Time a first-time player on each level (target about 5 minutes).
4. Read every line for voice; edit `story.js` or send notes. Re-check Level 1's prices and stock against the live sites.
5. Check each room reads at a glance and the old and new Bathroom look clearly different.
