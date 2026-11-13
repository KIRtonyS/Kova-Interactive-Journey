/* Engine logic checks (no browser needed). Run with: node --test "web/test/*.test.js" */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, plain } = require('./load.js');

const w = load(['art.js', 'props.js', 'rooms.js', 'game.js']);
const L = w.GAME.logic, ROOMS = w.ROOMS;

const david = () => L.newState('breaks', 'david');

function drain(run) {
  const out = [];
  let b;
  while ((b = run.next())) out.push(plain(b));
  return out;
}

/* ---------- text ---------- */
test('text: a plain string is returned as is', () => {
  assert.equal(L.text('Hello', david()), 'Hello');
});

test('text: an object keyed by persona picks the current persona', () => {
  assert.equal(L.text({ david: 'D', elena: 'E' }, david()), 'D');
});

test('text: an object falls back to "_" for other personas', () => {
  assert.equal(L.text({ elena: 'E', _: 'anyone' }, david()), 'anyone');
});

test('text: a persona with no entry and no fallback gets null', () => {
  assert.equal(L.text({ elena: 'E' }, david()), null);
});

test('text: a function receives the state, and its result is resolved again', () => {
  const s = david(); s.pick = 'shelf';
  assert.equal(L.text(st => ({ david: 'picked ' + st.pick }), s), 'picked shelf');
});

/* ---------- state ---------- */
test('newState starts at the first act with nothing done and no purchase', () => {
  assert.deepEqual(plain(L.newState('project', 'maya')), { levelId: 'project', personaId: 'maya', actIdx: 0, done: {}, flags: {}, pick: null, variant: null });
});

/* ---------- gating ---------- */
const act = {
  needs: ['a', 'b'],
  things: {
    a: { label: 'A', req: true, steps: [] },
    b: { label: 'B', req: true, after: ['a'], steps: [] },
    m: { label: 'Mother', only: 'david', steps: [] },
    t: { label: 'Training', only: ['elena'], steps: [] }
  }
};

test('a thing with "after" unlocks only when those things are done', () => {
  const s = david();
  assert.equal(L.unlocked(act.things.b, s), false);
  s.done.a = true;
  assert.equal(L.unlocked(act.things.b, s), true);
  assert.equal(L.unlocked(act.things.a, david()), true);
});

test('the exit opens only when every needed thing is done', () => {
  const s = david();
  assert.equal(L.exitOpen(act, s), false);
  s.done.a = true;
  assert.equal(L.exitOpen(act, s), false);
  s.done.b = true;
  assert.equal(L.exitOpen(act, s), true);
});

test('thingsOf hides things that belong to another persona', () => {
  assert.deepEqual(Object.keys(L.thingsOf(act, david())), ['a', 'b', 'm']);
  assert.deepEqual(Object.keys(L.thingsOf(act, L.newState('breaks', 'elena'))), ['a', 'b', 't']);
});

/* ---------- dialogue runner ---------- */
test('runner: narration, thought and speech come out in order with their type', () => {
  const run = L.createRunner([{ n: 'It rocks.' }, { t: { david: 'Mom nearly fell.' } }, { s: 'Associate', text: 'I am in lighting today.' }], david());
  assert.deepEqual(drain(run), [
    { type: 'narr', text: 'It rocks.' },
    { type: 'thought', text: 'Mom nearly fell.' },
    { type: 'speech', speaker: 'Associate', text: 'I am in lighting today.' }
  ]);
});

test('runner: a thought with no line for this persona is skipped', () => {
  const run = L.createRunner([{ t: { elena: 'My hip.' } }, { n: 'After.' }], david());
  assert.deepEqual(drain(run), [{ type: 'narr', text: 'After.' }]);
});

