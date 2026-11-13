/* Story checks: every path can be finished, says what it should, and fits the time.
   Run with: node --test "web/test/*.test.js" */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load.js');

const w = load(['art.js', 'props.js', 'rooms.js', 'story.js', 'game.js']);
const STORY = w.STORY, ROOMS = w.ROOMS, L = w.GAME.logic;

const LEVELS = {
  breaks: { personas: ['david', 'elena'], store: 'Home Depot', picks: ['kohlercom', 'shelf', 'other'] },
  project: { personas: ['maya', 'elena'], store: "Lowe's", picks: ['suite', 'mix', 'pro'] }
};
const ROOM_ORDER = ['bathroom', 'home', 'store', 'bathroom'];
const STAGES = ['Trigger', 'Inspiration', 'First Search', 'Compare Online', 'Hesitation', 'Check Stock & Plan',
  'Go to the Store', 'See Kohler on Display', 'Ask an Associate', 'Decide', 'Buy & Arrange Install', 'Install & Live With It'];

const PATHS = [];
for (const levelId of Object.keys(LEVELS)) {
  for (const personaId of LEVELS[levelId].personas) {
    for (const pick of LEVELS[levelId].picks) PATHS.push({ levelId, personaId, pick, name: levelId + ' / ' + personaId + ' / ' + pick });
  }
}
const level = id => STORY.levels.find(l => l.id === id);

/* ---------- shape ---------- */
test('the story has a title, a subtitle and the three personas', () => {
  assert.ok(STORY.title && STORY.subtitle);
  assert.match(STORY.title, /Kohler/);
  for (const id of ['maya', 'david', 'elena']) {
    const p = STORY.personas[id];
    assert.ok(p && p.name && p.age && p.role && p.tagline, id + ' is missing a field');
  }
});

test('there are two levels with the right personas, store and four acts in room order', () => {
  assert.deepEqual(Array.from(STORY.levels.map(l => l.id)), ['breaks', 'project']);
  for (const id of Object.keys(LEVELS)) {
    const lv = level(id);
    assert.deepEqual(Array.from(lv.personas), LEVELS[id].personas);
    assert.equal(lv.store, LEVELS[id].store);
    assert.ok(lv.name && lv.pitch && lv.minutes);
    assert.deepEqual(Array.from(lv.acts.map(a => a.room)), ROOM_ORDER);
    assert.equal(lv.acts[3].final, true);
    for (const pid of lv.personas) assert.ok(STORY.personas[pid].trigger[id], pid + ' has no trigger line for ' + id);
  }
});

test('every act has a title card, a location label, an exit and a "not yet" line', () => {
  for (const lv of STORY.levels) {
    lv.acts.forEach((act, i) => {
      for (const pid of lv.personas) {
        const s = L.newState(lv.id, pid); s.actIdx = i;
        const tag = lv.id + ' act ' + (i + 1) + ' for ' + pid;
        assert.ok(L.text(act.card.time, s), tag + ': no card time');
        assert.ok(L.text(act.card.line, s), tag + ': no card line');
        assert.ok(L.text(act.chip, s), tag + ': no location label');
        assert.ok(L.text(act.notYet, s), tag + ': no "not yet" line');
        assert.equal(act.exit, 'door');
      }
    });
  }
});

test('each room offers 3 to 5 usable objects, each with a label', () => {
  for (const lv of STORY.levels) {
    lv.acts.forEach((act, i) => {
      for (const pid of lv.personas) {
        const s = L.newState(lv.id, pid); s.actIdx = i;
        const things = L.thingsOf(act, s), n = Object.keys(things).length;
        assert.ok(n >= 3 && n <= 5, lv.id + ' act ' + (i + 1) + ' has ' + n + ' objects for ' + pid);
        for (const id of Object.keys(things)) assert.ok(L.text(things[id].label, s), id + ' has no label');
      }
    });
  }
});

test('every object gives every persona who can reach it something to read, and required ones a thought', () => {
  for (const lv of STORY.levels) {
    lv.acts.forEach((act, i) => {
      for (const pid of lv.personas) {
        const s = L.newState(lv.id, pid); s.actIdx = i;
        const things = L.thingsOf(act, s);
        for (const id of Object.keys(things)) {
          const run = L.createRunner(things[id].steps, s);
          const types = [];
          let b, guard = 0;
          while ((b = run.next()) && guard++ < 50) { types.push(b.type); if (b.type === 'choice') run.choose(0); }
          const tag = lv.id + ' act ' + (i + 1) + ' "' + id + '" for ' + pid;
          assert.ok(types.length >= 1, tag + ': nothing to read');
          if ((act.needs || []).includes(id)) assert.ok(types.includes('thought'), tag + ': no thought in the persona\'s voice');
        }
      }
    });
  }
});

