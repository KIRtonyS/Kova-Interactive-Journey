/* Test helper: loads the game's classic scripts into a sandbox that looks like a browser window.
   Dev-only. Not loaded by index.html and not part of the hand-off zip. */
'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function load(files) {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of files) {
    const file = path.join(__dirname, '..', 'js', f);
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  }
  return sandbox;
}

/* Values made inside the sandbox have a different Object prototype; flatten them before comparing. */
function plain(v) { return JSON.parse(JSON.stringify(v)); }

/* The eight scenes of the game: which room each act uses and which objects the player must be able to use.
   Taken from the build plan's object tables. story.test.js checks story.js against the same rooms. */
const SCENES = [
  { name: 'L1 act1 bathroom', room: 'bathroom', variant: 'old', levelId: 'breaks', actIdx: 0, personas: ['david', 'elena'], ids: ['toilet', 'toolbox', 'plunger', 'vanity', 'door'] },
  { name: 'L1 act2 home', room: 'home', levelId: 'breaks', actIdx: 1, personas: ['david', 'elena'], ids: ['laptop', 'phone', 'fridge', 'tablet', 'door'], extra: { david: ['mother'], elena: ['training'] } },
  { name: 'L1 act3 store', room: 'store', levelId: 'breaks', actIdx: 2, personas: ['david', 'elena'], ids: ['display', 'kohler', 'associate', 'shopper', 'shelf', 'door'] },
  { name: 'L1 act4 bathroom', room: 'bathroom', variant: 'old', levelId: 'breaks', actIdx: 3, personas: ['david', 'elena'], ids: ['box', 'valve', 'toilet', 'manual', 'door'] },
  { name: 'L2 act1 bathroom', room: 'bathroom', variant: 'old', levelId: 'project', actIdx: 0, personas: ['maya', 'elena'], ids: ['tub', 'vanity', 'tile', 'rack', 'door'] },
  { name: 'L2 act2 home', room: 'home', levelId: 'project', actIdx: 1, personas: ['maya', 'elena'], ids: ['laptop', 'phone', 'notebook', 'moodboard', 'door'], extra: { maya: ['partner'], elena: ['training'] } },
  { name: 'L2 act3 store', room: 'store', levelId: 'project', actIdx: 2, personas: ['maya', 'elena'], ids: ['display', 'kohler', 'associate', 'contractor', 'board', 'door'] },
  { name: 'L2 act4 bathroom', room: 'bathroom', variant: 'new', levelId: 'project', actIdx: 3, personas: ['maya', 'elena'], ids: ['box', 'phone', 'controls', 'tub', 'door'] }
];

function sceneStates() {
  const out = [];
  for (const sc of SCENES) {
    for (const personaId of sc.personas) {
      out.push({
        scene: sc, name: sc.name + ' / ' + personaId,
        state: { levelId: sc.levelId, personaId, actIdx: sc.actIdx, variant: sc.variant, done: {}, flags: {}, pick: null },
        ids: sc.ids.concat((sc.extra && sc.extra[personaId]) || [])
      });
    }
  }
  return out;
}

module.exports = { load, plain, SCENES, sceneStates };
