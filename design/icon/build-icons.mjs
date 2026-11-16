#!/usr/bin/env node
// build-icons.mjs — the KHAWTAK icon variants for the owner's choice (round 1) and their comparison page.
// The brief is the owner's word (HOUSE_RULES.md §7, 2026-11-16 20:37): «иконка будет примерно похожа на KATAK, но будет
// трёхвинковой классический ветряк» · «со следами ветра за его крутящимися лопостями». The frame, the colours and the glow
// are KATAK's (D:\work\ai_sandbox\KRINIK_Archimedes_Turbine_Automated_Kalculator\design\icon\katak-icon.svg): pink gradient
// #C2156E → #7E0A45 in a rounded square rx 54, the #FF1A8C edge with a glow, dark shapes #2a0516…#4a0826, #FF5FB0 outlines.
//
//   node design/icon/build-icons.mjs        # writes khawtak-icon-<a..e>.svg and khawtak-icon-variants.html next to itself
//
// The rotor turns CLOCKWISE on screen (an upwind turbine seen from the front): the blade angle grows, the leading edge is on
// the growing-angle side, and every trace of the wind lies BEHIND a blade, on the falling-angle side.
// [NOT-TESTED]
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PINK = '#FF1A8C';
const PINK_SOFT = '#FF5FB0';
const DARK_ROOT = '#2a0516';
const DARK_TIP = '#4a0826';
const DEG = Math.PI / 180;
const r1 = (n) => Math.round(n * 10) / 10;

// A point at radius u along the blade axis (angle th) and offset v across it (positive = towards the rotation).
const pt = (cx, cy, th, u, v) => [cx + u * Math.cos(th) - v * Math.sin(th), cy + u * Math.sin(th) + v * Math.cos(th)];
const xy = ([x, y]) => `${r1(x)} ${r1(y)}`;

// The front-view planform of a classic small-turbine blade: a narrow neck at the root, the widest chord near 18 % of the
// span, a near-linear taper to a narrow rounded tip; 38 % of the chord ahead of the axis, 62 % behind it.
// Round 1 had 0.09 / 0.22 / 0.07 of R — the blades vanished at 32 and 16 px; round 2 widens them by 1.4.
function chord(t, R) {
  if (t < 0.18) { const s = t / 0.18; return R * (0.125 + 0.185 * (s * s * (3 - 2 * s))); }
  return R * (0.31 - 0.21 * Math.pow((t - 0.18) / 0.82, 0.9));
}

// The angle of the trailing edge at radius r — a trace starts right there, never with a gap behind the blade.
function teAngle(th, r, R, hub) {
  const t = Math.min(1, Math.max(0, (r - hub * 0.7) / (R - hub * 0.7)));
  return th - (0.62 * chord(t, R)) / r;
}

function bladePath(cx, cy, R, hub, th) {
  const N = 28, le = [], te = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = hub * 0.7 + t * (R - hub * 0.7), c = chord(t, R);
    le.push(pt(cx, cy, th, u, 0.38 * c));
    te.push(pt(cx, cy, th, u, -0.62 * c));
  }
  const tip = pt(cx, cy, th, R + R * 0.035, -0.12 * chord(1, R));
  return `M ${xy(le[0])} ` + le.slice(1).map((p) => `L ${xy(p)}`).join(' ') +
    ` Q ${xy(tip)} ${xy(te[N])} ` + te.slice(0, N).reverse().map((p) => `L ${xy(p)}`).join(' ') + ' Z';
}

