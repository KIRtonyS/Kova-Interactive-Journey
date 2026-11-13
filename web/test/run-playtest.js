#!/usr/bin/env node
/* run-playtest.js — plays every path of the game in headless Chrome and reports the result.
   Dev-only. Needs Node 22 or newer and Chrome or Edge. Nothing is installed or downloaded.

     node web/test/run-playtest.js                 play all paths, print a table, exit 1 on any failure
     node web/test/run-playtest.js --shots <dir>   save screenshots of key moments into <dir>
     node web/test/run-playtest.js --root <dir>    test a copy of the game in another folder (it must contain test/)
     node web/test/run-playtest.js --only breaks:david:shelf    play one path
     node web/test/run-playtest.js --smoke         open index.html itself, press real keys from the title into a level
     node web/test/run-playtest.js --jobs 4        play several paths at once, each in its own window

   Set CHROME=/path/to/chrome if the browser is not found. */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const ROOT = path.resolve(opt('--root') || path.join(__dirname, '..'));
const SHOTS = opt('--shots') ? path.resolve(opt('--shots')) : null;
const ONLY = opt('--only');
const SMOKE = args.includes('--smoke');
const JOBS = Math.max(1, +(opt('--jobs') || 1));
const PAGE = pathToFileURL(path.join(ROOT, 'test', 'playtest.html')).href;

function findChrome() {
  const c = [
    process.env.CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
  ].filter(Boolean);
  const found = c.find(p => fs.existsSync(p));
  if (!found) throw new Error('Chrome or Edge not found. Set CHROME to the browser path.');
  return found;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kj-playtest-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + dir, '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--window-size=768,448', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', 'about:blank'
  ], { stdio: 'ignore' });
  const portFile = path.join(dir, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  if (!fs.existsSync(portFile)) { proc.kill(); throw new Error('the browser did not start'); }
  const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
  const ws = new WebSocket('ws://127.0.0.1:' + port + wsPath);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('cannot connect to the browser')); });
  let nextId = 1;
  const pending = new Map(), listeners = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result);
    } else if (m.method) listeners.forEach(fn => fn(m));
  };
  const send = (method, params, sessionId) => new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
  });
  const close = async () => {
    try { await send('Browser.close'); } catch (e) { /* already gone */ }
    await sleep(300);
    try { proc.kill(); } catch (e) { /* already gone */ }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* the profile folder is temporary */ }
  };
  return { send, close, on: fn => listeners.push(fn) };
}

/* Opens one playtest page, waits for it to finish, and returns its result plus any browser-side errors. */
async function runOne(browser, query, shotFile) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', newWindow: JOBS > 1 });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => browser.send(m, p, sessionId);
  const browserErrors = [];
  browser.on(m => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') browserErrors.push('exception: ' + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || m.params.exceptionDetails.text));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') browserErrors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  });
  await S('Runtime.enable'); await S('Log.enable'); await S('Page.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: 768, height: 448, deviceScaleFactor: 1, mobile: false });
  await S('Page.navigate', { url: PAGE + '?' + query });
  let result = null;
  const started = Date.now();
  while (Date.now() - started < 150000) {
    await sleep(200);
    let r;
    try {
      r = await S('Runtime.evaluate', { expression: 'document.title + "\\n" + (document.getElementById("result") || {}).textContent', returnByValue: true });
    } catch (e) { continue; }
    const [title, json] = String(r.result.value).split('\n');
    if (/^PLAYTEST (PASS|FAIL|STOPPED)/.test(title)) { result = JSON.parse(json); break; }
  }
  if (!result) {
    let dump = '';
    try {
      const r = await S('Runtime.evaluate', { expression: 'JSON.stringify((function(){var p=GAME.peek();return {mode:p.mode,act:p.state&&p.state.actIdx,done:p.state&&p.state.done,player:p.player,waiting:p.waiting}})())', returnByValue: true });
      dump = r.result.value;
    } catch (e) { dump = 'no state: ' + e.message; }
    result = { ok: false, errors: ['timed out after 150 s. ' + dump], acts: [], ending: [] };
  }
  if (shotFile) {
    await sleep(250);
    const shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
  }
  await browser.send('Target.closeTarget', { targetId });
  result.errors = (result.errors || []).concat(browserErrors);
  result.ok = result.ok && browserErrors.length === 0;
  return result;
}

