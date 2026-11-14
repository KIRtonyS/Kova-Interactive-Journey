/* Room layout checks. Run with: node --test web/test/ */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, sceneStates } = require('./load.js');

const w = load(['art.js', 'props.js', 'rooms.js']);
const ROOMS = w.ROOMS, PROPS = w.PROPS;

function overlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

test('every room item uses a prop kind that exists', () => {
  for (const roomId of Object.keys(ROOMS.rooms)) {
    for (const it of ROOMS.rooms[roomId].items) {
      assert.equal(typeof PROPS.kinds[it.kind], 'function', roomId + ': unknown kind "' + it.kind + '"');
    }
  }
});

test('every item is drawn inside the canvas', () => {
  for (const roomId of Object.keys(ROOMS.rooms)) {
    for (const it of ROOMS.rooms[roomId].items) {
      const b = ROOMS.box(it);
      assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 384 && b.y + b.h <= 224, roomId + ': ' + (it.id || it.kind) + ' leaves the canvas');
    }
  }
});

for (const sc of sceneStates()) {
  test(sc.name + ': the player does not start inside furniture', () => {
    const sp = ROOMS.spawn(sc.scene.room);
    assert.equal(ROOMS.blocked(sc.scene.room, sc.state, sp.x, sp.y), false);
  });

  test(sc.name + ': every usable object is present, at least 12x12 px, and reachable', () => {
    const items = ROOMS.visible(sc.scene.room, sc.state);
    const usable = items.filter(it => sc.ids.includes(it.id));
    const sp = ROOMS.spawn(sc.scene.room);
    for (const id of sc.ids) {
      const found = items.filter(it => it.id === id);
      assert.equal(found.length, 1, 'expected exactly one visible item with id "' + id + '", found ' + found.length);
      const b = ROOMS.box(found[0]);
      assert.ok(b.w >= 12 && b.h >= 12, id + ' is smaller than 12x12 px (' + b.w + 'x' + b.h + ')');
      const p = ROOMS.path(sc.scene.room, sc.state, sp, found[0], usable);
      assert.ok(p && p.length > 0, id + ' cannot be reached from the spawn point');
      const roomy = ROOMS.path(sc.scene.room, sc.state, sp, found[0], usable, 2);
      assert.ok(roomy && roomy.length > 0, id + ' can only be reached by squeezing past furniture');
    }
  });

  test(sc.name + ': nothing is in reach at the starting point, so the walking hint shows first', () => {
    const usable = ROOMS.visible(sc.scene.room, sc.state).filter(it => sc.ids.includes(it.id));
    const sp = ROOMS.spawn(sc.scene.room);
    const near = ROOMS.nearest(usable, sp.x, sp.y);
    assert.equal(near, null, 'the player starts within reach of ' + (near && near.id));
  });

  test(sc.name + ': solid furniture does not overlap', () => {
    const solids = ROOMS.visible(sc.scene.room, sc.state).filter(it => it.solid);
    for (let i = 0; i < solids.length; i++) {
      for (let j = i + 1; j < solids.length; j++) {
        assert.equal(overlap(ROOMS.foot(solids[i]), ROOMS.foot(solids[j])), false,
          (solids[i].id || solids[i].kind) + ' overlaps ' + (solids[j].id || solids[j].kind));
      }
    }
  });

  test(sc.name + ': standing next to a usable object selects that object', () => {
    const items = ROOMS.visible(sc.scene.room, sc.state);
    const usable = items.filter(it => sc.ids.includes(it.id));
    const sp = ROOMS.spawn(sc.scene.room);
    for (const it of usable) {
      const p = ROOMS.path(sc.scene.room, sc.state, sp, it, usable);
      const end = p[p.length - 1];
      const near = ROOMS.nearest(usable, end.x, end.y);
      assert.equal(near && near.id, it.id, 'walking to ' + it.id + ' selects ' + (near && near.id));
    }
  });
}

test('the toilet in Level 1 act 4 changes from old to removed to new as the install proceeds', () => {
  const base = { levelId: 'breaks', personaId: 'david', actIdx: 3, variant: 'old', flags: {}, pick: null };
  const toilet = ROOMS.rooms.bathroom.items.find(it => it.id === 'toilet');
  assert.equal(ROOMS.variantOf(toilet, Object.assign({ done: {} }, base)), 'old');
  assert.equal(ROOMS.variantOf(toilet, Object.assign({ done: { box: true, valve: true } }, base)), 'removed');
  assert.equal(ROOMS.variantOf(toilet, Object.assign({ done: { box: true, valve: true, toilet: true } }, base)), 'new');
});

test('persona dressing appears only for its persona', () => {
  const ids = personaId => ROOMS.visible('home', { levelId: 'breaks', personaId, actIdx: 1, done: {}, flags: {} }).map(it => it.id || it.kind);
  assert.ok(ids('david').includes('mother') && ids('david').includes('crutch'));
  assert.ok(!ids('elena').includes('mother') && !ids('elena').includes('crutch'));
  assert.ok(ids('elena').includes('training'));
  const maya = ROOMS.visible('home', { levelId: 'project', personaId: 'maya', actIdx: 1, done: {}, flags: {} }).map(it => it.id || it.kind);
  assert.ok(maya.includes('partner') && maya.includes('toys') && !maya.includes('training'));
});

test('rooms have fixed sizes on one scale: bathroom 12 x 9, living room 16 x 11, store 24 x 14, each centred', () => {
  const home = ROOMS.rooms.home.bounds, store = ROOMS.rooms.store.bounds;
  assert.deepEqual([home.x1 - home.x0, home.y1], [16, 11]);
  assert.deepEqual([store.x1 - store.x0, store.y1], [24, 14]);
  const bath = ROOMS.rooms.bathroom.bounds;
  assert.deepEqual([bath.x1 - bath.x0, bath.y1], [12, 9]);
  assert.equal(bath.x0, 24 - bath.x1, 'the bathroom is centred');
  for (const it of ROOMS.rooms.bathroom.items) {
    assert.ok(it.x >= bath.x0 && it.x + it.w <= bath.x1 && it.y + it.h <= bath.y1, it.kind + ' is outside the bathroom');
  }
  assert.equal(home.x0, 24 - home.x1, 'the living room is centred');
  for (const it of ROOMS.rooms.home.items) {
    assert.ok(it.x >= home.x0 && it.x + it.w <= home.x1 && it.y + it.h <= home.y1, it.kind + ' is outside the living room');
  }
});

test('the store has three rows of shelving, and the shelf you choose from can only be used from the front', () => {
  const items = Array.from(ROOMS.rooms.store.items);
  const rows = new Set(items.filter(it => it.kind === 'shelves').map(it => it.y));
  assert.ok(rows.size >= 3, 'expected three rows of shelving, found ' + rows.size);
  assert.ok(items.filter(it => it.kind === 'aislesign').length >= 3, 'each row has an aisle sign');
  for (const id of ['shelf', 'board']) {
    const it = items.find(i => i.id === id), f = ROOMS.foot(it);
    assert.equal(it.front, true, id);
    assert.equal(ROOMS.inReach(it, f.x + f.w / 2, f.y + f.h + 6), true, id + ' can be used from the front');
    assert.equal(ROOMS.inReach(it, f.x + f.w / 2, f.y - 2), false, id + ' cannot be used from behind');
  }
});
