# Round 3: sprite art and Kohler fact corrections (design)

## Summary

**Goal.** Sharper graphics through image sprites, and product facts that match Kohler's own documents.

**What changes.** A new `web/js/sprites.js` (manifest and loader); `art.js`, `props.js`, `rooms.js` and `game.js` draw from sprites when the art has loaded and fall back to the code-drawn art otherwise; LPC art under `web/assets/lpc/` with `web/assets/CREDITS.md`; fact corrections in `web/js/story.js`; new checks in `web/test/`.

**Decisions.**

| # | Decision | Why | Alternative |
|---|---|---|---|
| D1 | Art comes from Liberated Pixel Cup (LPC) open-licence assets (Arnav). | May be committed to this public repository with credits. | A paid interior pack with better coverage whose files may not be redistributed. |
| D2 | Sharper pixel art at double resolution: 32 px tiles on a 768 by 448 canvas (Arnav). | Keeps the pixel-art direction and the room layouts. | A painted look; or the same size with small sprites. |
| D3 | One background per room version with furniture painted in; separate sprites only for characters and objects that appear or change (Arnav). | Fewest images, highest fidelity. | Every object as its own sprite. |
| D4 | Game logic stays in 384 by 224 coordinates; only the canvas is doubled. | Collision, reach, path finding, timing and their tests are untouched. | Convert all coordinates to 32 px tiles. |
| D5 | All-or-nothing art mode: sprites only if every listed image loads; `?art=drawn` forces the drawn art. | A half-loaded room looks broken; the installation keeps a safe fallback. | Per-sprite fallback. |
| D6 | Room backgrounds are stamp lists painted once into an offscreen canvas. | No build step, no pixel read-back, still "edit and reload". | A pre-baked PNG per room. |
| D7 | One new script, `js/sprites.js`, loaded after `art.js`. | Keeps art data apart from drawing code. | Fold it into `art.js` and keep five scripts. |
| D8 | Characters are assembled from LPC layer sheets at load, one layer list per look. | No generator tool to run; credits follow the layer files. | Eight hand-built sheets. |
| D9 | What LPC lacks is drawn in code at the fine resolution. | LPC has few modern bathroom pieces and no store set. | Leave those pieces at the old, coarser resolution. |
| D10 | Fact fixes change words only; pick ids, flags and step structure stay. | The playtest paths do not change. | |
| D11 | Checkpoint after the first slice (characters and the old bathroom). | Catches a style mismatch before four more rooms are built. | |

**Tests.** Node checks (story facts, sprite manifest, credits coverage), the headless-Chrome playtest in both art modes, and gallery screenshots of all twelve scenes.

**Risks.** Mixed styles between LPC art and code-drawn pieces; furniture sizes that move object boxes and shift the timing check; the licence duty to credit every LPC file used and to keep edited art under the same licence.

## Update, 13 Nov 2026 (later the same day)

After seeing the first slice, Arnav chose the painted style of the team's RPG Maker backgrounds for rooms. This replaces D1 and D3 for rooms and changes D8:

| # | Decision | Why |
|---|---|---|
| D1b | Rooms are painted pictures from the team's RPG Maker project (`Project1/img/parallaxes/` on `main`), copied into `web/assets/rooms/`. People stay LPC sprites. | Arnav prefers that style. Only the bathroom exists so far; the living room and both stores stay code-drawn until pictures arrive. |
| D3b | A painted room is one picture, fitted to the screen height and centred. Furniture in the picture is marked `painted` in `rooms.js`; objects that appear or change are drawn on top. A change inside the picture needs a second picture (the bathroom without its toilet is made by `test/build-art.js`). | The picture cannot be edited while the game runs. |
| D8b | Character sheets are built ahead of time by `test/build-art.js`, not layered in the browser. | LPC colours are palette swaps, which need pixel access that browsers deny for pages opened from a folder. |
| D14 | People are drawn 1.5 times larger in a painted room; each painted room sets its own `floor` line. | The painted furniture is large and stands against a tall back wall. |

Known gaps: one painting serves both the dated and the renovated bathroom; some story lines describe details the painting does not show; the LPC people are crisper than the painted room.

## Second update, 13 Nov 2026 (after playing the build)

Arnav liked the LPC people and asked for rooms that belong to the same world, setting the painted backgrounds aside for now. This replaces D1b and D3b:

| # | Decision | Why |
|---|---|---|
| D1c | One pixel-art world: LPC people, LPC walls, floors and furniture, and the game's own sprites (`test/custom-art.js`) for everything LPC has no picture for. | People and rooms must look like they come from the same place. LPC has no modern or store pieces. |
| D15 | Fixed room sizes on one scale: bathroom 12 x 9 tiles, living room 16 x 11, store 24 x 14. | A living room and a Home Depot cannot be the same size. |
| D16 | Interface windows are dark slate with a light pixel border and hard edges (chip, hint, dialogue, choices, pause menu). | Arnav chose this of three mock-ups. Typography is left for later. |
| D17 | Words on the game's own sprites (KOHLER, EXIT, PRO DESK) are read from `STORY.signs` when the art is built. The store banner and aisle sign stay code-drawn and live. | Keeps one text renderer. |

Painted rooms remain possible in the engine but no room uses one.

## Fact corrections

Checked on 13 Nov 2026 against Kohler's spec sheets for K-43999 and K-78253 and its two-piece installation guide.

| # | Before | After |
|---|---|---|
| F1 | The box held "the toilet, two bolts and a 14-page manual. No wax ring." whatever was bought. | The Highline Arc box holds bowl, tank, seat, wax ring and hardware, and no supply line. The kohler.com Highline box holds a bowl and a tank: no seat, wax ring or supply line. The invented brand keeps a missing wax ring. |
| F2 | A 14-page manual in four languages with a registration QR code. | A two-page guide in three languages that says "Record your model number." |
| F3 | kohler.com: "No installation offered." | "Installation extra, in some ZIP codes." |
| F4 | "Sixty pounds." | "Ninety pounds." |
| F5 | Shelf box: "Highline Arc". | "Highline Arc The Complete Solution". |
| F6 | "K-43999". | "K-43999-0" (White), to be confirmed on kohler.com. |
| F7 | "The Kohler suite". | "One Kohler collection". |

Prices, review counts, stock and the store-finder message come from the team's check on 22 Oct 2026 and still need a browser re-check before the installation; `FACTS.checked` carries that date.

## Licence note

LPC art is under CC-BY-SA 3.0 or later, or GPL 3.0, per file. Every file used is listed with its authors in `web/assets/CREDITS.md`. Edited or combined LPC art stays under the same licence. The game's code and text are not LPC art and are not affected.
