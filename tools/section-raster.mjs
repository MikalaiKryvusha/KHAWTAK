// section-raster.mjs — the SECOND ROUTE for section properties (EXPERIENCE.md EXP-0006): raster the material region of
// section A and integrate A, centroid, Ix, Iy directly, beside the core's thin-walled sum (bladeSection) and recon 02 §2.4.
// Kept in the repository so a later mismatch can be traced (the recons' own scripts were deleted). ~10 s at h 0.1, ~50 s at 0.05.
//
//   node tools/section-raster.mjs [h_mm]      # default 0.1; plan 02 criterion 9 quotes the 0.05 mm run
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

const html = readFileSync(new URL('../kalculator/index.html', import.meta.url), 'utf8');
let core = html.split('// ===== CORE-BEGIN')[1].split('// ===== CORE-END')[0];
core = core.slice(core.indexOf('\n'));
const ctx = {}; vm.createContext(ctx); vm.runInContext(core + '\nglobalThis.KHAWTAK = KHAWTAK;', ctx);
const K = ctx.KHAWTAK;

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let u = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0; u = Math.max(0, Math.min(1, u));
  return Math.hypot(px - ax - u * dx, py - ay - u * dy);
}

// xWeb — the web's chord station (the recon's section A: 0.60c; the printed section since plan 03 G2: the stud axis);
// withTube — the stud's bore and ring are there (false beyond the stud's end: no hole, the web runs through);
// minTE_mm — the printable trailing edge of the mesh (airfoilSection's flat cut). Exported for kalculator/test.mjs.
export function raster({ chord_mm, t, xStud = 0.40, stud_d_mm, flange_mm, n = 120, h = 0.05, xWeb = 0.60, withTube = true, minTE_mm = 0 }) {
  const P = K.airfoilSection({ chord_mm, t, n, xStud, minTE_mm });
  const shell = K.wallT_mm(3), tube = K.wallT_mm(2), web = K.wallT_mm(2);
  const ri = stud_d_mm / 2 + 0.2, ro = ri + tube;
  const X0 = (0.15 - xStud) * chord_mm, X1 = (0.50 - xStud) * chord_mm, Xw = (xWeb - xStud) * chord_mm;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of P) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  let A = 0, Sx = 0, Sy = 0, Sxx = 0, Syy = 0;
  const cell = h * h;
  for (let X = minX + h / 2; X < maxX; X += h) {
    for (let Y = minY + h / 2; Y < maxY; Y += h) {
      if (!K.pointInPolygon([X, Y], P)) continue;
      const r = Math.hypot(X, Y);
      if (withTube && r < ri) continue;                       // the stud hole
      let mat = (withTube && r <= ro) || Math.abs(X - Xw) <= web / 2;   // tube ring, web strip
      if (!mat) {
        let d = Infinity;
        for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; d = Math.min(d, segDist(X, Y, a[0], a[1], b[0], b[1])); if (d <= shell) break; }
        mat = d <= shell || (flange_mm > 0 && X >= X0 && X <= X1 && d <= shell + flange_mm);
        // the web stands between the INNER faces only — it is inside P anyway; the strip test above covers it
      }
      if (mat) { A += cell; Sx += cell * X; Sy += cell * Y; Sxx += cell * X * X; Syy += cell * Y * Y; }
    }
  }
  const xc = Sx / A, yc = Sy / A;
  const Ix = Syy - A * yc * yc, Iy = Sxx - A * xc * xc;
  let yMax = 0, xMax = 0;
  for (const [x, y] of P) { yMax = Math.max(yMax, Math.abs(y - yc)); xMax = Math.max(xMax, Math.abs(x - xc)); }
  return { A, xc, yc, Ix, Iy, k: Ix / (A * yMax), ky: Iy / (A * xMax), yMax, xMax };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {   // the CLI — not when imported
const f = (o) => `A ${o.A.toFixed(1)} · xc ${o.xc.toFixed(2)} · yc ${o.yc.toFixed(2)} · Ix ${o.Ix.toFixed(0)} · Iy ${o.Iy.toFixed(0)} · yMax ${o.yMax.toFixed(2)} · k ${o.k.toFixed(3)} · ky ${o.ky.toFixed(2)}`;
const base = { chord_mm: 180, t: 0.18, stud_d_mm: 8, xWeb: 0.60 };   // the recon's section A: the web at 0.60c
for (const [name, flange_mm, xStud, recon] of [
  ['A1 (0.40c)', 0, 0.40, 'recon: A 518 · Ix 63 560 · k 6.75'],
  ['A2 (0.40c)', 3, 0.40, 'recon: A 894 · Ix 126 000 · k 8.04 · chordwise offset 3.5 mm'],
  ['A2 (0.30c)', 3, 0.30, 'recon: chordwise offset 21 mm · ky 17.8'],
]) {
  console.log(`== ${name} — ${recon}`);
  for (const nn of [60, 120]) console.log(`  core thin-walled n ${nn}: ${f(K.bladeSection({ ...base, flange_mm, xStud, n: nn }))}`);
  const h = Number(process.argv[2] || 0.1);
  console.log(`  raster h ${h}:          ${f(raster({ ...base, flange_mm, xStud, h }))}`);
}
}
