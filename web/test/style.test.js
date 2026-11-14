/* Interface checks that need no browser: the bundled font and the rule that nothing is fetched from the network.
   Run with: node --test "web/test/*.test.js" */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WEB = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(WEB, 'style.css'), 'utf8');

test('the interface font is bundled with the game, with its licence', () => {
  const font = fs.readFileSync(path.join(WEB, 'assets', 'fonts', 'Jersey10-Regular.ttf'));
  assert.deepEqual(Array.from(font.subarray(0, 4)), [0, 1, 0, 0], 'a TrueType file');
  assert.match(fs.readFileSync(path.join(WEB, 'assets', 'fonts', 'OFL.txt'), 'utf8'), /SIL Open Font License/);
  assert.match(fs.readFileSync(path.join(WEB, 'assets', 'CREDITS.md'), 'utf8'), /Jersey 10/);
});

test('the stylesheet loads that font from the game folder and uses it for the interface', () => {
  assert.match(css, /@font-face\s*{[^}]*font-family:\s*"Jersey 10"[^}]*url\("assets\/fonts\/Jersey10-Regular\.ttf"\)/);
  assert.match(css, /--pixel:\s*"Jersey 10",/);
  assert.match(css, /#stage\s*{[^}]*font-family:\s*var\(--pixel\)/);
});

test('the pixel font falls back to a system font, and the laptop and phone screens keep an ordinary one', () => {
  assert.match(css, /--pixel:[^;]*sans-serif;/);
  assert.match(css, /\.win\s*{[^}]*font-family:\s*var\(--sans\)/);
});

test('nothing in the page or the stylesheet is fetched from the network', () => {
  for (const f of ['style.css', 'index.html']) {
    assert.doesNotMatch(fs.readFileSync(path.join(WEB, f), 'utf8'), /https?:\/\/|@import|\/\/fonts\./, f);
  }
});