test('runner: a choice applies its "set" and plays its "then" before the remaining steps', () => {
  const s = david();
  const run = L.createRunner([
    { choice: { prompt: 'Which one?', options: [
      { label: 'Shelf', set: { pick: 'shelf', tried: true }, then: [{ n: 'You take it.' }] },
      { label: 'Other', set: { pick: 'other' } }
    ] } },
    { n: 'Checkout.' }
  ], s);
  const c = run.next();
  assert.equal(c.type, 'choice');
  assert.equal(c.prompt, 'Which one?');
  assert.deepEqual(plain(c.options), ['Shelf', 'Other']);
  run.choose(0);
  assert.equal(s.pick, 'shelf');
  assert.equal(s.flags.tried, true);
  assert.deepEqual(drain(run), [{ type: 'narr', text: 'You take it.' }, { type: 'narr', text: 'Checkout.' }]);
});

test('runner: next() does not move past a choice until one is chosen', () => {
  const run = L.createRunner([{ choice: { prompt: 'P', options: [{ label: 'A' }] } }, { n: 'x' }], david());
  assert.equal(run.next().type, 'choice');
  assert.equal(run.next().type, 'choice');
  run.choose(0);
  assert.equal(run.next().text, 'x');
});

test('runner: an "fn" step is built from the state at the moment it is reached', () => {
  const s = david();
  const run = L.createRunner([
    { choice: { prompt: 'P', options: [{ label: 'A', set: { pick: 'kohlercom' } }] } },
    { fn: st => [{ n: 'pick is ' + st.pick }] }
  ], s);
  run.next(); run.choose(0);
  assert.deepEqual(drain(run), [{ type: 'narr', text: 'pick is kohlercom' }]);
});

test('runner: a step with "when" plays only if the condition holds', () => {
  const s = david(); s.pick = 'other';
  const run = L.createRunner([{ n: 'A', when: st => st.pick === 'shelf' }, { n: 'B', when: st => st.pick === 'other' }], s);
  assert.deepEqual(drain(run), [{ type: 'narr', text: 'B' }]);
});

test('runner: a screen step is passed through', () => {
  const run = L.createRunner([{ screen: { kind: 'phone', app: 'Store' } }], david());
  assert.deepEqual(drain(run), [{ type: 'screen', screen: { kind: 'phone', app: 'Store' } }]);
});

test('runner: a "set" step saves values without showing anything', () => {
  const s = david();
  const run = L.createRunner([{ set: { calledPlumber: true } }, { n: 'ok' }], s);
  assert.deepEqual(drain(run), [{ type: 'narr', text: 'ok' }]);
  assert.equal(s.flags.calledPlumber, true);
});

/* ---------- movement ---------- */
const lim = { x0: 4, x1: 380, y0: 52, y1: 223 };
const wall = [{ x: 100, y: 100, w: 20, h: 20 }];

test('move: walks freely in open floor', () => {
  assert.deepEqual(plain(L.move({ x: 50, y: 80 }, 3, -2, lim, wall)), { x: 53, y: 78 });
});

test('move: stops at a solid footprint', () => {
  const p = L.move({ x: 94, y: 110 }, 5, 0, lim, wall);
  assert.equal(p.x, 94);
});

test('move: slides along a wall when only one axis is blocked', () => {
  const p = L.move({ x: 94, y: 110 }, 5, 3, lim, wall);
  assert.deepEqual(plain(p), { x: 94, y: 113 });
});

test('move: stays inside the room', () => {
  assert.deepEqual(plain(L.move({ x: 5, y: 53 }, -10, -10, lim, [])), { x: 5, y: 53 });
});

/* ---------- reading time ---------- */
test('beatSeconds grows with the length of the line', () => {
  assert.ok(L.beatSeconds('Short.') < L.beatSeconds('A much longer line that takes a person noticeably more time to read through.'));
  assert.ok(L.beatSeconds('Short.') > 0.5);
});

