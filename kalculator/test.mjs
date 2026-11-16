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
  ['CpE: 0.25, vCutIn: 3', 'CpE: 0.30, vCutIn: 3'],     // breaks the power curve (S6)
  ['Math.min(v, vRated)', 'Math.min(v, 2 * vRated)'],   // breaks the flat top above rated (S6)
  ['M5: { d: 5, As: 14.2, p48: 4.40', 'M5: { d: 5, As: 14.2, p48: 3.40'], // breaks the stud table (criterion 6)
  ['return M_Nm * 1000 / k_mm + Fc_N', 'return M_Nm * 1000 / k_mm'],     // breaks the preload (criterion 5)
  ['tc: tcRoot + (tcTip - tcRoot) * f', 'tc: tcRoot + (tcTip - tcRoot) * f * f'], // breaks the linear t/c along the span
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
  // Ct (bugs/01_DONE_ct_checkpoint_mismatch.md): recon 01's first checkpoint 0.84 was the plain momentum formula 4aF(1−a)
  // applied also in Buhl's region a > 0.4 where it does not hold. recon 01 §1.5's own method gives 0.878 by BOTH routes —
  // blade-element loads, and momentum with Buhl's C_T in the high-induction stations — so the target is 0.878, and the
  // agreement of the two routes is guarded here; the invalid plain route is printed for the record.
  let TmBuhl = 0, TmPlain = 0;
  for (let i = 0; i < 200; i++) {
    const r = 0.1 + (i + 0.5) * 0.9 / 200;
    const s = K.bemStation({ r, R: 1, Rhub: 0.1, B: 3, chord: schmitz.chord(r), twist: schmitz.twist(r), lambdaR: 6 * r, polar: flat });
    const F = K.prandtlF(r, 1, 0.1, 3, s.phi);
    const ctPlain = 4 * s.a * (1 - s.a) * F;
    const ctLocal = s.a > 0.4 ? 8 / 9 + (4 * F - 40 / 9) * s.a + (50 / 9 - 4 * F) * s.a * s.a : ctPlain;
    TmBuhl += ctLocal * 2 * Math.PI * r * 0.9 / 200;
    TmPlain += ctPlain * 2 * Math.PI * r * 0.9 / 200;
  }
  const ctBuhl = TmBuhl / Math.PI, ctPlain = TmPlain / Math.PI;
  check('criterion 3: Ct 0.878 ± 0.01 by blade-element loads (recon 01 §1.5; corrected checkpoint, bugs/01)', near(bem.Ct, 0.878, 0.01), bem.Ct.toFixed(4));
  check('Ct: momentum with Buhl in the a > 0.4 stations agrees with the blade-element Ct ± 0.002',
    near(ctBuhl, bem.Ct, 0.002), `momentum+Buhl ${ctBuhl.toFixed(4)} · blade-element ${bem.Ct.toFixed(4)} · plain 4aF(1−a) ${ctPlain.toFixed(4)} (invalid for a > 0.4)`);
  check('BEM stays under the Betz limit 16/27 = 0.593', bem.Cp < 16 / 27, bem.Cp.toFixed(4));
  const Fmid = K.prandtlF(0.5, 1, 0.1, 3, 0.2), Ftip = K.prandtlF(0.999, 1, 0.1, 3, 0.2);
  check('Prandtl F: ≈ 1 mid-span, → 0 at the tip', Fmid > 0.99 && Ftip < 0.1, `${Fmid.toFixed(4)}, ${Ftip.toFixed(4)}`);

  if (log) console.log('S6. performance (researches/01 §7, researches/03 Appendix A)');
  // The core's power curve must equal the model the recons used (the test-local curve of criterion 7) — then the site
  // energy through the CORE's curve reproduces criterion 7 (72 kWh at 10 m).
  const pc = K.powerCurve({ D_m: 1.4, rho: rhoS });
  const same = [2, 3, 5, 10.5, 15].every((v) => near(pc(v), curve(rhoS, 1.4)(v), 1e-9));
  check('power curve = the recons\' model ½ρA·0.25·min(v, 10.5)³ from cut-in 3 m/s (5 sample speeds)', same);
  check('power curve: 0 below cut-in, flat above rated', pc(2.99) === 0 && near(pc(12), pc(10.5), 1e-9) && pc(10) < pc(10.5));
  const e10 = K.yearlyEnergy_kWh(pc, K.shearTwoLayer(S.vRef, S.zRef, 10, S.z0), S.k);
  check('criterion 7 through the core\'s curve: Brest region, 10 m, D 1.4 → 72 kWh ± 1 %', Math.abs(e10 - 72) <= 0.72 + 0.5, e10.toFixed(1));
  const ts = K.tipSpeed(6, 10);
  check('tip speed λ·V: λ 6 at 10 m/s → 60 m/s, under the 65 m/s warning; λ 7 at 10 → 70, warned',
    near(ts.vTip, 60, 1e-12) && !ts.warn && K.tipSpeed(7, 10).warn);

  if (log) console.log('S3 (span). blade stations (researches/01 §2.2, §1.3)');
  const st = K.bladeStations({ R: 0.7, Rhub: 0.07, Cl: 1.2, lambda: 6, alphaD_rad: 6 * Math.PI / 180, n: 20 });
  const lin = K.linearBlade({ R: 0.7, Cl: 1.2, lambda: 6, alphaD_rad: 6 * Math.PI / 180 });
  check('stations: n + 1 from the hub to the tip', st.length === 21 && near(st[0].r, 0.07, 1e-12) && near(st[20].r, 0.7, 1e-12));
  check('stations: t/c 21 % at the root, 12 % at the tip, 16.5 % mid-span (linear)', near(st[0].tc, 0.21, 1e-12) && near(st[20].tc, 0.12, 1e-12) && near(st[10].tc, 0.165, 1e-12));
  check('stations: chord and twist are the straight-line blade\'s', st.every((s) => near(s.chord, lin.chord(s.r), 1e-12) && near(s.twist, lin.twist(s.r), 1e-12)));
  check('stations: the chord narrows and the twist falls toward the tip', st[20].chord < st[0].chord && st[20].twist < st[0].twist);

  if (log) console.log('S8. structure, first part (researches/02 §2.3, §4.2, §5.1)');
  const F0 = K.jointPreload_N(30, 8.04, 1220);
  check('criterion 5: section A2, M 30 N·m, k 8.04 mm, F_c 1.22 kN → F0 4.95 kN ± 0.05 (researches/02 §2.4)', near(F0 / 1000, 4.95, 0.05), (F0 / 1000).toFixed(3));
  const Tw = K.wrenchTorque_Nm(F0, 8);
  check('criterion 5: wrench torque M8, K 0.2 → 7.9 N·m ± 0.1', near(Tw, 7.9, 0.1), Tw.toFixed(2));
  const pick = ['4.8', '8.8', 'A2-70'].map((g) => K.smallestStud(2.6, g));
  check('criterion 6: 2.6 kN at margin ≥ 1.5 → 4.8 M5 · 8.8 M4 · A2-70 M4', pick.join(' ') === 'M5 M4 M4', pick.join(' '));
  check('stud capacity: As·proof — M8 8.8 = 21.2 kN, A2-70 M4 = 3.95 kN', near(K.studCapacity_kN('M8', '8.8'), 21.2, 1e-9) && near(K.studCapacity_kN('M4', 'A2-70'), 3.951, 1e-3));
  check('no stud is enough above M14 capacity → null (the page must say so)', K.smallestStud(60, '4.8') === null);

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