let gradId = 0;
// One blade with a root-to-tip shade and the thin pink outline KATAK uses on its spiral.
function blade(cx, cy, R, hub, th, { fillOpacity = 1, outline = true } = {}) {
  const id = `bl${gradId++}`;
  const [x1, y1] = pt(cx, cy, th, hub, 0), [x2, y2] = pt(cx, cy, th, R, 0);
  const grad = `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}">` +
    `<stop offset="0" stop-color="${DARK_ROOT}"/><stop offset="1" stop-color="${DARK_TIP}"/></linearGradient>`;
  const stroke = outline ? ` stroke="${PINK_SOFT}" stroke-width="1.4" stroke-opacity="0.85" stroke-linejoin="round"` : '';
  return { defs: grad, body: `<path d="${bladePath(cx, cy, R, hub, th)}" fill="url(#${id})" fill-opacity="${fillOpacity}"${stroke}/>` };
}

function hubDisc(cx, cy, hub) {
  return `<circle cx="${cx}" cy="${cy}" r="${r1(hub)}" fill="${DARK_ROOT}" stroke="${PINK_SOFT}" stroke-width="1.6"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(hub * 0.42)}" fill="none" stroke="${PINK}" stroke-width="2.6"/>`;
}

// A fading arc behind a blade: from angle a0 back by sweep, cut into short segments whose opacity falls to zero.
function fadingArc(cx, cy, r, a0, sweep, width, color = PINK_SOFT, segs = 14, op0 = 0.9) {
  let s = '';
  for (let i = 0; i < segs; i++) {
    const a1 = a0 - (sweep * i) / segs, a2 = a0 - (sweep * (i + 1)) / segs;
    const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
    const op = op0 * Math.pow(1 - i / segs, 1.6);
    s += `<path d="M ${xy(p1)} A ${r1(r)} ${r1(r)} 0 0 0 ${xy(p2)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="${i === 0 ? 'round' : 'butt'}" stroke-opacity="${r1(op * 100) / 100}"/>`;
  }
  return s;
}

// A fading filled sector behind a blade (between rIn and rOut): thin slices whose opacity falls to zero.
function fadingSector(cx, cy, rIn, rOut, a0, sweep, segs = 24, op0 = 0.6) {
  let s = '';
  const P = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  for (let i = 0; i < segs; i++) {
    const a1 = a0 - (sweep * i) / segs + 0.004, a2 = a0 - (sweep * (i + 1)) / segs;
    const op = op0 * Math.pow(1 - i / segs, 1.5);
    s += `<path d="M ${xy(P(rIn, a1))} L ${xy(P(rOut, a1))} A ${r1(rOut)} ${r1(rOut)} 0 0 0 ${xy(P(rOut, a2))} L ${xy(P(rIn, a2))} A ${r1(rIn)} ${r1(rIn)} 0 0 1 ${xy(P(rIn, a1))} Z" fill="${PINK_SOFT}" fill-opacity="${r1(op * 100) / 100}"/>`;
  }
  return s;
}

