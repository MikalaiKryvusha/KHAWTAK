// chrome-core-smoke.mjs — a smoke of the CORE in a real browser, not the user-path harness (that is tools/ui-run.mjs, planned):
// open kalculator/index.html in this machine's Chrome (headless, debug port — HOUSE_RULES R3),
// read console errors and every request, evaluate the core through window.KHAWTAK and print what Chrome computed — the numbers
// must equal Node's (node kalculator/test.mjs). No dependencies: Node's WebSocket + the DevTools protocol. Profile in .work/tmp.
//
//   node tools/chrome-core-smoke.mjs
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const profile = resolve('.work/tmp/chrome-smoke/profile');
const url = pathToFileURL(resolve('kalculator/index.html')).href;
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await wait(200); } }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = []; const requests = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value).join(' '));
  if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
await send('Page.navigate', { url });
await wait(1500);
const expr = `JSON.stringify((() => { const K = window.KHAWTAK; if (!K) return { ok: false };
  const A2 = K.bladeSection({ chord_mm: 180, t: 0.18, stud_d_mm: 8, flange_mm: 3 });
  const S = K.SITE_DEFAULT;
  return { ok: true, title: document.title, n: Object.keys(K).length, hub: S.hub_m,
    vHub: K.shearTwoLayer(S.vRef, S.zRef, S.hub_m, S.z0), A: A2.A, Ix: A2.Ix, k: A2.k,
    F0: K.jointPreload_N(30, A2.k, 1220), mu15: K.airViscosity(15),
    Re14: K.designReynolds({ rho: 1.2275, V: 5, lambda: 6, rOverR: 0.75, chord_m: K.schmitzChord(0.525, 0.7, 3, 1.2, 6), mu: K.airViscosity(7) }).Re,
    seam: (() => { const R = 0.68, pb = K.printedBlade({ R, Cl: 1.2, lambda: 6, alphaD_rad: 6 * Math.PI / 180 });
      const sec = K.bladeSection({ chord_mm: pb.chord(0.11) * 1000, t: pb.tc(0.11), stud_d_mm: 5, flange_mm: K.flangeAt_mm(0.11, R) });
      const ms = K.bladeMass({ blade: pb, R, stud: 'M5', studLen_m: 0.332 }), Fc = K.slmCentrifugal({ mB_kg: ms.m_kg, Rcog_m: ms.cog_m, omega: 6 * 2.5 * 6 / R });
      const s = K.seamCheck({ section: sec, grade: '4.8', Fc_D_N: Fc,
        MyB_H_Nm: K.slmParked({ R, rho: 1.225, vRef: 30, Aproj: K.bladePlanArea(pb.chord, 0.1 * R, R) }).MyB_Nm,
        MyB_D_Nm: K.slmMaxThrust({ R, rho: 1.225, vAve: 6 }).MyB_Nm });
      return { rootChord_mm: pb.chord(0.11) * 1000, F0: s.F0_N, stud: s.stud, verdict: s.verdict, iecPasses: s.iec.passes }; })() }; })())`;
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log('chrome computed:', res.result.result.value);
console.log('console errors:', errors.length ? errors : 'none');
const foreign = requests.filter((u) => u.toLowerCase() !== url.toLowerCase() && !u.startsWith('data:'));
console.log('requests besides the page:', foreign.length ? foreign : 'none');
ws.close(); chrome.kill();
