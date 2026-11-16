#!/usr/bin/env node
// test.mjs — host test of the KHAWTAK core (the block between CORE-BEGIN and CORE-END in kalculator/index.html), the KATAK /
// KEINKT pattern: the page's core is cut out and run in Node through vm. Hygiene of the core, not a functional run of the
// page — that will be tools/ui-run.mjs in Chrome (TESTING_FRAMEWORK.md → "What the word "test" means").
//
//   node kalculator/test.mjs              # exit 0 — every case as expected, 1 — not
//   node kalculator/test.mjs --control    # gate 5: break one constant per case on purpose and expect RED (plan 02 S9)
//
// Criteria: plans/02_epic01_phase1_core.md. Covered now: criterion 1 (air density) and the identities S2 rests on (Γ, log
// and power shear, Weibull/Rayleigh scale, the energy integral). Not covered yet: criteria 2–8 (steps S3–S9).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
let core = html.split('// ===== CORE-BEGIN')[1].split('// ===== CORE-END')[0];
core = core.slice(core.indexOf('\n'));

// Gate 5 (TESTING_FRAMEWORK.md): each mutation breaks one constant the cases rest on; every case below must turn RED.
const CONTROL = process.argv.includes('--control');
const MUTANTS = [
  ['R_AIR = 287.05', 'R_AIR = 297.05'],                 // breaks criterion 1
  ['ISA_EXP = 5.25588', 'ISA_EXP = 5.0'],               // breaks criterion 1
  ['676.5203681218851', '676.6203681218851'],           // breaks Γ and everything Weibull
  ['Math.log(z / z0) / Math.log(zRef / z0)', 'Math.log(z / z0) / Math.log(zRef)'], // breaks the log law
  ['hBlend = 60', 'hBlend = 20'],                       // breaks criterion 7 (the blending height)
  ['k: 1.8', 'k: 2.0'],                                 // breaks criterion 7 (the site's Weibull shape)
  ['0.2969, -0.1260', '0.2969, -0.1360'],               // breaks the NACA thickness and criterion 4
  ['m / (p * p) * (2 * p * x - x * x)', 'm / p * (2 * p * x - x * x)'], // breaks the NACA mean line
];

function load(src) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + '\nglobalThis.KHAWTAK = KHAWTAK;', ctx);
  return ctx.KHAWTAK;
}

