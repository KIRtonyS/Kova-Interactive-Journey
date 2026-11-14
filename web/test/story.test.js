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
    assert.ok(short.seconds >= 240, 'required objects only: ' + Math.round(short.seconds) + ' s is under 4 minutes');
    for (const choose of [0, 1]) {          // the second options include "live with it a bit longer"
      const long = L.simulate(STORY, ROOMS, p.levelId, p.personaId, p.pick, { optional: true, choose });
      assert.ok(long.seconds <= 360, 'with every optional object (choices: option ' + (choose + 1) + '): ' + Math.round(long.seconds) + ' s is over 6 minutes');
    }
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
  /* One exception: "The Complete Solution" is part of a Kohler product name printed on the box (FACTS.homeDepot.boxName). */
  const productName = STORY.facts.homeDepot.boxName;
  const strip = str => str.split(productName).join('');
  for (const choose of [0, 1]) {
    for (const { path, line } of allLines({ choose })) {
      for (const re of banned) assert.doesNotMatch(strip(line), re, path.name + ': "' + line + '"');
    }
  }
  for (const re of banned.slice(0, 4)) assert.doesNotMatch(strip(JSON.stringify(STORY)), re);
});

test('voice rules: no "accessible" anywhere, and Elena never says "extends my life"', () => {
  for (const choose of [0, 1]) {
    for (const { path, line } of allLines({ choose })) {
      assert.doesNotMatch(line, /accessib/i, path.name + ': "' + line + '"');
      assert.doesNotMatch(line, /extends? (my|your) life/i, path.name + ': "' + line + '"');
    }
  }
});

/* The list of names is private research data, so it is not in this repository. It is read from
   source-notes/interviewee-names.txt next to the repository (or the file named in INTERVIEWEE_NAMES);
   without that file the check is skipped. */