/* ---------- simulate: a full run of one path without a browser ---------- */
function miniStory(overrides) {
  const acts = [{
    room: 'bathroom', variant: 'old', card: { time: 'Tuesday', line: 'Bathroom' },
    things: {
      toilet: { label: 'Toilet', req: true, steps: [{ n: 'It rocks.' }, { t: { david: 'She nearly fell here.' } }] },
      toolbox: { label: 'Toolbox', req: true, after: ['toilet'], steps: [
        { choice: { prompt: 'Which?', options: [
          { label: 'A', set: { pick: 'shelf' }, then: [{ n: 'Took A.' }] },
          { label: 'B', set: { pick: 'other' }, then: [{ n: 'Took B, the other one.' }] }
        ] } }
      ] },
      puddle: { label: 'Puddle', steps: [{ n: 'Soaked towels.' }] }
    },
    needs: ['toilet', 'toolbox'], exit: 'door', leave: [{ n: 'Leaving.' }], notYet: 'Not yet.', final: true
  }];
  return { levels: [Object.assign({ id: 'breaks', personas: ['david', 'elena'], acts, ending: s => ['It works.', 'Pick: ' + s.pick, 'Done.'] }, overrides)] };
}

test('simulate: a valid path finishes, takes the purchase asked for, and reports time and words', () => {
  const r = L.simulate(miniStory(), ROOMS, 'breaks', 'david', 'other');
  assert.deepEqual(plain(r.errors), []);
  assert.equal(r.ok, true);
  assert.equal(r.state.pick, 'other');
  assert.deepEqual(plain(r.ending), ['It works.', 'Pick: other', 'Done.']);
  assert.ok(r.seconds > 10, 'seconds = ' + r.seconds);
  assert.ok(r.words > 10, 'words = ' + r.words);
});

test('simulate: optional things are skipped unless asked for', () => {
  const base = L.simulate(miniStory(), ROOMS, 'breaks', 'david', 'shelf');
  const all = L.simulate(miniStory(), ROOMS, 'breaks', 'david', 'shelf', { optional: true });
  assert.ok(all.words > base.words);
  assert.ok(all.seconds > base.seconds);
});

test('simulate: a needed thing that is not in the room is reported', () => {
  const st = miniStory();
  st.levels[0].acts[0].things.ghost = { label: 'Ghost', req: true, steps: [{ n: 'boo' }] };
  st.levels[0].acts[0].needs.push('ghost');
  const r = L.simulate(st, ROOMS, 'breaks', 'david', 'shelf');
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /ghost/);
});

test('simulate: a needed thing that can never unlock is reported as a dead end', () => {
  const st = miniStory();
  st.levels[0].acts[0].things.toilet.after = ['toolbox'];
  const r = L.simulate(st, ROOMS, 'breaks', 'david', 'shelf');
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /dead end/i);
});

test('simulate: an ending that is not a short list of lines is reported', () => {
  const r = L.simulate(miniStory({ ending: () => [] }), ROOMS, 'breaks', 'david', 'shelf');
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /ending/i);
});

test('simulate: lists every line a player would read', () => {
  const r = L.simulate(miniStory(), ROOMS, 'breaks', 'david', 'other', { optional: true });
  const lines = Array.from(r.lines);
  for (const must of ['Tuesday', 'Bathroom', 'It rocks.', 'She nearly fell here.', 'Which?', 'A', 'B', 'Took B, the other one.', 'Soaked towels.', 'Leaving.', 'Pick: other']) {
    assert.ok(lines.includes(must), 'missing "' + must + '" in ' + JSON.stringify(lines));
  }
  assert.ok(!lines.includes('Took A.'), 'a branch that was not taken is not listed');
});

test('simulate: lists the text inside a screen', () => {
  const st = miniStory();
  st.levels[0].acts[0].things.toilet.steps.push({ screen: { kind: 'phone', app: 'Store app', rows: [{ title: 'Row one', badge: { david: 'For David', elena: 'For Elena' }, tone: 'ok' }] } });
  const lines = Array.from(L.simulate(st, ROOMS, 'breaks', 'david', 'shelf').lines);
  assert.ok(lines.includes('Store app') && lines.includes('Row one') && lines.includes('For David'));
  assert.ok(!lines.includes('For Elena') && !lines.includes('phone') && !lines.includes('ok'));
});