// A fading spiral behind a blade tip: the radius shrinks from r0 to r1 while the angle falls by sweep.
function fadingSpiral(cx, cy, r0, rEnd, a0, sweep, width, segs = 22) {
  let s = '';
  for (let i = 0; i < segs; i++) {
    const f1 = i / segs, f2 = (i + 1) / segs;
    const p = (f) => { const a = a0 - sweep * f, r = r0 + (rEnd - r0) * f; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const op = 0.95 * Math.pow(1 - f1, 1.4);
    s += `<path d="M ${xy(p(f1))} L ${xy(p(f2))}" fill="none" stroke="${PINK_SOFT}" stroke-width="${r1(width * (1 - 0.5 * f1))}" stroke-linecap="round" stroke-opacity="${r1(op * 100) / 100}"/>`;
  }
  return s;
}

function rotor(cx, cy, R, hub, th0, opts) {
  const parts = [0, 1, 2].map((k) => blade(cx, cy, R, hub, th0 + k * 120 * DEG, opts));
  return { defs: parts.map((p) => p.defs).join(''), body: parts.map((p) => p.body).join('') + hubDisc(cx, cy, hub) };
}

function tower(cx, cy, R) {
  const top = cy + R * 0.18, bot = 222;
  return `<path d="M ${r1(cx - 3.2)} ${r1(top)} L ${r1(cx + 3.2)} ${r1(top)} L ${r1(cx + 7.5)} ${bot} L ${r1(cx - 7.5)} ${bot} Z" fill="${DARK_ROOT}" stroke="${PINK_SOFT}" stroke-width="1.2" stroke-opacity="0.7"/>`;
}

function frame(defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <!-- KHAWTAK icon variant — generated by design/icon/build-icons.mjs; edit the generator, not this file. -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C2156E"/><stop offset="1" stop-color="#7E0A45"/></linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="clip"><rect x="20" y="20" width="216" height="216" rx="54"/></clipPath>
    ${defs}
  </defs>
  <rect x="20" y="20" width="216" height="216" rx="54" fill="url(#bg)"/>
  <g clip-path="url(#clip)">${body}</g>
  <rect x="20" y="20" width="216" height="216" rx="54" fill="none" stroke="${PINK}" stroke-width="5" filter="url(#glow)"/>
</svg>
`;
}

const TH0 = -90 * DEG; // the first blade points straight up

const VARIANTS = [
  {
    key: 'a', name: 'А. Дуги скорости',
    note: 'Вид спереди; за каждой лопастью три тающие дуги — у конца длиннее (конец лопасти идёт быстрее).',
    build() {
      const cx = 128, cy = 128, R = 88, hub = 14;
      let trails = '';
      for (let k = 0; k < 3; k++) {
        const th = TH0 + k * 120 * DEG;
        for (const [f, w] of [[0.6, 3.6], [0.8, 4.2], [0.98, 4.8]]) trails += fadingArc(cx, cy, R * f, teAngle(th, R * f, R, hub), 75 * DEG * f, w);
      }
      const r = rotor(cx, cy, R, hub, TH0);
      return frame(r.defs, trails + r.body);
    },
  },
  {
    key: 'b', name: 'Б. Шлейф',
    note: 'Вид спереди; за каждой лопастью тающие розовые «тени» её прежних положений — как на снимке с выдержкой.',
    build() {
      const cx = 128, cy = 128, R = 88, hub = 14;
      let ghosts = '';
      for (let g = 6; g >= 1; g--) {
        for (let k = 0; k < 3; k++) {
          const th = TH0 + k * 120 * DEG - g * 9 * DEG;
          ghosts += `<path d="${bladePath(cx, cy, R, hub, th)}" fill="${PINK_SOFT}" fill-opacity="${r1(0.5 * Math.pow(1 - g / 7, 1.3) * 100) / 100}"/>`;
        }
      }
      const r = rotor(cx, cy, R, hub, TH0);
      return frame(r.defs, ghosts + r.body);
    },
  },
  {
    key: 'c', name: 'В. Спиральный след',
    note: 'Вид спереди; от концов лопастей назад уходит тающая спираль — след вихря и поклон спирали KATAK.',
    build() {
      const cx = 128, cy = 128, R = 84, hub = 14;
      let trails = '';
      for (let k = 0; k < 3; k++) {
        const th = TH0 + k * 120 * DEG;
        trails += fadingSpiral(cx, cy, R * 1.0, R * 0.5, teAngle(th, R, R, hub), 160 * DEG, 5.2);
      }
      const r = rotor(cx, cy, R, hub, TH0);
      return frame(r.defs, trails + r.body);
    },
  },
  {
    key: 'd', name: 'Г. Ветряк на мачте, дуги',
    note: 'Классический силуэт: мачта и ротор; за лопастями дуги скорости, как в варианте А.',
    build() {
      const cx = 128, cy = 106, R = 72, hub = 11;
      let trails = '';
      for (let k = 0; k < 3; k++) {
        const th = TH0 + 15 * DEG + k * 120 * DEG;
        for (const [f, w] of [[0.66, 3.4], [0.98, 4.2]]) trails += fadingArc(cx, cy, R * f, teAngle(th, R * f, R, hub), 75 * DEG * f, w);
      }
      const r = rotor(cx, cy, R, hub, TH0 + 15 * DEG);
      return frame(r.defs, tower(cx, cy, R) + trails + r.body);
    },
  },
  {
    key: 'e', name: 'Д. Ветряк на мачте, струи ветра',
    note: 'Мачта и ротор; слева набегают струи ветра, за ротором они закручиваются тающими дугами.',
    build() {
      const cx = 128, cy = 106, R = 72, hub = 11;
      let wind = '';
      for (const [y, len] of [[70, 62], [100, 74], [136, 58]]) {
        wind += `<path d="M 26 ${y} C ${26 + len * 0.4} ${y - 6} ${26 + len * 0.7} ${y + 6} ${26 + len} ${y}" fill="none" stroke="${PINK_SOFT}" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.75"/>`;
      }
      for (let k = 0; k < 3; k++) {
        const th = TH0 + 15 * DEG + k * 120 * DEG;
        wind += fadingArc(cx, cy, R * 0.98, teAngle(th, R * 0.98, R, hub), 70 * DEG, 4.2);
      }
      const r = rotor(cx, cy, R, hub, TH0 + 15 * DEG);
      return frame(r.defs, tower(cx, cy, R) + wind + r.body);
    },
  },
  {
    key: 'f', name: 'Е. Веер',
    note: 'Вид спереди; за каждой лопастью тающий залитый сектор — так глаз видит быстро крутящийся ротор.',
    build() {
      const cx = 128, cy = 128, R = 88, hub = 14;
      let fans = '';
      for (let k = 0; k < 3; k++) {
        const th = TH0 + k * 120 * DEG;
        fans += fadingSector(cx, cy, hub * 1.6, R * 1.0, teAngle(th, R * 0.6, R, hub), 80 * DEG);
      }
      const r = rotor(cx, cy, R, hub, TH0);
      return frame(r.defs, fans + r.body);
    },
  },
];