/* Opens index.html the way a double-click does and presses real (trusted) keys: title, level, persona, first room. */
async function smoke(browser) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => browser.send(m, p, sessionId);
  const errors = [], steps = [];
  browser.on(m => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + m.params.exceptionDetails.text);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  });
  const look = async expr => (await S('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
  const press = async (key, code, vk) => {
    await S('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk });
    await S('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
    await sleep(350);
  };
  await S('Runtime.enable'); await S('Log.enable'); await S('Page.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await S('Page.navigate', { url: pathToFileURL(path.join(ROOT, 'index.html')).href });
  await sleep(1500);
  const check = (name, ok) => { steps.push((ok ? 'ok   ' : 'FAIL ') + name); if (!ok) errors.push(name); };
  check('title screen shows the title', /Kohler/.test(await look('(document.querySelector(".menu.title h1") || {}).textContent || ""')));
  check('title image loaded', (await look('(document.querySelector(".menu.title img.bg") || {}).naturalWidth || 0')) > 0);
  check('the stage is scaled to fit the window', /scale\(1\.6/.test(await look('document.getElementById("stage").style.transform')));
  await press('Enter', 'Enter', 13);
  check('Enter opens the level menu with two cards', (await look('document.querySelectorAll(".menu.pick .pcard.level").length')) === 2);
  await press('ArrowRight', 'ArrowRight', 39);
  await press('Enter', 'Enter', 13);
  check('the second level offers two personas', (await look('document.querySelectorAll(".menu.pick .pcard.persona").length')) === 2);
  await press('Escape', 'Escape', 27);
  await press('Enter', 'Enter', 13);
  await press('Enter', 'Enter', 13);
  check('a level starts with its title card', (await look('GAME.peek().mode')) === 'card');
  await sleep(4500);
  check('the title card gives way to the room by itself', ['play', 'talk'].includes(await look('GAME.peek().mode')));
  check('no stale wait is left behind when the card times out', (await look('GAME.peek().waiting')) === ((await look('GAME.peek().mode')) === 'talk' ? 1 : 0));
  await browser.send('Target.closeTarget', { targetId });
  return { steps, errors };
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

const LEVELS = {
  breaks: { personas: ['david', 'elena'], picks: ['kohlercom', 'shelf', 'other'] },
  project: { personas: ['maya', 'elena'], picks: ['suite', 'mix', 'pro'] }
};

const SHOT_LIST = [
  ['01-title', 'stop=title'],
  ['02-levels', 'stop=levels'],
  ['03-personas-breaks', 'level=breaks&stop=personas'],
  ['04-personas-project', 'level=project&stop=personas'],
  ['05-card', 'level=breaks&persona=david&stop=card:0'],
  ['06-bathroom-start', 'level=breaks&persona=david&stop=play:0'],
  ['07-narration', 'level=breaks&persona=david&stop=say:0:toolbox'],
  ['07b-thought', 'level=breaks&persona=david&stop=say:0:toolbox&nth=2'],
  ['08-laptop', 'level=breaks&persona=elena&stop=screen:1:laptop'],
  ['09-phone', 'level=breaks&persona=elena&stop=screen:1:phone'],
  ['10-fridge-card', 'level=breaks&persona=david&optional=1&stop=screen:1:fridge'],
  ['11-speech', 'level=breaks&persona=david&optional=1&stop=say:1:mother'],
  ['12-store-choice', 'level=breaks&persona=david&stop=choice:2:shelf'],
  ['13-install', 'level=breaks&persona=david&stop=play:3:valve'],
  ['14-pause', 'level=breaks&persona=david&stop=pause:0'],
  ['15-ending-david', 'level=breaks&persona=david&pick=shelf&stop=ending'],
  ['16-project-laptop', 'level=project&persona=maya&pick=suite&stop=screen:1:laptop'],
  ['17-notebook', 'level=project&persona=maya&pick=suite&stop=screen:1:notebook'],
  ['18-lowes-choice', 'level=project&persona=maya&pick=suite&stop=choice:2:board'],
  ['19-new-bathroom', 'level=project&persona=maya&pick=suite&stop=say:3:controls'],
  ['20-ending-maya', 'level=project&persona=maya&pick=suite&stop=ending']
];

(async () => {
  const browser = await launch();
  let failed = 0;
  try {
    if (SMOKE) {
      const r = await smoke(browser);
      r.steps.forEach(s => console.log(s));
      failed = r.errors.length;
      console.log(failed ? 'smoke run FAILED: ' + JSON.stringify(r.errors) : 'smoke run passed (' + ROOT + ')');
    } else if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const res = await pool(SHOT_LIST, JOBS, ([name, query]) => runOne(browser, query, path.join(SHOTS, name + '.png')));
      res.forEach((r, i) => {
        const ok = r.stoppedAt && r.errors.length === 0;
        if (!ok) failed++;
        console.log((ok ? 'shot ' : 'FAIL ') + SHOT_LIST[i][0] + (ok ? '' : '  ' + JSON.stringify(r.errors)));
      });
    } else {
      const runs = [];
      for (const level of Object.keys(LEVELS)) {
        for (const persona of LEVELS[level].personas) {
          for (const pick of LEVELS[level].picks) runs.push({ level, persona, pick, optional: 0, choose: 0 });
          runs.push({ level, persona, pick: LEVELS[level].picks[0], optional: 1, choose: 1 });
        }
      }
      // the facilitator's pause menu, used in the middle of a line, and a run driven by mouse clicks
      for (const what of ['resume', 'restart', 'menu']) runs.push({ level: 'breaks', persona: 'david', pick: 'shelf', optional: 0, choose: 0, extra: '&pauseAt=1&pauseDo=' + what, note: 'pause: ' + what });
      runs.push({ level: 'project', persona: 'maya', pick: 'mix', optional: 0, choose: 0, extra: '&mouse=1', note: 'mouse clicks' });
      // an impatient player hammering E must not make the store choice by accident
      runs.push({ level: 'breaks', persona: 'elena', pick: 'other', optional: 1, choose: 1, extra: '&mash=1', note: 'mashing E' });
      if (ONLY) {
        const [level, persona, pick] = ONLY.split(':');
        const extra = opt('--extra') || '';
        runs.length = 0;
        if (extra) runs.push({ level, persona, pick, optional: 1, choose: 1, extra: '&' + extra, note: extra });
        else runs.push({ level, persona, pick, optional: 0, choose: 0 }, { level, persona, pick, optional: 1, choose: 1 });
      }
      const res = await pool(runs, JOBS, r => runOne(browser, 'level=' + r.level + '&persona=' + r.persona + '&pick=' + r.pick + '&optional=' + r.optional + '&choose=' + r.choose + (r.extra || '')));
      res.forEach((r, i) => {
        const run = runs[i];
        const ok = r.ok && r.pick === run.pick && r.ending.length === 3 && (!/pause/.test(run.extra || '') || !!r.paused);
        if (!ok) failed++;
        console.log([ok ? 'PASS' : 'FAIL', run.level.padEnd(8), run.persona.padEnd(6), run.pick.padEnd(10), (run.note || (run.optional ? 'all objects' : 'required')).padEnd(14),
          'game clock ' + String(r.clock || 0).padStart(3) + ' s', 'objects per act ' + (r.acts || []).map(a => (a || []).length).join('/')].join('  '));
        if (!ok) console.log('      ' + JSON.stringify({ errors: r.errors, pick: r.pick, ending: r.ending, acts: r.acts }));
      });
      console.log(failed ? failed + ' of ' + runs.length + ' runs FAILED' : 'all ' + runs.length + ' runs passed');
    }
  } finally {
    await browser.close();
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
