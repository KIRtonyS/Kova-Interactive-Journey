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
