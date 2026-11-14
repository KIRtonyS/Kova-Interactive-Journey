/* Dev tool: screenshot of a page in headless Chrome or Edge. Node 22+, no packages.
   node web/test/shot.js <file-or-url> <out.png> [width=768] [height=448] [wait-expression]
   The page is ready when wait-expression is true (default: the page has finished loading).
   Example: node web/test/shot.js "web/test/gallery.html?scenes=0" out.png 768 468 "document.body.dataset.ready"
   Prints any browser errors and exits with 1 if there were some. */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const [target, out, w = '768', h = '448', ready = 'document.readyState === "complete"'] = process.argv.slice(2);
if (!target || !out) { console.error('usage: node shot.js <file-or-url> <out.png> [width] [height] [wait-expression]'); process.exit(1); }
const [file, query] = target.split('?');
const url = /^[a-z]+:\/\//i.test(target) ? target : pathToFileURL(path.resolve(file)).href + (query ? '?' + query : '');

const chrome = [process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'
].filter(Boolean).find(p => fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  if (!chrome) throw new Error('Chrome or Edge not found. Set CHROME to the browser path.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kj-shot-'));
  const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + dir, '--no-first-run',
    '--no-default-browser-check', '--disable-gpu', '--window-size=' + w + ',' + h, 'about:blank'], { stdio: 'ignore' });
  const portFile = path.join(dir, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
  const ws = new WebSocket('ws://127.0.0.1:' + port + wsPath);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('cannot connect to the browser')); });
  let nextId = 1; const pending = new Map(), errors = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text));
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  };
  const send = (method, params, sessionId) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params: params || {}, sessionId })); });
  try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const S = (m, p) => send(m, p, sessionId);
    await S('Runtime.enable'); await S('Log.enable'); await S('Page.enable');
    await S('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
    await S('Page.navigate', { url });
    let ok = false;
    for (let i = 0; i < 100 && !ok; i++) {
      await sleep(100);
      try { ok = !!(await S('Runtime.evaluate', { expression: '!!(' + ready + ')', returnByValue: true })).result.value; } catch (e) { /* page not ready */ }
    }
    await sleep(200);
    const title = (await S('Runtime.evaluate', { expression: 'document.title', returnByValue: true })).result.value;
    const shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log(out + '  (' + title + (ok ? '' : ', NOT READY') + ')');
    errors.forEach(e => console.log('BROWSER ERROR ' + e));
    if (errors.length || !ok) process.exitCode = 1;
  } finally {
    try { await send('Browser.close'); } catch (e) { /* already gone */ }
    await sleep(300);
    try { proc.kill(); } catch (e) { /* already gone */ }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* temporary profile */ }
  }
})().catch(e => { console.error(e.message); process.exit(1); });