test('simulate: opts.choose picks that option on choices that do not set the purchase', () => {
  const st = miniStory();
  st.levels[0].acts[0].things.puddle.steps = [{ choice: { prompt: 'Mop?', options: [{ label: 'Yes', then: [{ n: 'Mopped.' }] }, { label: 'No', then: [{ n: 'Left it.' }] }] } }];
  const first = Array.from(L.simulate(st, ROOMS, 'breaks', 'david', 'shelf', { optional: true }).lines);
  const second = Array.from(L.simulate(st, ROOMS, 'breaks', 'david', 'shelf', { optional: true, choose: 1 }).lines);
  assert.ok(first.includes('Mopped.') && !first.includes('Left it.'));
  assert.ok(second.includes('Left it.') && !second.includes('Mopped.'));
  assert.equal(L.simulate(st, ROOMS, 'breaks', 'david', 'shelf', { optional: true, choose: 1 }).state.pick, 'shelf');
});

/* ---------- waiting for the player or the clock (review finding: a swallowed key press) ---------- */
const settle = () => new Promise(r => setImmediate(r));

test('waits: an action wait resolves on the next action', async () => {
  const wt = L.createWaits(); let hit = 0;
  wt.action().then(() => hit++);
  assert.equal(wt.pending(), 1);
  wt.fire(); await settle();
  assert.equal(hit, 1);
  assert.equal(wt.pending(), 0);
});

test('waits: a timed wait resolves when the clock reaches it', async () => {
  const wt = L.createWaits(); let hit = 0;
  wt.advance(10);
  wt.time(2).then(() => hit++);
  wt.advance(11.9); await settle();
  assert.equal(hit, 0);
  wt.advance(12); await settle();
  assert.equal(hit, 1);
});

test('waits: when a timed-out "action or time" wait ends, no action wait is left behind to swallow the next key', async () => {
  const wt = L.createWaits(); let how = null;
  wt.actionOr(3).then(v => { how = v; });
  wt.advance(3.1); await settle();
  assert.equal(how, 'time');
  assert.equal(wt.pending(), 0);
});

test('waits: when the action wins an "action or time" wait, the timer is dropped', async () => {
  const wt = L.createWaits(); const got = [];
  wt.actionOr(3).then(v => got.push(v));
  wt.fire(); await settle();
  wt.advance(10); await settle();
  assert.deepEqual(got, ['action']);
});

test('waits: clear() drops every wait, so an abandoned flow never continues', async () => {
  const wt = L.createWaits(); let hit = 0;
  wt.action().then(() => hit++); wt.time(1).then(() => hit++); wt.actionOr(1).then(() => hit++);
  wt.clear(); wt.fire(); wt.advance(99); await settle();
  assert.equal(hit, 0);
  assert.equal(wt.pending(), 0);
});

/* ---------- keys are read by position, so other keyboard layouts still work ---------- */
test('keyName: letter keys are read from their physical position', () => {
  assert.equal(L.keyName({ key: 'ㄴ', code: 'KeyS' }), 's');
  assert.equal(L.keyName({ key: 'E', code: 'KeyE' }), 'e');
});

test('keyName: other keys use their name, in lower case', () => {
  assert.equal(L.keyName({ key: 'ArrowUp', code: 'ArrowUp' }), 'arrowup');
  assert.equal(L.keyName({ key: 'Enter', code: 'Enter' }), 'enter');
  assert.equal(L.keyName({ key: ' ', code: 'Space' }), ' ');
  assert.equal(L.keyName({ key: 'Escape' }), 'escape');
  assert.equal(L.keyName({ key: '2', code: 'Digit2' }), '2');
  assert.equal(L.keyName({ key: 'd' }), 'd');
});

/* ---------- a likely editing slip must not freeze the game ---------- */
test('"after", "needs" and "only" may be written as a single name instead of a list', () => {
  const s = david();
  assert.equal(L.unlocked({ after: 'toilet' }, s), false);
  s.done.toilet = true;
  assert.equal(L.unlocked({ after: 'toilet' }, s), true);
  assert.equal(L.exitOpen({ needs: 'toilet' }, s), true);
  assert.deepEqual(plain(L.list('one')), ['one']);
  assert.deepEqual(plain(L.list(null)), []);
  assert.deepEqual(plain(L.list(['a', 'b'])), ['a', 'b']);
});
