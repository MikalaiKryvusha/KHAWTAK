// slicer-check.mjs — plan 03 criterion 4: every section of the default blade, written by the core as a binary STL, is read by
// this machine's PrusaSlicer (`prusa-slicer-console.exe --info`, HOUSE_RULES.md §3): manifold, one part, the slicer's volume
// equal to the core's divergence-theorem volume, the height within the bed's 240 mm. The STL files land in
// .work/tmp/slicer-check/ (git-ignored, HOUSE_RULES R1) and stay there for a look (Blender, the slicer's preview).
//
//   node tools/slicer-check.mjs              # the default blade: rotor 1.36 m (the «default seam» cases of kalculator/test.mjs)
//   PRUSA_SLICER=<path to prusa-slicer-console.exe> node tools/slicer-check.mjs
//
// Exit 0 — every section passes; 1 — a section fails (the line says which and why); 2 — the slicer is not found.
// [NOT-TESTED] — a hygiene instrument: it checks the files, not a print.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const html = readFileSync(new URL('../kalculator/index.html', import.meta.url), 'utf8');
let core = html.split('// ===== CORE-BEGIN')[1].split('// ===== CORE-END')[0];
core = core.slice(core.indexOf('\n'));
const ctx = {}; vm.createContext(ctx); vm.runInContext(core + '\nglobalThis.KHAWTAK = KHAWTAK;', ctx);
const K = ctx.KHAWTAK;

const SLICER = process.env.PRUSA_SLICER || 'C:/Program Files/Prusa3D/PrusaSlicer/prusa-slicer-console.exe';
if (!existsSync(SLICER)) { console.log(`PrusaSlicer not found at ${SLICER} — set PRUSA_SLICER`); process.exit(2); }
const BED_Z_MM = 240;                                           // the owner's Ender 3 height (GOAL.md: «220 220 240»)
const OUT = new URL('../.work/tmp/slicer-check/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// The default blade — the same inputs as the «default seam» cases of kalculator/test.mjs: R 0.68 m, Cl 1.2, λ 6, α 6°.
const R = 0.68, blade = K.printedBlade({ R, Cl: 1.2, lambda: 6, alphaD_rad: 6 * Math.PI / 180 });
const r0 = K.ROOT_DEFAULT.r0_m, cuts = K.sectionCuts((R - r0) * 1000, BED_Z_MM);
let bad = 0;
for (let i = 0; i + 1 < cuts.length; i++) {
  const rA = r0 + cuts[i] / 1000, rB = r0 + cuts[i + 1] / 1000, name = `section${i + 1}-r${Math.round(rA * 1000)}-${Math.round(rB * 1000)}`;
  const m = K.sectionMesh({ blade, rFrom_m: rA, rTo_m: rB }), V = K.meshVolume(m);
  const file = new URL(`${name}.stl`, OUT);
  writeFileSync(file, K.meshToSTL(m, name));
  const info = execFileSync(SLICER, ['--info', decodeURIComponent(file.pathname.replace(/^\/([A-Za-z]:)/, '$1'))], { encoding: 'utf8' });
  const get = (key) => (info.match(new RegExp(`^${key} = (.*)$`, 'm')) || [])[1]?.trim();
  const manifold = get('manifold'), parts = Number(get('number_of_parts')), vol = Number(get('volume')), z = Number(get('size_z'));
  const fit = K.bedFit([m.v.map(([x, y]) => [x, y])]);          // every vertex of the mesh — the true footprint, not two ends
  const ok = manifold === 'yes' && parts === 1 && Math.abs(vol / V - 1) < 1e-4 && z <= BED_Z_MM && fit.fits;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: manifold ${manifold}, parts ${parts}, volume ${vol.toFixed(1)} mm³ (core ${V.toFixed(1)}),`
    + ` ${get('size_x')} × ${get('size_y')} × ${z} mm; on the bed ${fit.w_mm.toFixed(0)} × ${fit.h_mm.toFixed(0)} at ${fit.angle_deg}°`);
}
console.log(`-- slicer-check: ${cuts.length - 1 - bad} of ${cuts.length - 1} sections pass · STL in .work/tmp/slicer-check/`);
process.exit(bad ? 1 : 0);