const NAMES_FILE = process.env.INTERVIEWEE_NAMES || require('node:path').join(__dirname, '..', '..', '..', 'source-notes', 'interviewee-names.txt');
const HAVE_NAMES = require('node:fs').existsSync(NAMES_FILE);
test('no interviewee from the research is named', { skip: HAVE_NAMES ? false : 'the private name list is not on this computer' }, () => {
  const names = require('node:fs').readFileSync(NAMES_FILE, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  assert.ok(names.length > 0, 'the name list is empty');
  const text = JSON.stringify(STORY) + allLines().map(x => x.line).join('\n');
  for (const name of names) {
    const re = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    assert.doesNotMatch(text, re, 'a name from the private list appears in the game text');
  }
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

/* ---------- Round 2: Level 1 is a slow decline, not an emergency ---------- */
test('Level 1 is called "Not What It Used to Be" and pitches a fixture that still works', () => {
  const lv = level('breaks');
  assert.equal(lv.name, 'Not What It Used to Be');
  assert.match(lv.pitch, /still works/i);
});

test('Level 1 has no leak, puddle, towels, slip, fall or injury anywhere a player can read', () => {
  const banned = /\bleak|puddle|towel|\bslip|\bhip\b|bruise|\bfell\b|\bfall\b|nearly went down|injur|hurt|urgent|emergency/i;
  for (const choose of [0, 1]) {
    for (const { path, line } of allLines({ choose })) {
      if (path.levelId === 'breaks') assert.doesNotMatch(line, banned, path.name + ': "' + line + '"');
    }
  }
  for (const id of ['david', 'elena']) assert.doesNotMatch(STORY.personas[id].trigger.breaks, banned);
});

test('Level 1: leaving home offers to live with it a bit longer, and that choice is remembered', () => {
  for (const pid of ['david', 'elena']) {
    const now = L.simulate(STORY, ROOMS, 'breaks', pid, 'shelf');
    const later = L.simulate(STORY, ROOMS, 'breaks', pid, 'shelf', { choose: 1 });
    assert.deepEqual(Array.from(later.errors), []);
    assert.ok(!now.state.flags.waited, pid + ': going now should not set waited');
    assert.equal(later.state.flags.waited, true, pid + ': living with it should set waited');
    assert.ok(Array.from(now.lines).some(l => /live with it/i.test(l)), pid + ': the choice is offered');
    const card = s => { const st = L.newState('breaks', pid); st.flags.waited = s; st.actIdx = 2; return L.text(level('breaks').acts[2].card.time, st); };
    assert.notEqual(card(true), card(false), 'the store card changes when the player waited');
    assert.notDeepEqual(Array.from(now.ending), Array.from(later.ending), pid + ': the ending remembers the wait');
  }
});

test('Level 1: booking the plumber changes a line in the last act', () => {
  const s0 = L.newState('breaks', 'david'); s0.actIdx = 3;
  const s1 = L.newState('breaks', 'david'); s1.actIdx = 3; s1.flags.plumber = true;
  const read = s => { const r = L.createRunner(level('breaks').acts[3].intro || [], s); const o = []; let b; while ((b = r.next())) o.push(b.text); return o.join('|'); };
  assert.notEqual(read(s0), read(s1));
});

test('Level 2: waiting another year changes the ending', () => {
  const lv = level('project');
  for (const pid of ['maya', 'elena']) {
    const a = L.newState('project', pid); a.pick = 'mix';
    const b = L.newState('project', pid); b.pick = 'mix'; b.flags.waited = true;
    assert.notDeepEqual(Array.from(lv.ending(a)), Array.from(lv.ending(b)), pid);
  }
});

test('sign words live in story.js, and the aisle sign follows the Level 1 facts', () => {
  const sg = STORY.signs;
  assert.ok(sg && sg.kohler && sg.proDesk && sg.exit && sg.bath && sg.aisle);
  assert.equal(sg.aisle, STORY.facts.homeDepot.aisle.split(',')[0].toUpperCase());
});

/* ---------- Round 3: Kohler facts checked against Kohler's own spec sheets (13 Nov 2026) ---------- */
function boxText(personaId, pick) {
  const s = L.newState('breaks', personaId); s.actIdx = 3; s.pick = pick;
  const run = L.createRunner(level('breaks').acts[3].things.box.steps, s), out = [];
  let b; while ((b = run.next())) out.push(b.text);
  return out.join(' ');
}

test('Level 1: what is in the box depends on what was bought', () => {
  const f = STORY.facts;
  assert.ok(f.homeDepot.inBox && f.kohlerSite.inBox, 'FACTS lists the box contents for both Kohler toilets');
  for (const pid of ['david', 'elena']) {
    const shelf = boxText(pid, 'shelf'), site = boxText(pid, 'kohlercom'), other = boxText(pid, 'other');
    assert.ok(shelf.includes(f.homeDepot.inBox), 'the shelf box shows the Home Depot contents');
    assert.ok(site.includes(f.kohlerSite.inBox), 'the kohler.com box shows the kohler.com contents');
    assert.match(shelf, /wax ring/i); assert.doesNotMatch(shelf, /no wax ring/i);
    assert.match(shelf, /no supply line/i);
    assert.match(site, /No seat, wax ring or supply line/);
    assert.equal(new Set([shelf, site, other]).size, 3, pid + ': three different boxes');
  }
});

test('Level 1: the kohler.com ending names the parts that box really lacks', () => {
  const r = L.simulate(STORY, ROOMS, 'breaks', 'david', 'kohlercom');
  assert.match(Array.from(r.ending).join(' '), /a seat and a wax ring/);
});

test('claims that did not survive the fact check are gone', () => {
  const gone = [/14-page/i, /four languages/i, /No installation offered/i, /sixty pounds/i, /Kohler suite/i, /QR code to register/i, /wants my email/i];
  for (const choose of [0, 1]) {
    for (const { path, line } of allLines({ choose })) {
      for (const re of gone) assert.doesNotMatch(line, re, path.name + ': "' + line + '"');
    }
  }
});

test('models are named the way Kohler names them', () => {
  const f = STORY.facts;
  assert.equal(f.homeDepot.boxName, 'Highline Arc The Complete Solution');
  assert.equal(f.kohlerSite.number, 'K-43999-0');
  const l1 = allLines().filter(x => x.path.levelId === 'breaks').map(x => x.line).join('\n');
  assert.ok(l1.includes(f.homeDepot.boxName), 'the shelf box shows its full name');
  assert.match(l1, /Installation extra, in some ZIP codes/);
  const l2 = allLines().filter(x => x.path.levelId === 'project').map(x => x.line).join('\n');
  assert.match(l2, /One Kohler collection/);
});

test('the title screen credits the art and points to the credits file', () => {
  assert.match(STORY.ui.credits, /Liberated Pixel Cup/);
  assert.match(STORY.ui.credits, /CC-BY-SA/);
  assert.match(STORY.ui.credits, /CREDITS\.md/);
});
