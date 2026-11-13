# The Kohler Customer Journey (web game)

A five-minute, top-down pixel-art game. The player lives today's journey of buying for a bathroom as Maya, David or Elena, and feels where it gets hard. It shows the current experience only.

This folder is the whole game. The RPG Maker project in `Project1/` is separate and is not used by it.

## Play it

1. Open the `web` folder.
2. Double-click `index.html`. It opens in your browser. No install, no internet.

| Key | What it does |
|---|---|
| W A S D or arrow keys | Walk. In menus, move between options. |
| E, Space or Enter | Use the object you are next to. Continue text. Pick an option. |
| Mouse click | Continue text, pick an option or a menu card. |
| Esc | Pause menu for the facilitator: Resume, Restart level, Main menu. In menus: go back. |

Gold markers show what the player must look at next. The way out gets a marker when the room is done.

Tested in Chrome on Windows. Please also try Safari and Chrome on a Mac before the installation; that could not be checked on the build PC.

## What is in the game

- Two levels: **When It Breaks** (David or Elena, Home Depot) and **The Big Project** (Maya or Elena, Lowe's).
- Each level has four acts: Bathroom, Home, Store, Bathroom.
- The store choice changes the last act's title card and the three-line ending.

## Edit the story

Every word the player reads is in `js/story.js`. Open it in any text editor (Notepad, TextEdit, VS Code), change the text between the quotes, save, and reload the page.

The top of `story.js` explains the structure. In short:

```js
toilet: {
  label: 'Toilet',            // shown in the hint: "E  Toilet"
  req: true,                  // must be used before the room can be left
  steps: [
    { n: 'The toilet rocks when you press on it.' },          // narration
    { t: { david: 'She nearly went down right here.',         // David's thought
           elena: 'One wet floor, and I was on the ground.' } } // Elena's thought
  ]
}
```

**Example: change what David thinks at the toilet.** Find `toilet:` under `LEVEL 1`, `Act 1`, and replace the text after `david:`. Keep the quotes and the comma. If your line contains an apostrophe, write it as `\'` (for example `'She\'d never tell me.'`).

Other things you can change there:

- **Level 1 prices and stock.** They sit in one block at the top, `FACTS`, dated 22 Oct 2026. Re-check them against kohler.com and homedepot.com before the installation and edit them in that block only.
- **Interface words** (the hint line, menu headings, pause menu) are in `STORY.ui`.
- **Endings** are at the bottom of each level, in `ending`. Each returns three lines and depends on `s.personaId` and `s.pick`.
- **Elena in one level only.** Remove `'elena'` from that level's `personas: [...]` list. Her lines for that level then never show. (The checks below expect her in both levels, so update the `LEVELS` table at the top of `test/story.test.js` too.)

Keep lines short. A level is tuned to about five minutes; the checks below tell you if it has grown too long.

Rules the text follows: no solutions and no future concept, only today's experience; the journey stage names are never shown; Maya's text never uses the word "accessible"; Elena says "protects my independence".

## Check your edits (optional)

These need [Node.js](https://nodejs.org) 22 or newer. Nothing else is installed. Run them from the repository folder.

```
node --test "web/test/*.test.js"
```

Checks that every path can be finished, every required object has text for each persona, banned words are absent, each stage of the journey is covered, and each path takes 4 to 6 minutes (an estimate from word counts and walking distance).

```
node web/test/run-playtest.js
```

Plays all paths by itself in headless Chrome with real key presses and fails on any browser error. Add `--shots some-folder` to save screenshots of key moments. It takes several minutes.

`test/gallery.html` shows every room and variant on one page.

## Files

```
web/
  index.html        loads the stylesheet and the scripts, in order
  style.css         all interface styling: dialogue, menus, overlays, scaling
  assets/title.png  title background (the game still works if it is missing)
  js/art.js         drawing primitives, 3x5 pixel font, characters, room shells
  js/props.js       one drawing function per object
  js/rooms.js       room layouts: where each object sits, what is solid, variants
  js/story.js       ALL the words
  js/game.js        the engine: logic first, then loop, input, dialogue, menus
  test/             checks and dev pages. Not needed to play; leave it out of a hand-off zip.
```

The game is plain HTML, CSS and JavaScript with no build step. To keep it working from a folder on any laptop: no ES modules, no `fetch`, no `.json` files, no web fonts, and no reading pixels back from images.