function run(K, log = true) {
  let bad = 0, total = 0;
  const check = (name, ok, got = '') => { total++; if (!ok) bad++; if (log) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? ' — ' + got : ''}`); };
  const near = (a, b, eps) => Math.abs(a - b) <= eps;

  if (log) console.log('S2. air and wind (researches/01 §5.1)');
  const rho = K.airDensity(220, 7);
  check('criterion 1: ρ(220 m, 7 °C) = 1.2275 kg/m³ ± 0.0005 (researches/01 Appendix A)', near(rho, 1.2275, 5e-4), rho.toFixed(4));
  const rho0 = K.airDensity(0, 15);
  check('ISA sea level, 15 °C: ρ = 1.2250 kg/m³ ± 0.0005', near(rho0, 1.225, 5e-4), rho0.toFixed(4));

  check('Γ(1) = 1', near(K.gamma(1), 1, 1e-12), K.gamma(1));
  check('Γ(5) = 24', near(K.gamma(5), 24, 1e-9), K.gamma(5));
  check('Γ(1/2) = √π', near(K.gamma(0.5), Math.sqrt(Math.PI), 1e-12), K.gamma(0.5));
  check('Γ(3/2) = √π/2 (Rayleigh)', near(K.gamma(1.5), Math.sqrt(Math.PI) / 2, 1e-12), K.gamma(1.5));

  const v4 = K.shearLog(3.7, 10, 4, 1.0);
  check('log law: 3.7 m/s at 10 m → 4 m, z0 1.0 = 3.7·ln4/ln10 = 2.228 (researches/01 §5.3 lower bound 2.2)', near(v4, 3.7 * Math.log(4) / Math.log(10), 1e-12) && near(v4, 2.228, 1e-3), v4.toFixed(3));
  const v7 = K.shearLog(3.7, 10, 7, 0.3);
  check('log law: 3.7 at 10 m → 7 m, z0 0.3 = 3.32 (researches/01 §5.3 upper bound 3.3)', near(v7, 3.32, 5e-3), v7.toFixed(3));
  check('log law: z = z_ref returns V_ref', near(K.shearLog(3.7, 10, 10, 0.3), 3.7, 1e-12));
  check('power law: (z/z_ref)^α, 3.7·(7/10)^0.2', near(K.shearPower(3.7, 10, 7, 0.2), 3.7 * Math.pow(0.7, 0.2), 1e-12));

  const c = K.weibullScale(5, 2);
  check('Rayleigh scale: c = V̄/Γ(1.5) = 5/0.886227 = 5.642', near(c, 5.6419, 1e-3), c.toFixed(4));
  let area = 0, mean = 0;
  for (let v = 0.005; v < 40; v += 0.01) { const f = K.weibullPdf(v, 2, c); area += f * 0.01; mean += v * f * 0.01; }
  check('Weibull pdf integrates to 1 (k 2, V̄ 5)', near(area, 1, 1e-4), area.toFixed(5));
  check('Weibull pdf has the mean V̄ = 5', near(mean, 5, 1e-3), mean.toFixed(4));
  const e = K.yearlyEnergy_kWh(() => 1000, 5, 2, { vMax: 40 });
  check('energy integral: a flat 1 kW curve gives 8760 kWh (pdf area 1)', near(e, 8760, 1), e.toFixed(1));

  // Criterion 7 — the owner's site (researches/03 §4.2 and Appendix A checkpoints; re-computed by the main agent 2026-11-16).
  // The recon's power model: P = ½ρA·min(v, 10.5)³·0.25 for v ≥ 3 (Cp_e 0.25, cut-in 3, rated 10.5 — researches/01 §7).
  const curve = (rho, D) => (v) => v < 3 ? 0 : 0.5 * rho * Math.PI * D * D / 4 * Math.pow(Math.min(v, 10.5), 3) * 0.25;
  const S = K.SITE_DEFAULT;
  const rhoS = K.airDensity(S.altitude_m, S.t_C);
  check('site air: ρ(160 m, 7.4 °C) = 1.2345 (researches/03 Appendix A)', near(rhoS, 1.2345, 5e-4), rhoS.toFixed(4));
  const minsk = K.yearlyEnergy_kWh(curve(1.2275, 1.4), K.shearLog(3.7, 10, 7, 0.25), 2);
  check('recon 03 checkpoint, Minsk input: D 1.4, 7 m, z0 0.25, k 2 → 138 kWh ± 1', near(minsk, 138, 1), minsk.toFixed(1));
  for (const [z, vWant, eWant] of [[7, 2.39, 50], [10, 2.64, 72], [12, 2.77, 85]]) {
    const v = K.shearTwoLayer(S.vRef, S.zRef, z, S.z0);
    const ey = K.yearlyEnergy_kWh(curve(rhoS, 1.4), v, S.k);
    check(`criterion 7: Brest region, mast ${z} m — hub ${vWant} m/s ± 0.01, D 1.4 → ${eWant} kWh ± 1 % (two profiles, z0 0.25, k 1.8)`,
      near(v, vWant, 0.01) && Math.abs(ey - eWant) <= 0.01 * eWant + 0.5, `${v.toFixed(3)} m/s, ${ey.toFixed(1)} kWh`);
  }
  check('two profiles: above 10 m a rough site is NOT windier than a smooth one (z0 1.0 < z0 0.1 at 15 m)',
    K.shearTwoLayer(3, 10, 15, 1.0) < K.shearTwoLayer(3, 10, 15, 0.1),
    `${K.shearTwoLayer(3, 10, 15, 1.0).toFixed(2)} < ${K.shearTwoLayer(3, 10, 15, 0.1).toFixed(2)}`);

  if (log) console.log('S3. airfoil (researches/04 §2.1, researches/01 §2.3)');
  // Landmarks of the NACA 4-digit formula: thickness t at x 0.30 (the maximum), 96.7 % of it at 0.40 (researches/02 §4.5 «97 %»),
  // a 0.25 mm open edge at t 12 %, c 100 mm (researches/04 §2.1); the 44xx mean line peaks at m = 0.04 at p = 0.4.
  const th = (x) => 2 * K.nacaHalfThickness(x, 0.12) / 0.12;
  check('NACA thickness at x 0.30 = t (the maximum) ± 0.1 %', near(th(0.3), 1, 1e-3), th(0.3).toFixed(4));
  check('NACA thickness at x 0.40 = 0.967 t (researches/02 §4.5: «97 %»)', near(th(0.4), 0.967, 1e-3), th(0.4).toFixed(4));
  check('NACA open edge: t 12 %, c 100 mm → 0.25 mm (researches/04 §2.1)', near(2 * K.nacaHalfThickness(1, 0.12) * 100, 0.252, 1e-3),
    (2 * K.nacaHalfThickness(1, 0.12) * 100).toFixed(3));
  const cmb = K.nacaCamber(0.4, 0.04, 0.4);
  check('NACA 44xx mean line: y_c(0.4) = 0.04 with zero slope', near(cmb.yc, 0.04, 1e-12) && near(cmb.dyc, 0, 1e-12), `${cmb.yc}, ${cmb.dyc}`);
  check('NACA mean line ends at zero (x 0 and x 1)', near(K.nacaCamber(0, 0.04, 0.4).yc, 0, 1e-12) && near(K.nacaCamber(1, 0.04, 0.4).yc, 0, 1e-12));
  // the forward branch (x < p) inside the chord — added after `--control` showed a mean-line mutant surviving (gate 5)
  check('NACA 44xx mean line, forward branch: y_c(0.2) = 0.04/0.16 · (0.16 − 0.04) = 0.03', near(K.nacaCamber(0.2, 0.04, 0.4).yc, 0.03, 1e-12),
    K.nacaCamber(0.2, 0.04, 0.4).yc);
  check('NACA mean line continuous at x = p (both branches meet)', near(K.nacaCamber(0.4 - 1e-9, 0.04, 0.4).yc, K.nacaCamber(0.4, 0.04, 0.4).yc, 1e-8));
  const c4 = K.minChordForStud_mm(8, 2, 0.12, 0.3);
  check('criterion 4: M8 + 2 × 2 mm walls at t/c 12 %, at max thickness → 100 mm ± 1 (researches/01 §2.3)', near(c4, 100, 1), c4.toFixed(2));
  const c4b = K.minChordForStud_mm(8, 2, 0.12, 0.4);
  check('the same at the stud axis 0.40c → 103.4 mm (100 / 0.967)', near(c4b, 103.4, 0.2), c4b.toFixed(2));
  const xTE = K.printableTrailingEdgeX(0.12, 100, 0.857);
  const teMm = 2 * K.nacaHalfThickness(xTE, 0.12) * 100;
  check('printable edge: t 12 %, c 100, two lines 0.857 mm → cut where the edge is 0.857 mm ± 0.001', near(teMm, 0.857, 1e-3) && xTE > 0.95 && xTE < 1,
    `x ${xTE.toFixed(4)}, ${teMm.toFixed(4)} mm`);
  check('printable edge: a thick enough edge is not cut (minTE 0.2 mm → x 1)', K.printableTrailingEdgeX(0.12, 100, 0.2) === 1);

  return { bad, total };
}

if (!CONTROL) {
  const { bad, total } = run(load(core));
  console.log(`-- ${total - bad} of ${total} as expected`);
  process.exit(bad ? 1 : 0);
} else {
  let missed = 0;
  for (const [from, to] of MUTANTS) {
    if (!core.includes(from)) { console.log(`MUTANT NOT APPLIED — "${from}" is not in the core`); missed++; continue; }
    const { bad } = run(load(core.replace(from, to)), false);
    console.log(`${bad > 0 ? 'red ' : 'GREEN?!'} mutant "${from}" → "${to}": ${bad} case(s) failed`);
    if (bad === 0) missed++;
  }
  console.log(`-- control: ${MUTANTS.length - missed} of ${MUTANTS.length} mutants seen red`);
  process.exit(missed ? 1 : 0);
}