const cards = [];
for (const v of VARIANTS) {
  const file = `khawtak-icon-${v.key}.svg`;
  writeFileSync(join(HERE, file), v.build());
  cards.push(`<figure><div class="big"><img src="${file}" width="256" height="256" alt=""></div>
    <div class="small"><img src="${file}" width="64" height="64" alt=""><img src="${file}" width="32" height="32" alt=""><img src="${file}" width="16" height="16" alt=""></div>
    <figcaption><b>${v.name}</b><br>${v.note}</figcaption></figure>`);
}

writeFileSync(join(HERE, 'khawtak-icon-variants.html'), `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>KHAWTAK — иконка, круг 1 (вторая правка: лопасти шире, следы ярче)</title>
<style>
  body { margin: 0; padding: 28px 32px; background: #0D0D0D; color: #f3d6e6; font: 15px/1.45 system-ui, sans-serif; }
  h1 { color: #FF5FB0; font-size: 22px; margin: 0 0 6px; }
  p.lead { margin: 0 0 22px; color: #c99bb5; max-width: 1100px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 26px; }
  figure { margin: 0; background: #17090f; border: 1px solid #3a1426; border-radius: 16px; padding: 16px; }
  .big { display: flex; justify-content: center; }
  .small { display: flex; gap: 18px; align-items: center; justify-content: center; margin: 10px 0 8px; }
  figcaption { font-size: 14px; color: #e6c3d6; }
  figcaption b { color: #FF5FB0; }
</style></head><body>
<h1>KHAWTAK — иконка, круг 1 (вторая правка: лопасти шире, следы ярче)</h1>
<p class="lead">Классический трёхлопастный ветряк со следами ветра за лопастями, в рамке и цветах иконки KATAK. Каждый вариант — в размерах 256, 64, 32 и 16 пикселей.</p>
<div class="grid">
${cards.join('\n')}
</div>
</body></html>
`);
console.log(`wrote ${VARIANTS.length} variants and khawtak-icon-variants.html in ${HERE}`);
