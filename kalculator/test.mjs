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
  ['yc + yt * Math.cos(th)', 'yc - yt * Math.cos(th)'], // breaks the section: the upper surface laid off downward
  ['const ox = xStud, oy', 'const ox = 0.9, oy'],      // breaks the section: the twist axis away from the stud
  ['Math.atan(R / (r * lambda)) / 3', 'Math.atan(R / (r * lambda)) / 2'], // breaks the Schmitz chord (criterion 2)
  ['(2 / 3) * Math.atan', '(3 / 4) * Math.atan'],       // breaks the Schmitz inflow angle and twist (criterion 2)
  ['const r1 = 0.7 * R, r2 = 0.9 * R', 'const r1 = 0.6 * R, r2 = 0.9 * R'], // breaks Burton's anchor points
  ['if (k <= 2 / 3) a = k / (1 + k);', 'if (k <= 2 / 3) a = k / (1 + 2 * k);'], // breaks the BEM induction (criterion 3)
  ['(R - r) / (r * s)', '(R - r) / (R * s)'],          // breaks the Prandtl tip loss
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

  // The section polygon. Exact area of a symmetric NACA: ∫2y_t dx = 10t·(0.2969·2/3 − 0.1260/2 − 0.3516/3 + 0.2843/4 − 0.1015/5)
  // = 0.68508·t·c² (main agent's integration; researches/02 §7.2 quotes «≈ 0.68·t·c»).
  const sym = K.airfoilSection({ chord_mm: 100, t: 0.12, m: 0, n: 80 });
  const aSym = K.polygonArea(sym), aExact = 0.68508 * 0.12 * 100 * 100;
  check('section: symmetric NACA 0012, c 100 — area 0.68508·t·c² = 822.1 mm² ± 0.5 %', Math.abs(aSym - aExact) <= 0.005 * aExact, aSym.toFixed(1));
  const sec = K.airfoilSection({ chord_mm: 150, t: 0.18, n: 60 });
  check('section: counter-clockwise (positive signed area)', K.polygonArea(sec) > 0, K.polygonArea(sec).toFixed(1));
  check('section: 2n + 1 points, the nose once (n 60 → 121)', sec.length === 121, sec.length);
  check('section: the stud axis (origin) lies inside the section', K.pointInPolygon([0, 0], sec));
  const tw = K.airfoilSection({ chord_mm: 150, t: 0.18, n: 60, twist_rad: 0.5 });
  check('section: the twist turns it about the stud axis — area kept, origin still inside',
    near(K.polygonArea(tw), K.polygonArea(sec), 1e-6) && K.pointInPolygon([0, 0], tw));
  const cut = K.airfoilSection({ chord_mm: 100, t: 0.12, m: 0, n: 80, minTE_mm: 0.857 });
  const [ex, ey] = cut[0], [lx, ly] = cut[cut.length - 1];
  check('section: the cut trailing edge is 0.857 mm thick (two extrusion lines)', near(Math.hypot(ex - lx, ey - ly), 0.857, 1e-3),
    Math.hypot(ex - lx, ey - ly).toFixed(4));

  if (log) console.log('S4. blade design (researches/01 §1.3)');
  const deg = Math.PI / 180;
  const cS = K.schmitzChord(0.045, 0.45, 3, 1.26, 4) * 1000, thS = K.schmitzTwist(0.045, 0.45, 4, 6 * deg) / deg;
  check('criterion 2: Schmitz chord at R 0.45, λ 4, B 3, C_l 1.26, r 0.045 → 89.4 mm ± 0.2 (researches/01 Appendix A)', near(cS, 89.4, 0.2), cS.toFixed(2));
  check('criterion 2: twist there at α_D 6° → 39.47° ± 0.05 (source table 39.466°)', near(thS, 39.47, 0.05), thS.toFixed(3));
  // The Betz limit holds only for λμ ≫ 1: at λμ 4 the two differ by 4.2 % (the first draft of this case used λ 4 and went
  // red — a wrong premise of the case, not of the code); at λμ 10 they differ by 0.7 % (main agent's hand check).
  const betz10 = 16 * Math.PI * 0.45 / (9 * 3 * 1.26 * 100 * 1);
  check('Schmitz far from the root tends to Betz 16πR/(9 B C_l λ² μ) — at r = R, λ 10 within 1 %',
    Math.abs(K.schmitzChord(0.45, 0.45, 3, 1.26, 10) / betz10 - 1) < 0.01,
    (K.schmitzChord(0.45, 0.45, 3, 1.26, 10) / betz10).toFixed(4));
  const lb = K.linearBlade({ R: 0.7, Cl: 1.2, lambda: 6, alphaD_rad: 6 * deg });
  check('linear blade passes the Schmitz optimum at 0.7R and 0.9R (Burton)',
    near(lb.chord(0.49), K.schmitzChord(0.49, 0.7, 3, 1.2, 6), 1e-12) && near(lb.twist(0.63), K.schmitzTwist(0.63, 0.7, 6, 6 * deg), 1e-12));
  check('linear blade is a straight line (midpoint = mean of the ends)',
    near(lb.chord(0.56), (lb.chord(0.49) + lb.chord(0.63)) / 2, 1e-12) && near(lb.twist(0.56), (lb.twist(0.49) + lb.twist(0.63)) / 2, 1e-12));

  if (log) console.log('S5. BEM (researches/01 §1.4–1.5)');
  // Criterion 3: the Schmitz blade at λ 6, C_l 1 at every station, no drag, hub 0.1R (researches/01 Appendix A).
  const Rb = 1, lam = 6;
  const schmitz = { chord: (r) => K.schmitzChord(r, Rb, 3, 1, lam), twist: (r) => K.schmitzPhi(r, Rb, lam) };
  const flat = () => ({ Cl: 1, Cd: 0 });
  const bem = K.bemRotor({ R: Rb, Rhub: 0.1 * Rb, lambda: lam, blade: schmitz, polar: flat });
  check('criterion 3: BEM, Schmitz blade, λ 6, C_l 1, L/D ∞, hub 0.1R → Cp 0.518 ± 0.005 (researches/01 Appendix A)', near(bem.Cp, 0.518, 0.005), bem.Cp.toFixed(4));
  // Ct — OPEN (bugs/01_ct_checkpoint_mismatch.md): recon 01's checkpoint 0.84 is reproduced by the MOMENTUM route
  // 4aF(1−a) (0.835), while recon 01 §1.5 itself defines thrust by blade-element loads T = B∫N′dr (0.878 here). The
  // momentum route is checked against 0.84; the blade-element Ct is printed, not judged, until an independent reference.
  let Tm = 0;
  for (let i = 0; i < 200; i++) {
    const r = 0.1 + (i + 0.5) * 0.9 / 200;
    const s = K.bemStation({ r, R: 1, Rhub: 0.1, B: 3, chord: schmitz.chord(r), twist: schmitz.twist(r), lambdaR: 6 * r, polar: flat });
    Tm += 4 * Math.PI * r * s.a * (1 - s.a) * K.prandtlF(r, 1, 0.1, 3, s.phi) * 0.9 / 200;
  }
  const ctMom = Tm / (0.5 * Math.PI);
  check('criterion 3 (Ct, momentum route 4aF(1−a)) → 0.84 ± 0.01 (recon 01 Appendix A); blade-element Ct printed — OPEN, bugs/01',
    near(ctMom, 0.84, 0.01), `momentum ${ctMom.toFixed(4)} · blade-element ${bem.Ct.toFixed(4)}`);
  check('BEM stays under the Betz limit 16/27 = 0.593', bem.Cp < 16 / 27, bem.Cp.toFixed(4));
  const Fmid = K.prandtlF(0.5, 1, 0.1, 3, 0.2), Ftip = K.prandtlF(0.999, 1, 0.1, 3, 0.2);
  check('Prandtl F: ≈ 1 mid-span, → 0 at the tip', Fmid > 0.99 && Ftip < 0.1, `${Fmid.toFixed(4)}, ${Ftip.toFixed(4)}`);

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