/* ---------- every path can be finished ---------- */
for (const p of PATHS) {
  test(p.name + ': the required path finishes with no dead end and the purchase is saved', () => {
    const r = L.simulate(STORY, ROOMS, p.levelId, p.personaId, p.pick);
    assert.deepEqual(Array.from(r.errors), []);
    assert.equal(r.state.pick, p.pick);
    assert.equal(r.ending.length, 3, 'the ending is three lines');
  });

  test(p.name + ': the path with every optional object also finishes', () => {
    const r = L.simulate(STORY, ROOMS, p.levelId, p.personaId, p.pick, { optional: true });
    assert.deepEqual(Array.from(r.errors), []);
  });

  test(p.name + ': takes 4 to 6 minutes', () => {
    const short = L.simulate(STORY, ROOMS, p.levelId, p.personaId, p.pick);
    const long = L.simulate(STORY, ROOMS, p.levelId, p.personaId, p.pick, { optional: true });
    assert.ok(short.seconds >= 240, 'required objects only: ' + Math.round(short.seconds) + ' s is under 4 minutes');
    assert.ok(long.seconds <= 360, 'with every optional object: ' + Math.round(long.seconds) + ' s is over 6 minutes');
  });
}

test('the ending changes with the purchase and with the persona', () => {
  for (const id of Object.keys(LEVELS)) {
    const seen = new Set();
    for (const pid of LEVELS[id].personas) {
      for (const pick of LEVELS[id].picks) seen.add(L.simulate(STORY, ROOMS, id, pid, pick).ending.join('|'));
    }
    assert.equal(seen.size, 6, id + ': expected 6 different endings, found ' + seen.size);
  }
});

test('each level has one store choice with three options', () => {
  for (const id of Object.keys(LEVELS)) {
    const picks = new Set();
    JSON.stringify(level(id).acts[2].things, (k, v) => { if (k === 'pick' && typeof v === 'string') picks.add(v); return v; });
    assert.deepEqual(Array.from(picks).sort(), LEVELS[id].picks.slice().sort());
  }
});

/* ---------- words ---------- */
function allLines(opts) {
  const out = [];
  for (const p of PATHS) {
    const r = L.simulate(STORY, ROOMS, p.levelId, p.personaId, p.pick, { optional: true, choose: opts && opts.choose });
    for (const line of r.lines) out.push({ path: p, line });
  }
  return out;
}

test('nothing a player can read mentions Kova, solutions, opportunities or a research label', () => {
  const banned = [/kova/i, /pain point/i, /\bsolution/i, /opportunit/i, /journey map/i, /\bstage\b/i, /persona/i, /touchpoint/i];
  for (const choose of [0, 1]) {
    for (const { path, line } of allLines({ choose })) {
      for (const re of banned) assert.doesNotMatch(line, re, path.name + ': "' + line + '"');
    }
  }
  for (const re of banned.slice(0, 4)) assert.doesNotMatch(JSON.stringify(STORY), re);
});

test('voice rules: no "accessible" anywhere, and Elena never says "extends my life"', () => {
  for (const choose of [0, 1]) {
    for (const { path, line } of allLines({ choose })) {
      assert.doesNotMatch(line, /accessib/i, path.name + ': "' + line + '"');
      assert.doesNotMatch(line, /extends? (my|your) life/i, path.name + ': "' + line + '"');
    }
  }
});

test('no interviewee from the research is named', () => {
  const names = [/dorfman/i, /wen yang/i, /amogh/i, /morye/i, /coker/i, /aftab/i, /\bsait\b/i, /howlett/i];
  const text = JSON.stringify(STORY) + allLines().map(x => x.line).join('\n');
  for (const re of names) assert.doesNotMatch(text, re);
});

test('the title and text say Kohler', () => {
  const text = allLines().map(x => x.line).join('\n');
  assert.match(text, /Kohler/);
});

/* ---------- Level 1 tells the researched version, with the real details in one place ---------- */
test('Level 1 facts are kept in one dated block and used on screen', () => {
  const f = STORY.facts;
  assert.ok(f && f.checked, 'STORY.facts.checked (the date the numbers were checked) is missing');
  const text = allLines().filter(x => x.path.levelId === 'breaks').map(x => x.line).join('\n');
  for (const must of [f.kohlerSite.model, f.kohlerSite.price, f.kohlerSite.reviews, f.homeDepot.model, f.homeDepot.price,
    f.homeDepot.aisle, f.lowes.model, f.findOnDisplay]) {
    assert.ok(text.includes(must), 'Level 1 never shows "' + must + '"');
  }
  assert.equal(f.kohlerSite.price, '$343.57');
  assert.equal(f.homeDepot.model, 'Highline Arc');
  assert.equal(f.homeDepot.price, '$189');
});

/* ---------- every journey stage is felt on the required path ---------- */
test('every journey stage is covered by something the player must do, in both levels', () => {
  for (const lv of STORY.levels) {
    const covered = new Set();
    lv.acts.forEach(act => {
      (act.stages || []).forEach(s => covered.add(s));
      for (const id of (act.needs || [])) (act.things[id].stages || []).forEach(s => covered.add(s));
    });
    for (const s of STAGES) assert.ok(covered.has(s), lv.id + ': stage "' + s + '" is not covered by a required object or an act');
  }
});

test('stage names are for mapping only: none is shown to the player', () => {
  const text = allLines().map(x => x.line).join('\n');
  for (const s of ['First Search', 'Compare Online', 'Check Stock', 'See Kohler on Display', 'Ask an Associate', 'Arrange Install', 'Live With It']) {
    assert.ok(!text.includes(s), 'the stage name "' + s + '" appears in the game text');
  }
});
