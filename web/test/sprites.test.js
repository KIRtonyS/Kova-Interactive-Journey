/* Sprite checks: the manifest in js/sprites.js matches the image files, and every LPC file is credited.
   Run with: node --test "web/test/*.test.js" */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, plain } = require('./load.js');
const P = require('./png.js');

const WEB = path.join(__dirname, '..');
const w = load(['art.js', 'sprites.js', 'props.js', 'rooms.js', 'story.js', 'game.js']);
const SPR = w.SPRITES;

test('sprites.js loads without a browser and starts in drawn mode', () => {
  assert.ok(SPR, 'window.SPRITES is missing');
  assert.equal(SPR.mode, 'drawn');
  assert.equal(SPR.SCALE, 2);
});

test('every image in the manifest exists', () => {
  const files = plain(SPR.files);
  assert.ok(Object.keys(files).length >= 10);
  for (const id of Object.keys(files)) assert.ok(fs.existsSync(path.join(WEB, files[id])), id + ': ' + files[id] + ' is missing');
});

test('every sprite region lies inside its sheet', () => {
  const files = plain(SPR.files), sizes = {};
  for (const id of Object.keys(files)) sizes[id] = P.size(path.join(WEB, files[id]));
  const regions = plain(SPR.regions());
  for (const r of regions) {
    const s = sizes[r.file];
    assert.ok(s, r.name + ': unknown file id "' + r.file + '"');
    assert.ok(r.sx >= 0 && r.sy >= 0 && r.sw > 0 && r.sh > 0 && r.sx + r.sw <= s.w && r.sy + r.sh <= s.h,
      r.name + ': region ' + [r.sx, r.sy, r.sw, r.sh].join(',') + ' is outside ' + files[r.file] + ' (' + s.w + 'x' + s.h + ')');
  }
});

test('every character in the game has a walk sheet of 9 by 4 frames', () => {
  const looks = Object.keys(plain(w.ART.LOOKS)).concat(['associate_lowes']);
  for (const look of looks) {
    const f = plain(SPR.files)['char:' + look];
    assert.ok(f, 'no sheet for "' + look + '"');
    const s = P.size(path.join(WEB, f));
    assert.deepEqual([s.w, s.h], [SPR.CHAR.fw * SPR.CHAR.cols, SPR.CHAR.fh * 4], look);
  }
});

test('every room is built from tiles, and each store has its own colours', () => {
  assert.equal(SPR.backgroundKey('bathroom', 'old'), 'bathroom:old');
  assert.equal(SPR.backgroundKey('bathroom', 'new'), 'bathroom:new');
  assert.equal(SPR.backgroundKey('home', null), 'home');
  assert.equal(SPR.backgroundKey('store', 'hd'), 'store:hd');
  assert.equal(SPR.backgroundKey('store', 'lowes'), 'store:lowes');
  assert.equal(SPR.backgroundKey('garage', null), null, 'a room without pictures keeps the drawn shell');
  assert.equal(SPR.people('bathroom', 'old'), 1, 'people are drawn at their normal size in tiled rooms');
});

test('the bathroom has a sprite for every object in it, in every state', () => {
  for (const key of ['toilet:old', 'toilet:removed', 'toilet:new', 'vanity:old', 'vanity:new', 'tub:old', 'tub:new', 'rack:old', 'rack:new',
    'mat:old', 'mat:new', 'boxes:single', 'boxes:stack', 'door', 'plunger', 'toolbox', 'valve', 'tilewall', 'controls', 'manual', 'stool', 'plant']) {
    const [kind, variant] = key.split(':');
    assert.ok(SPR.hasProp(kind, variant), key);
  }
});

test('the store has a sprite for every object except its two signs, whose words come from story.js', () => {
  const variants = { display: ['toilets', 'bath'], endcap: ['toilet', 'bath'] };
  const missing = [];
  for (const it of Array.from(w.ROOMS.rooms.store.items)) {
    if (it.kind === 'npc' || it.kind === 'banner' || it.kind === 'aislesign') continue;
    for (const v of variants[it.kind] || [null]) if (!SPR.hasProp(it.kind, v)) missing.push(it.kind + (v ? ':' + v : ''));
  }
  assert.deepEqual(missing, []);
});

test('walking picks frames 1 to 8 in turn and standing picks frame 0', () => {
  assert.equal(SPR.frameOf(0, 0), 0);
  const seen = new Set();
  for (let t = 0; t < 2; t += 0.02) seen.add(SPR.frameOf(1, t));
  assert.deepEqual(Array.from(seen).sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('the living room has a sprite for every kind of object in it', () => {
  const missing = w.ROOMS.rooms.home.items.filter(it => it.kind !== 'npc' && !SPR.hasProp(it.kind, typeof it.variant === 'string' ? it.variant : null) && !SPR.hasProp(it.kind, 'frame') && !SPR.hasProp(it.kind, 'plain'));
  assert.deepEqual(Array.from(missing, it => it.kind), []);
});

test('every LPC file shipped with the game is credited', () => {
  const credits = fs.readFileSync(path.join(WEB, 'assets', 'CREDITS.md'), 'utf8');
  const dir = path.join(WEB, 'assets', 'lpc');
  for (const sub of fs.readdirSync(dir)) {
    for (const f of fs.readdirSync(path.join(dir, sub))) {
      assert.ok(credits.includes(sub + '/' + f), sub + '/' + f + ' is not mentioned in assets/CREDITS.md');
    }
  }
  assert.match(credits, /CC-BY-SA 3\.0/);
});
