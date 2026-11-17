#!/usr/bin/env node
// test.mjs — host test of the KHAWTAK core (the block between CORE-BEGIN and CORE-END in kalculator/index.html), the KATAK /
// KEINKT pattern: the page's core is cut out and run in Node through vm. Hygiene of the core, not a functional run of the
// page — that will be tools/ui-run.mjs in Chrome (TESTING_FRAMEWORK.md → "What the word "test" means").
//
//   node kalculator/test.mjs              # exit 0 — every case as expected, 1 — not
//   node kalculator/test.mjs --control    # gate 5: break one constant per case on purpose and expect RED (plan 02 S9)
//
// Criteria: plans/02_epic01_phase1_core.md. Covered now: criterion 1 (air density) and the identities S2 rests on (Γ, log
// and power shear, Weibull/Rayleigh scale, the energy integral); then S3–S6 and S8 — criteria 1–7 and 9 are covered.
// Covered since 2026-11-17: criteria 10 (BEM with drag) and 11 (SLM loads D, H, E), μ and Re. Not covered yet: criterion 8 as a whole (S9), load case A.
import { readFileSync, writeFileSync } from 'node:fs';
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
  ['z0: 0.25, hub_m: 7', 'z0: 0.25, hub_m: 10'],        // breaks the owner's default mast (interview 002 Q2 «B»)
  ['0.2969, -0.1260', '0.2969, -0.1360'],               // breaks the NACA thickness and criterion 4
  ['m / (p * p) * (2 * p * x - x * x)', 'm / p * (2 * p * x - x * x)'], // breaks the NACA mean line
  ['yc + yt * Math.cos(th)', 'yc - yt * Math.cos(th)'], // breaks the section: the upper surface laid off downward
  ['const ox = xStud, oy', 'const ox = 0.9, oy'],      // breaks the section: the twist axis away from the stud
  ['Math.atan(R / (r * lambda)) / 3', 'Math.atan(R / (r * lambda)) / 2'], // breaks the Schmitz chord (criterion 2)
  ['(2 / 3) * Math.atan', '(3 / 4) * Math.atan'],       // breaks the Schmitz inflow angle and twist (criterion 2)
  ['const r1 = 0.7 * R, r2 = 0.9 * R', 'const r1 = 0.6 * R, r2 = 0.9 * R'], // breaks Burton's anchor points
  ['if (k <= 2 / 3) a = k / (1 + k);', 'if (k <= 2 / 3) a = k / (1 + 2 * k);'], // breaks the BEM induction (criterion 3)
  ['(R - r) / (r * s)', '(R - r) / (R * s)'],          // breaks the Prandtl tip loss
  ['(r - Rhub) / (Rhub * s)', '(r - Rhub) / (R * s)'], // breaks the Prandtl hub loss
  ['ct = Cl * sp - Cd * cp', 'ct = Cl * sp - 0.5 * Cd * cp'], // halves the drag in the torque (criterion 10)
  ['S: 110.4', 'S: 120'],                               // breaks Sutherland's constant
  ['const RE_POLAR_MIN = 100e3', 'const RE_POLAR_MIN = 150e3'], // moves the polar-data threshold
  ['(lambda * rOverR) ** 2', 'lambda ** 2'],            // breaks the relative wind at the station
  ['CpE: 0.25, vCutIn: 3', 'CpE: 0.30, vCutIn: 3'],     // breaks the power curve (S6)
  ['CT_D: 0.5', 'CT_D: 0.6'],                           // breaks case D's thrust coefficient (criterion 11)
  ['MyB_Nm: Fx * 2 * R / (3 * B)', 'MyB_Nm: Fx * R / (2 * B)'], // breaks case D's lever 2R/3
  ['VE50_PER_VREF: 1.4', 'VE50_PER_VREF: 1.5'],         // breaks the 50-year gust of case H
  ['Cd / 4 * rho * v * v', 'Cd / 2 * rho * v * v'],     // breaks case H's root moment
  ['mB_kg * Rcog_m * omega * omega', 'mB_kg * Rcog_m * omega'], // breaks case E (ω, not ω²)
  ['mMinimal: { fatigue: 10, ultimate: 3.0 }', 'mMinimal: { fatigue: 10, ultimate: 2.0 }'], // breaks γm of an untested material
  ['fSlm: { fatigue: 1.0, ultimate: 3.0 }', 'fSlm: { fatigue: 1.0, ultimate: 2.0 }'],         // breaks γf of the SLM loads (the strict seam)
  ['section.k, g * Fc_D_N)', 'section.k, Fc_D_N)'],       // the strict line forgets to factor F_c (the judge, F1)
  ['kgm: 0.124 }', 'kgm: 0.248 }'],                     // breaks the M5 stud's mass (F_c of the default seam)
  ['const PETG_DENSITY_KG_M3 = 1250', 'const PETG_DENSITY_KG_M3 = 1000'], // breaks the blade mass (recon 02 §7.2)
  ['const FLANGE = { mmPerMetreR: 3', 'const FLANGE = { mmPerMetreR: 2'], // breaks the flange law (recon 02 §0)
  ['gammaLoad: 1, studMargin: 1.5', 'gammaLoad: 1.2, studMargin: 1.5'], // breaks the owner's policy: loads ×1 (interview #003)
  ['gammaLoad: 1, studMargin: 1.5', 'gammaLoad: 1, studMargin: 2.0'],   // breaks the owner's stud margin 1.5 (interview #003)
  ['cRoot_per_R: 0.18', 'cRoot_per_R: 0.12'],           // breaks the printed root chord (recon 02 §0/§10)
  ['rBlend_per_R: 0.4 }', 'rBlend_per_R: 0.3 }'],       // breaks where the root transition ends
  ['const PETG_Z_MPA = 39', 'const PETG_Z_MPA = 59'],   // breaks the PETG strength the strict line divides
  ['const dr = (R - rHub) / n;\n  let A = 0;', 'const dr = R / n;\n  let A = 0;'], // breaks the plan-area integral's span
  ['Math.min(v, vRated)', 'Math.min(v, 2 * vRated)'],   // breaks the flat top above rated (S6)
  ['M5: { d: 5, As: 14.2, p48: 4.40', 'M5: { d: 5, As: 14.2, p48: 3.40'], // breaks the stud table (criterion 6)
  ['return M_Nm * 1000 / k_mm + Fc_N', 'return M_Nm * 1000 / k_mm'],     // breaks the preload (criterion 5)
  ['tc: tcRoot + (tcTip - tcRoot) * f', 'tc: tcRoot + (tcTip - tcRoot) * f * f'], // breaks the linear t/c along the span
  ['(a * a + a * b + b * b) / 3', '(a * a + b * b) / 2'], // breaks the exact strip integral (segSq: shellSection AND bladeSection)
  ['{ ok: 3, limit: 7 }', '{ ok: 3, limit: 9 }'],       // breaks the long-term PETG upper limit (the anchor's verdicts)
  ['{ ok: 3, limit: 7 }', '{ ok: 6, limit: 7 }'],       // breaks the long-term PETG lower limit (the anchor's and the seam's verdicts)
  ['const tubeIx = tubeI + tubeA * yc * yc', 'const tubeIx = tubeI'], // drops the tube's Steiner term
  ['webIx = web * webH ** 3 / 12 + webA', 'webIx = webA'],          // drops the web's own I
  ['N * 1.125 * nozzle_mm', 'N * 1.0 * nozzle_mm'],     // breaks the wall of N lines (researches/02 §0)
  ['const sh = shell / 2;', 'const sh = 0;'],           // breaks the shell strip's half-wall shift inward
  ['xFlange: [0.15, 0.50]', 'xFlange: [0.15, 0.40]'],   // breaks the flange range (criterion 9, A2)
  ['const fh = shell + flange_mm / 2', 'const fh = flange_mm / 2'], // breaks the flange's place under the shell
  ['const ri = stud_d_mm / 2 + gap_mm', 'const ri = stud_d_mm + gap_mm'], // breaks the tube radius
  ['const webA = web * webH;', 'const webA = web * webH / 2;'],          // breaks the web
  ['- 2 * shell, webY', '- shell, webY'],              // breaks the web's height between the inner faces
  ['segSq(s.x1 - xc, s.x2 - xc)', 'segSq(s.x1, s.x2)'], // breaks Iy about the centroid (the chordwise kern)
  ['const sigmaB = M_Nm * 1000 * yMax / I', 'const sigmaB = M_Nm * yMax / I'], // breaks the bending stress units
  ['opens: sigmaP - sigmaB < 0', 'opens: sigmaP + sigmaB < 0'],              // breaks the open-seam flag
  ['Math.ceil(span_mm / maxZ_mm)', 'Math.round(span_mm / maxZ_mm)'], // breaks the section count (a section taller than the bed)
  ['const BED_DEFAULT = { w_mm: 220, d_mm: 220, margin_mm: 5 }', 'const BED_DEFAULT = { w_mm: 220, d_mm: 220, margin_mm: 0 }'], // forgets the 5 mm margin
  ['for (let deg = 0; deg < 180; deg += 0.25)', 'for (let deg = 0; deg < 1; deg += 0.25)'], // forgets that the part may be turned
  ['const pts = polys.flat()', 'const pts = polys[0]'],     // forgets the union of the outlines (the third judge, F1)
  ['withTube: r < studTo });', 'withTube: true });'],         // the tube to the tip again (the fourth judge, finding 4)
  ['const webH = ys.length < 2 ? NaN : Math.max(0, webH0);', 'const webH = ys.length < 2 ? NaN : webH0;'], // a negative web (finding 3)
];

function load(src) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + '\nglobalThis.KHAWTAK = KHAWTAK;', ctx);
  return ctx.KHAWTAK;
}

function run(K, log = true) {
  let bad = 0, total = 0;
  const failed = [];
  const check = (name, ok, got = '') => { total++; if (!ok) { bad++; failed.push(name); } if (log) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? ' — ' + got : ''}`); };
  const near = (a, b, eps) => Math.abs(a - b) <= eps;
  const rel = (a, b, r) => Math.abs(a - b) <= r * Math.abs(b);

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
      near(v, vWant, 0.01) && Math.abs(ey - eWant) <= 0.01 * eWant, `${v.toFixed(3)} m/s, ${ey.toFixed(1)} kWh`);
  }
  // The owner's default mast (interview 002, Q2 «B»: 7 m): the page opens on it, so the default hub wind is the 7 m row above.
  const vHub = K.shearTwoLayer(S.vRef, S.zRef, S.hub_m, S.z0);
  check('default site: hub at the owner\'s 7 m mast (interview 002 Q2 «B») → 2.39 m/s ± 0.01', S.hub_m === 7 && near(vHub, 2.39, 0.01),
    `hub ${S.hub_m} m, ${vHub.toFixed(3)} m/s`);
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
  // @guard ct-two-routes
  // THREAT:         a thrust target taken from a formula outside its range (bugs/01_DONE) or a broken induction branch
  // PROVED-AGAINST: the induction mutant `k / (1 + 2 * k)` turns this case and criterion 3 red (`--control`)
  // GAP:            at a converged solution the two routes are one equation — their agreement proves convergence, not
  //                 the value; no external reference (CCBlade, QBlade) was run
  // ON-REAL-PATH:   NOT YET (no page)
  check('Ct: momentum with Buhl in the a > 0.4 stations agrees with the blade-element Ct ± 0.002',
    near(ctBuhl, bem.Ct, 0.002), `momentum+Buhl ${ctBuhl.toFixed(4)} · blade-element ${bem.Ct.toFixed(4)} · plain 4aF(1−a) ${ctPlain.toFixed(4)} (invalid for a > 0.4)`);
  check('BEM stays under the Betz limit 16/27 = 0.593', bem.Cp < 16 / 27, bem.Cp.toFixed(4));
  const Fmid = K.prandtlF(0.5, 1, 0.1, 3, 0.2), Ftip = K.prandtlF(0.999, 1, 0.1, 3, 0.2);
  const Fhub = K.prandtlF(0.1001, 1, 0.1, 3, 0.2);
  check('Prandtl F: → 0 at the hub too (the hub loss is not 1 — the judge found it unchecked)', Fhub < 0.1, Fhub.toFixed(4));
  check('Prandtl F: ≈ 1 mid-span, → 0 at the tip', Fmid > 0.99 && Ftip < 0.1, `${Fmid.toFixed(4)}, ${Ftip.toFixed(4)}`);

  // Criterion 10 — BEM WITH DRAG (every case above runs at C_d = 0, so the drag terms were never exercised). The Schmitz blade
  // designed at each λ, C_l constant, C_d = C_l/(L/D), hub 0.1R → the BEM column of researches/01 §1.6. Re-derived 2026-11-17
  // (EXP-0004): the core is 0.2–1.5 % lower, the gap growing with drag; the core's drag LOSS equals the analytic loss of the
  // optimum blade (16/27)·λ/(L/D) within 1.25 % (the next case; its band ± 3 % = that worst cell rounded up, the analytic
  // estimate being a large-λ limit), the recon's lies ≈ 6 % lower; its script is deleted → ± 2 %.
  // GAP: drag inside the induction (C_d in c_n) moves Cp by ≈ 0.1 % — no case here can see it.
  const lams = [4, 5, 6, 7, 8, 10];
  const reconBem = { 100: [0.461, 0.476, 0.484, 0.488, 0.490, 0.489], 60: [0.447, 0.458, 0.462, 0.462, 0.460, 0.450], 40: [0.429, 0.435, 0.434, 0.429, 0.422, 0.402] };
  const cpAt = (lam, LD) => K.bemRotor({ R: 1, Rhub: 0.1, lambda: lam,
    blade: { chord: (r) => K.schmitzChord(r, 1, 3, 1, lam), twist: (r) => K.schmitzPhi(r, 1, lam) },
    polar: () => ({ Cl: 1, Cd: LD === Infinity ? 0 : 1 / LD }) }).Cp;
  const cpInf = lams.map((l) => cpAt(l, Infinity));
  let worstLoss = 0;
  for (const LD of [100, 60, 40]) {
    const cps = lams.map((l) => cpAt(l, LD));
    const devs = cps.map((cp, i) => cp / reconBem[LD][i] - 1);
    check(`criterion 10: BEM with drag, L/D ${LD}, λ 4–10 → researches/01 §1.6 ± 2 %`, devs.every((d) => Math.abs(d) <= 0.02),
      cps.map((cp) => cp.toFixed(3)).join(' ') + ` (worst ${(100 * Math.max(...devs.map(Math.abs))).toFixed(1)} %)`);
    cps.forEach((cp, i) => { worstLoss = Math.max(worstLoss, Math.abs((cpInf[i] - cp) / (16 / 27 * lams[i] / LD) - 1)); });
  }
  check('drag loss = the optimum blade\'s (16/27)·λ/(L/D) ± 3 % in all 18 cells (an analytic route, not the recon)', worstLoss <= 0.03,
    `worst ${(100 * worstLoss).toFixed(2)} %`);

  if (log) console.log('S5 (Re). viscosity and the Reynolds number (researches/01 §1.7, §2.1, §7)');
  const mu15 = K.airViscosity(15), mu7 = K.airViscosity(7);
  check('Sutherland at 15 °C = the 1976 Standard Atmosphere\'s sea level 1.7894e-5 Pa·s ± 0.0005e-5 (PDAS atmos76.f90)',
    near(mu15, 1.7894e-5, 5e-9), mu15.toExponential(5));
  check('Sutherland at 7 °C = 1.750e-5 Pa·s ± 0.0005e-5 (researches/01 §1.7, Appendix A)', near(mu7, 1.75e-5, 5e-9), mu7.toExponential(5));
  // recon 01 §7, the last column: Re at 0.75R, 5 m/s, λ 6, Schmitz chord at C_l 1.2 — with Appendix A's air (ρ 1.2275, μ at
  // 7 °C) every cell reproduces to the rounding of the table (± 0.5 thousand).
  const reRow = [[0.6, 27], [1.0, 44], [1.4, 62], [2.0, 89], [3.0, 133]].map(([D, want]) => {
    const R = D / 2, st = K.designReynolds({ rho: 1.2275, V: 5, lambda: 6, rOverR: 0.75, chord_m: K.schmitzChord(0.75 * R, R, 3, 1.2, 6), mu: mu7 });
    return { D, want, Re: st.Re / 1000, below: st.belowPolars };
  });
  check('Re at 0.75R, 5 m/s: D 0.6 / 1.0 / 1.4 / 2.0 / 3.0 → 27 / 44 / 62 / 89 / 133 thousand ± 0.5 (researches/01 §7)',
    reRow.every((x) => Math.abs(x.Re - x.want) <= 0.5), reRow.map((x) => x.Re.toFixed(1)).join(' / '));
  check('Re warning: every rotor up to D 2.0 runs below the measured polars (< 100 000), D 3.0 does not',
    reRow.filter((x) => x.D <= 2).every((x) => x.below) && !reRow.find((x) => x.D === 3).below, reRow.map((x) => `${x.D}:${x.below ? 'below' : 'ok'}`).join(' '));

  if (log) console.log('S6. performance (researches/01 §7, researches/03 Appendix A)');
  // The core's power curve must equal the model the recons used (the test-local curve of criterion 7) — then the site
  // energy through the CORE's curve reproduces criterion 7 (72 kWh at 10 m).
  const pc = K.powerCurve({ D_m: 1.4, rho: rhoS });
  const same = [2, 3, 5, 10.5, 15].every((v) => near(pc(v), curve(rhoS, 1.4)(v), 1e-9));
  check('power curve = the recons\' model ½ρA·0.25·min(v, 10.5)³ from cut-in 3 m/s (5 sample speeds)', same);
  check('power curve: 0 below cut-in, flat above rated', pc(2.99) === 0 && near(pc(12), pc(10.5), 1e-9) && pc(10) < pc(10.5));
  const e10 = K.yearlyEnergy_kWh(pc, K.shearTwoLayer(S.vRef, S.zRef, 10, S.z0), S.k);
  check('criterion 7 through the core\'s curve: Brest region, 10 m, D 1.4 → 72 kWh ± 1 %', Math.abs(e10 - 72) <= 0.72, e10.toFixed(1));
  const ts = K.tipSpeed(6, 10);
  check('tip speed λ·V: λ 6 at 10 m/s → 60 m/s, under the 65 m/s warning; λ 7 at 10 → 70, warned',
    near(ts.vTip, 60, 1e-12) && !ts.warn && K.tipSpeed(7, 10).warn);

  if (log) console.log('S7. loads — IEC 61400-2 SLM, the blade cases D, H, E (researches/01 §6.1, §7)');
  // recon 01 §7 (class IV, ρ 1.225, Schmitz blade λ 6, C_l 1.2, hub 0.1R), re-derived 2026-11-17 through the core's Schmitz
  // chord before it became a target (EXP-0004): every cell matches to the table's rounding. Rows: D, A_proj,B, M_yB,D at V_ave
  // 6 / 4, M_yB,H, F_x D / H. Tolerances = the table's rounding: half its last digit (± 0.05, and ± 0.5 on F_x,D — no plan
  // area in it); ± 0.6 on case H's integers (± 0.5 rounding + the plan-area integral, ≤ 0.1 % at D 4.2 — the judge, F6).
  const slmRows = [[0.6, 0.007, 1.3, 0.6, 2, 19, 34], [1.0, 0.019, 6.0, 2.7, 8, 54, 94], [1.4, 0.038, 16.5, 7.3, 21, 106, 184],
    [2.0, 0.077, 48.1, 21.4, 62, 216, 375], [2.4, 0.111, 83.1, 36.9, 108, 312, 540], [3.0, 0.173, 162.4, 72.2, 211, 487, 843],
    [4.2, 0.340, 445.5, 198.0, 578, 955, 1653]];
  const IV = K.IEC_SWT_CLASS.IV;
  const slm = slmRows.map(([D, Ap, mD6, mD4, mH, fD, fH]) => {
    const R = D / 2, Aproj = K.bladePlanArea((r) => K.schmitzChord(r, R, 3, 1.2, 6), 0.1 * R, R);
    const d6 = K.slmMaxThrust({ R, rho: 1.225, vAve: IV.vAve }), d4 = K.slmMaxThrust({ R, rho: 1.225, vAve: 4 });
    const h = K.slmParked({ R, rho: 1.225, vRef: IV.vRef, Aproj });
    return { D, ok: { A: near(Aproj, Ap, 5e-4), D: near(d6.MyB_Nm, mD6, 0.05) && near(d4.MyB_Nm, mD4, 0.05) && near(d6.Fx_N, fD, 0.5),
      H: near(h.MyB_Nm, mH, 0.6) && near(h.Fx_N, fH, 0.6) }, Aproj, d6, h };
  });
  check('plan area of a blade: the core\'s Schmitz chord from 0.1R to R → recon 01 §7, D 0.6 … 4.2 m (0.007 … 0.340 m²)',
    slm.every((s) => s.ok.A), slm.map((s) => s.Aproj.toFixed(4)).join(' / '));
  check('criterion 11: case D, maximum thrust (class IV, V_ave 6 and 4) — M_yB and F_x of recon 01 §7, all seven rotors',
    slm.every((s) => s.ok.D), slm.map((s) => `${s.d6.MyB_Nm.toFixed(1)}/${s.d6.Fx_N.toFixed(0)}`).join(' · '));
  check('criterion 11: case H, parked at V_e50 = 1.4·30 = 42 m/s — M_yB and F_x of recon 01 §7, all seven rotors',
    slm.every((s) => s.ok.H) && near(slm[0].h.vE50, 42, 1e-12), slm.map((s) => `${s.h.MyB_Nm.toFixed(1)}/${s.h.Fx_N.toFixed(0)}`).join(' · '));
  // Case E against the figure of Alber et al., TORQUE 2022 — a 1.2 kg blade, CoG 0.39R of R 1 m, 600 rpm → 1850 N (quoted in
  // researches/02 §2.4; most likely their own m·r·ω², so it guards ω² and the units, not a measured force — the judge, F7);
  // and recon 01 §6.2's D 1.4: 0.33 kg, CoG 0.28 m, λ 6 at 10 m/s → 673 N (± 1.5 %: its inputs are rounded to two digits).
  const fE1 = K.slmCentrifugal({ mB_kg: 1.2, Rcog_m: 0.39, omega: 600 * Math.PI / 30 });
  const fE2 = K.slmCentrifugal({ mB_kg: 0.33, Rcog_m: 0.28, omega: 6 * 10 / 0.7 });
  check('case E, centrifugal pull: 1.2 kg at 0.39 m, 600 rpm → 1850 N ± 0.5 % (Alber et al. 2022); 0.33 kg at 0.28 m, λ 6, 10 m/s, R 0.7 → 673 N ± 1.5 %',
    rel(fE1, 1850, 0.005) && rel(fE2, 673, 0.015), `${fE1.toFixed(0)} N, ${fE2.toFixed(0)} N`);
  const G = K.IEC_GAMMA;
  const aPetg = K.iecAllowable_MPa(39, G.fSlm.ultimate, G.mMinimal.ultimate);
  const a46 = K.iecAllowable_MPa(240, G.fSlm.ultimate, G.mFull.ultimate), a88 = K.iecAllowable_MPa(640, G.fSlm.ultimate, G.mFull.ultimate);
  check('allowable stress f_k/(γf·γm), ultimate, SLM loads: PETG Z 39 MPa untested → 4.3; steel 4.6 → 73, 8.8 → 194 MPa (recon 01 §6.1)',
    near(aPetg, 4.33, 0.01) && near(a46, 72.7, 0.1) && near(a88, 193.9, 0.1), `${aPetg.toFixed(2)} · ${a46.toFixed(1)} · ${a88.toFixed(1)}`);

  // The default blade's root seam under the two margin policies — the numbers of interview 003 (re-run by this case,
  // EXP-0006). Rotor 1.36 m (the «333» class, HOUSE_RULES §7), class IV, ρ 1.225; the seam at the root block r 110 mm with the
  // ROOT OF researches/02 §0/§10 — chord 0.18R = 122 mm (the core's linear blade gives only 63 mm there, and that seam holds
  // under no policy: plan 02, the root finding of 2026-11-17), t/c 25 % (recon 02 §10: «корневой профиль толще (21–25 %)»),
  // M5. Since interview #003 Q1 «A» (2026-11-17 10:41) the cases go through seamCheck — the owner's policy in the core — and
  // the PRINTED blade (printedBlade). Since the second judge (2026-11-17, F1–F3): the flanges by the recon's law (flangeAt_mm,
  // 2.04 mm here, not a typed 3 mm), F_c from the blade's own mass (bladeMass), and the strict line factors F_c too. Since the
  // third judge (F7): the stud tube only where the stud runs — 155.9 g outboard of the seam (PETG 124.1 g, steel 31.7 g), CoG
  // 0.287 m, at case D's ω → F_c 785 N. The homebuilder's numbers: F0 2.79 kN, M5 4.8, σ_p 5.15 MPa «caution»; the strict line:
  // 8.38 kN, σ_max 30.0 MPa (still fails). The storm moment of the printed blade is 19.74 N·m (its wider root).
  const R136 = 0.68, pb136 = K.printedBlade({ R: R136, Cl: 1.2, lambda: 6, alphaD_rad: 6 * deg });
  const Ap136 = K.bladePlanArea(pb136.chord, 0.1 * R136, R136);
  const root136 = K.bladeSection({ chord_mm: pb136.chord(0.11) * 1000, t: pb136.tc(0.11), stud_d_mm: 5, flange_mm: K.flangeAt_mm(0.11, R136) });
  const mass136 = K.bladeMass({ blade: pb136, R: R136, stud: 'M5', studLen_m: 0.332 });   // the owner's 333 mm piece, ≈ 332 after the kerf
  const Fc136 = K.slmCentrifugal({ mB_kg: mass136.m_kg, Rcog_m: mass136.cog_m, omega: 6 * K.SLM.VHUB_PER_VAVE_D * IV.vAve / R136 });
  const seamOf = (MH, MD, Fc = Fc136) => K.seamCheck({ section: root136, grade: '4.8', Fc_D_N: Fc, MyB_H_Nm: MH, MyB_D_Nm: MD });
  const seam136 = seamOf(K.slmParked({ R: R136, rho: 1.225, vRef: IV.vRef, Aproj: Ap136 }).MyB_Nm, K.slmMaxThrust({ R: R136, rho: 1.225, vAve: IV.vAve }).MyB_Nm);
  check(`default seam, the owner's policy (homebuilder's margin, interview #003 «A»): F0 2.79 kN ± 2 % → M5 4.8, wrench 2.79 N·m, σ_p 5.15 MPa «caution», closed`,
    rel(seam136.F0_N, 2792, 0.02) && seam136.stud === 'M5' && near(seam136.wrench_Nm, 2.79, 0.06) && rel(seam136.sigmaP, 5.15, 0.02)
    && seam136.verdict === 'caution' && !seam136.opens && K.smallestStud(seam136.F0_N / 1000, '8.8') === 'M4',
    `F_c ${Fc136.toFixed(0)} N, F0 ${(seam136.F0_N / 1000).toFixed(2)} kN, ${seam136.stud ?? 'no stud ≤ M14'} 4.8, wrench ${seam136.wrench_Nm?.toFixed(2) ?? '—'} N·m, σ_p ${seam136.sigmaP.toFixed(2)}, σ_max ${seam136.sigmaMax.toFixed(1)} MPa`);
  check(`default seam, the strict IEC line beside it (every load ×3, untested PETG → 4.3 MPa): F0 8.38 kN, σ_max 30.0 MPa — does not pass`,
    rel(seam136.iec.F0_N, 8375, 0.02) && rel(seam136.iec.sigmaMax, 30.0, 0.02) && near(seam136.iec.allowed, 4.33, 0.01) && !seam136.iec.passes,
    `F0 ${(seam136.iec.F0_N / 1000).toFixed(2)} kN, σ_max ${seam136.iec.sigmaMax.toFixed(1)} vs ${seam136.iec.allowed.toFixed(1)} MPa`);
  // the strict line's pass branch, exercised once (the judge, F4): a breeze and a stopped rotor — with the rotor turning, F_c ×3
  // alone already presses the seam to 4.8 MPa (the first draft of this case forgot it and went red on its own premise)
  const calm = seamOf(0.1, 0.1, 0);
  check('the strict IEC line can say «passes»: 0.1 N·m, no centrifugal pull, on the same seam → σ_max under 4.3 MPa', calm.iec.passes && calm.iec.sigmaMax < calm.iec.allowed,
    `σ_max ${calm.iec.sigmaMax.toFixed(2)} MPa`);
  // The blade's mass (bladeMass) against recon 02 on the recon's OWN planform (§0: c/R 0.18 → 0.10 at 0.7 → 0.05; t/c 18 → 12 %
  // by r/R; flanges by flangeAt_mm; the tube along the recon's own stud; the root block excluded; PETG only): §7.2's R 1.0 m
  // with 0.8 m of M8 — 455 g; §10's classes 250 / 333 / 500 — 117 / 175 / 343 g. Observed: −1.6 %, −0.8 %, −1.1 %, −3.2 %; the
  // bands (± 2 %, ± 4 %) are that observed spread rounded up — NOT an independent tolerance (the recon's script is deleted;
  // the gap trends with R, a method difference — the third judge, F6; the classes from 1000 mm are printed, not checked: outside
  // the MVP). §2.4's F_c of that blade at 600 rpm — 1.22 kN ± 3 %: recon 02 §0 puts the stud's root nut at r 35 mm, and the
  // recon's own inputs (455 g at CoG 0.424 m + 0.8 m of M8 from r 35 mm) give 1.20 kN by hand — its 1220 N stands ≈ 1.7 % above
  // them, and the recon does not say why (its script is deleted); with the core's −1.65 % mass the gap is −2.31 %, and ± 3 % is
  // that observed gap rounded up. (Corrected after the fourth judge: the earlier reason «the recon does not say where its stud
  // starts» was false — §0 says it.)
  const reconBlade = (R) => ({ chord: (r) => { const x = r / R; return R * (x <= 0.15 ? 0.18 : x <= 0.7 ? 0.18 - 0.08 * (x - 0.15) / 0.55 : 0.10 - 0.05 * (x - 0.7) / 0.3); },
    tc: (r) => 0.18 - 0.06 * r / R });
  check('flanges along the span: 3 mm·R at the root block (2.04 mm at R 0.68, 3.0 at R 1.0), half by mid-taper, none from 0.4R',
    near(K.flangeAt_mm(0.11, 0.68), 2.04, 1e-9) && near(K.flangeAt_mm(0.11, 1.0), 3, 1e-9) && near(K.flangeAt_mm(0.255, 1.0), 1.5, 1e-9)
    && K.flangeAt_mm(0.4, 1.0) === 0 && K.flangeAt_mm(0.05, 1.0) === 3);
  const mR1 = K.bladeMass({ blade: reconBlade(1.0), R: 1.0, stud: 'M8', studLen_m: 0.8 });   // the recon's own stud: 0.8 m of M8 (§2.4)
  const mAll = [[0.58, 'M4', 0.25, 117], [0.68, 'M5', 0.333, 175], [0.89, 'M6', 0.5, 343], [1.42, 'M8', 1.0, 1066], [1.94, 'M10', 1.5, 2327],
    [2.43, 'M12', 2.0, 4098]].map(([R, s, L, w]) => [K.bladeMass({ blade: reconBlade(R), R, stud: s, studLen_m: L }).petg_kg * 1000, w]);
  const mCls = mAll.slice(0, 3);                                // the MVP's classes (interview 001); 1000+ are printed only
  check('blade mass (PETG, the tube along the stud): recon 02 §7.2 R 1.0 m → 455 g ± 2 %; §10 classes 250 / 333 / 500 → 117 / 175 / 343 g ± 4 %',
    rel(mR1.petg_kg * 1000, 455, 0.02) && mCls.every(([g, w]) => rel(g, w, 0.04)), `${(mR1.petg_kg * 1000).toFixed(1)} · ${mCls.map(([g]) => g.toFixed(1)).join(' · ')} g`
    + ` · outside the MVP, not checked: ${mAll.slice(3).map(([g, w]) => `${g.toFixed(0)} vs ${w} (${((g / w - 1) * 100).toFixed(1)} %)`).join(' · ')}`);
  // The tube stops where the stud does (the third judge, F7; the fourth judge: the fix had no case of its own). A section without
  // the tube has none; the default blade's PETG with its 332 mm stud exceeds the one with no stud by exactly the tube's volume
  // from the root block to the stud's end: ρ·A_tube·(0.035 + 0.332 − 0.110) — hand, ± 1 % (the 2 mm stations).
  const noTube = K.bladeSection({ chord_mm: 180, t: 0.18, stud_d_mm: 8, flange_mm: 3, withTube: false });
  const tubeM5 = K.bladeSection({ chord_mm: 180, t: 0.18, stud_d_mm: 5 }).parts.tubeA;
  const dPetg = (K.bladeMass({ blade: pb136, R: R136, stud: 'M5', studLen_m: 0.332 }).petg_kg - K.bladeMass({ blade: pb136, R: R136, stud: 'M5', studLen_m: 0 }).petg_kg) * 1000;
  const dHand = K.PETG_DENSITY_KG_M3 * tubeM5 * 1e-6 * (0.035 + 0.332 - 0.110) * 1000;
  check('the tube only along the stud: no tube without it; the 332 mm stud adds ρ·A_tube·(r_end − r_root) of PETG (hand, ± 1 %)',
    noTube.parts.tubeA === 0 && rel(dPetg, dHand, 0.01), `+${dPetg.toFixed(2)} g (hand ${dHand.toFixed(2)} g, A_tube ${tubeM5.toFixed(2)} mm²)`);
  const m8 = K.bladeMass({ blade: reconBlade(1.0), R: 1.0, stud: 'M8', studLen_m: 0.8 });
  const fc8 = K.slmCentrifugal({ mB_kg: m8.m_kg, Rcog_m: m8.cog_m, omega: 600 * Math.PI / 30 });
  check('blade mass → F_c: recon 02 §2.4 — the R 1.0 m blade + 0.8 m of M8 at 600 rpm → 1.22 kN ± 3 %', rel(fc8, 1220, 0.03), `${fc8.toFixed(0)} N`);
  // The printed blade (the root transition): the recon's root at the root block, the linear blade from 0.4R out, no jump.
  const lin136 = pb136.linear, r1 = 0.4 * R136;
  check('printed blade: chord 0.18R = 122.4 mm and t/c 25 % at the root block (r 110 mm); the linear blade there is 63 mm',
    near(pb136.chord(0.11) * 1000, 122.4, 0.05) && near(pb136.tc(0.11), 0.25, 1e-12) && near(lin136.chord(0.11) * 1000, 63.1, 0.1),
    `${(pb136.chord(0.11) * 1000).toFixed(1)} mm, ${(100 * pb136.tc(0.11)).toFixed(1)} % (linear ${(lin136.chord(0.11) * 1000).toFixed(1)} mm)`);
  check('printed blade: from 0.4R out it IS the linear blade (chord, twist, t/c); continuous at 0.4R; chord never grows outward',
    [r1, 0.5, 0.6, 0.68].every((r) => near(pb136.chord(r), lin136.chord(r), 1e-12) && near(pb136.twist(r), lin136.twist(r), 1e-12)
      && near(pb136.tc(r), pb136.tcLin(r), 1e-12) && near(pb136.tcLin(r), 0.21 + (0.12 - 0.21) * (r - 0.068) / (0.68 - 0.068), 1e-12))
    && near(pb136.chord(r1 - 1e-9), pb136.chord(r1), 1e-9) && near(pb136.tc(r1 - 1e-9), pb136.tc(r1), 1e-9)
    && Array.from({ length: 60 }, (_, i) => 0.11 + i * (0.68 - 0.11) / 59).every((r, i, a) => i === 0 || pb136.chord(r) <= pb136.chord(a[i - 1]) + 1e-12),
    `A_proj ${Ap136.toFixed(4)} m² (linear ${K.bladePlanArea(lin136.chord, 0.068, R136).toFixed(4)})`);

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
  // Thin-walled box 100 × 20 mm, wall 1 mm (by hand): A = 240 mm², I = 2·100·10² + 2·20³/12 = 21 333.3 mm⁴, k = I/(A·10) = 8.889 mm
  const box = K.shellSection([[0, -10], [100, -10], [100, 10], [0, 10]], 1);
  check('shell section, thin box 100 × 20, wall 1: A 240, I 21 333.3, centroid 0, k 8.889 (hand values)',
    near(box.A, 240, 1e-9) && near(box.I, 21333.333, 1e-3) && near(box.yc, 0, 1e-12) && near(box.k, 8.8889, 1e-4),
    `A ${box.A}, I ${box.I.toFixed(1)}, k ${box.k.toFixed(4)}`);
  const shifted = K.shellSection([[0, 5], [100, 5], [100, 25], [0, 25]], 1);
  check('shell section: moving the box does not change I and k (centroidal axis)', near(shifted.I, box.I, 1e-6) && near(shifted.k, box.k, 1e-9) && near(shifted.yc, 15, 1e-12));

  if (log) console.log('S8. structure, second part — section A (researches/02 §0, §2.3, §2.4)');
  check('wall of N lines: T(2) 0.857 · T(3) 1.264 · T(4) 1.671 mm ± 0.001 (researches/02 §0)',
    near(K.wallT_mm(2), 0.857, 1e-3) && near(K.wallT_mm(3), 1.264, 1e-3) && near(K.wallT_mm(4), 1.671, 1e-3),
    [2, 3, 4].map((N) => K.wallT_mm(N).toFixed(4)).join(' · '));
  // Criterion 9 — the root seam of the R 1.0 m blade (researches/02 §2.4): chord 180, t/c 18 %, NACA 44xx, M8 at 0.40c.
  // Tolerances = the largest pairwise spread of three computations (re-derived 2026-11-17 per EXPERIENCE.md EXP-0004) — two
  // methods over one geometry: the thin-walled sum (the recon's own script and this core) and a raster of the material
  // region at 0.05 mm (A 511.1 / 890.5, Ix 63 594 / 127 109, k 6.92 / 8.21 for A1 / A2). Largest pairs: A 1.55 % (core vs
  // raster), Ix 1.02 % (core vs recon), k 2.4 % (recon vs raster) → ± 2 %, ± 2 %, ± 3 % (the judge, finding 1, 2026-11-17).
  // The bands cannot see terms below ~1 % of Ix — those are guarded part by part below.
  const seam = { chord_mm: 180, t: 0.18, stud_d_mm: 8 };
  const A1 = K.bladeSection({ ...seam, flange_mm: 0 }), A2 = K.bladeSection({ ...seam, flange_mm: 3 });
  check('criterion 9: section A1 (shell T(3) + tube + web) — A 518 ± 2 %, Ix 63 560 ± 2 %, k 6.75 ± 3 % (researches/02 §2.4)',
    rel(A1.A, 518, 0.02) && rel(A1.Ix, 63560, 0.02) && rel(A1.k, 6.75, 0.03), `A ${A1.A.toFixed(1)}, Ix ${A1.Ix.toFixed(0)}, k ${A1.k.toFixed(3)}`);
  check('criterion 9: section A2 (+ flanges 3 mm over 0.15–0.50c) — A 894 ± 2 %, Ix 126 000 ± 2 %, k 8.04 ± 3 %',
    rel(A2.A, 894, 0.02) && rel(A2.Ix, 126000, 0.02) && rel(A2.k, 8.04, 0.03), `A ${A2.A.toFixed(1)}, Ix ${A2.Ix.toFixed(0)}, k ${A2.k.toFixed(3)}`);
  // the parts the recon's totals cannot see one by one: the tube (≈ 5 % of A1) and the web (≈ 4 %) by hand
  const tubeHand = Math.PI * ((4 + 0.2 + K.wallT_mm(2)) ** 2 - 4.2 ** 2);
  check('section parts: the tube around M8 = π·((4 + 0.2 + T(2))² − 4.2²) = 24.93 mm² (hand)', near(A1.parts.tubeA, tubeHand, 1e-9) && near(tubeHand, 24.93, 0.01),
    A1.parts.tubeA.toFixed(3));
  const webHand = K.wallT_mm(2) * (2 * K.nacaHalfThickness(0.6, 0.18) * 180 - 2 * K.wallT_mm(3));
  check('section parts: the web at 0.60c = T(2)·(thickness there − 2·T(3)) = 18.95 mm² ± 1 % (hand, 24.64 mm thick)',
    rel(A1.parts.webA, webHand, 0.01) && near(webHand, 18.95, 0.01), `${A1.parts.webA.toFixed(2)} (hand ${webHand.toFixed(2)})`);
  check('section parts add up to A; the flanges appear only in A2', near(A2.parts.shellA + A2.parts.flangeA + A2.parts.tubeA + A2.parts.webA, A2.A, 1e-6)
    && A1.parts.flangeA === 0 && A2.parts.flangeA > 0, `A2 flanges ${A2.parts.flangeA.toFixed(1)} mm²`);
  // A profile thinner than two shells has no room for a web (the clamp at 0 — the fourth judge: nothing reached it): chord 15 mm,
  // t/c 12 % (≈ 1.7 mm thick at 0.60c against 2 × 1.26 mm of shell), no stud there.
  const thin = K.bladeSection({ chord_mm: 15, t: 0.12, stud_d_mm: 5, withTube: false });
  check('a profile thinner than two shells: the web is 0, not negative, and A stays finite and equal to its parts',
    thin.parts.webA === 0 && Number.isFinite(thin.A) && thin.A > 0 && near(thin.parts.shellA + thin.parts.flangeA + thin.parts.webA, thin.A, 1e-9),
    `A ${thin.A.toFixed(1)} mm², web ${thin.parts.webA}`);
  // Terms too small for the ± 2 % band (the judge, finding 3): the tube's and the web's own I and their Steiner terms, by hand
  const ri8 = 4.2, ro8 = 4.2 + K.wallT_mm(2), P = A1.parts;
  const tubeIxHand = Math.PI / 4 * (ro8 ** 4 - ri8 ** 4) + tubeHand * A1.yc ** 2;
  const webIxHand = K.wallT_mm(2) * P.webH ** 3 / 12 + P.webA * (P.webY - A1.yc) ** 2;
  check('section parts: Ix of the tube = π/4·(ro⁴ − ri⁴) + A·yc², of the web = w·h³/12 + A·(y − yc)² (hand); the parts sum to Ix',
    near(P.tubeIx, tubeIxHand, 1e-6) && near(P.webIx, webIxHand, 1e-6) && near(P.shellIx + P.flangeIx + P.tubeIx + P.webIx, A1.Ix, 1e-6),
    `tube ${P.tubeIx.toFixed(1)}, web ${P.webIx.toFixed(1)} of ${A1.Ix.toFixed(0)} mm⁴`);
  // The stud must stand in the chordwise kern, or the preload bends the section by itself (researches/02 §2.3–2.4): at 0.40c
  // the centroid is 3.5 mm off, deep inside ky; at 0.30c it is 21 mm off, outside ky 17.8. (Raster: 3.0 and 20.5 mm.)
  const A2at30 = K.bladeSection({ ...seam, flange_mm: 3, xStud: 0.30 });
  check('stud in the kern at 0.40c: centroid 3.5 ± 0.6 mm toward the edge, |xc| < ky (researches/02 §2.4)',
    near(A2.xc, 3.5, 0.6) && Math.abs(A2.xc) < A2.ky, `xc ${A2.xc.toFixed(2)}, ky ${A2.ky.toFixed(2)}`);
  check('stud OUT of the kern at 0.30c: centroid 21 ± 0.6 mm, ky 17.8 ± 0.6, |xc| > ky — why the stud goes to 0.40c',
    near(A2at30.xc, 21, 0.6) && near(A2at30.ky, 17.8, 0.6) && Math.abs(A2at30.xc) > A2at30.ky, `xc ${A2at30.xc.toFixed(2)}, ky ${A2at30.ky.toFixed(2)}`);
  const F0chain = K.jointPreload_N(30, A2.k, 1220);
  check('criterion 5 through the core\'s own section: F0 = 30 N·m / k(A2) + 1.22 kN → 4.95 kN ± 0.05', near(F0chain / 1000, 4.95, 0.05),
    (F0chain / 1000).toFixed(3));
  // The seam stresses of the recon's table (researches/02 §2.4), at the recon's own preloads (5.7 kN for A1, 4.95 kN for A2):
  // σ_b and σ_max carry k's ± 3 %, σ_p carries A's ± 2 %.
  const s2 = K.jointStress_MPa({ M_Nm: 30, F0_N: 4950, A: A2.A, I: A2.Ix, yMax: A2.yMax });
  check('seam A2 at 30 N·m, F0 4.95 kN: σ_b 4.2, σ_p 5.5 «caution», σ_max 9.7 MPa, the seam stays closed',
    rel(s2.sigmaB, 4.2, 0.03) && rel(s2.sigmaP, 5.5, 0.02) && rel(s2.sigmaMax, 9.7, 0.03) && s2.verdict === 'caution' && !s2.opens,
    `σ_b ${s2.sigmaB.toFixed(2)}, σ_p ${s2.sigmaP.toFixed(2)} ${s2.verdict}, σ_max ${s2.sigmaMax.toFixed(2)}, σ_min ${s2.sigmaMin.toFixed(2)}`);
  const s2u = K.jointStress_MPa({ M_Nm: 60, F0_N: 4950, A: A2.A, I: A2.Ix, yMax: A2.yMax });
  check('seam A2 at the ultimate 60 N·m: the windward side −2.8 ± 0.4 MPa — the seam OPENS (researches/02 §2.4)',
    near(s2u.sigmaMin, -2.8, 0.4) && s2u.opens, `σ_min ${s2u.sigmaMin.toFixed(2)}`);
  const s1 = K.jointStress_MPa({ M_Nm: 30, F0_N: 5700, A: A1.A, I: A1.Ix, yMax: A1.yMax });
  check('seam A1 at 30 N·m, F0 5.7 kN: σ_b 8.6, σ_p 10.9 «too high», σ_max 19.5 MPa — the thin shell alone does not do',
    rel(s1.sigmaB, 8.6, 0.03) && rel(s1.sigmaP, 10.9, 0.02) && rel(s1.sigmaMax, 19.5, 0.03) && s1.verdict === 'too high',
    `σ_b ${s1.sigmaB.toFixed(2)}, σ_p ${s1.sigmaP.toFixed(2)} ${s1.verdict}, σ_max ${s1.sigmaMax.toFixed(2)}`);
  check('a flange as thick as the shell is still counted as a flange, not as shell', (() => {
    const s = K.bladeSection({ ...seam, flange_mm: K.wallT_mm(3) });
    return s.parts.flangeA > 0 && near(s.parts.shellA, A1.parts.shellA, 1e-9);
  })());

  const ab = K.anchorBearing(2600, 12, 40);
  check('tip anchor: 2.6 kN on a 12 × 40 mm plate → 5.42 MPa, «caution» (3–7 MPa, researches/02 §5.2)', near(ab.p, 5.417, 1e-3) && ab.verdict === 'caution', `${ab.p.toFixed(3)} MPa, ${ab.verdict}`);
  check('tip anchor: verdicts on both sides — 1 kN → ok, 4 kN → too high', K.anchorBearing(1000, 12, 40).verdict === 'ok' && K.anchorBearing(4000, 12, 40).verdict === 'too high');
  const cuts = K.sectionCuts(630, 240);
  check('sections: 630 mm span, bed 240 mm → 3 equal sections of 210 mm', cuts.length === 4 && near(cuts[1], 210, 1e-9) && near(cuts[3], 630, 1e-9), cuts.join(' / '));
  check('sections: exactly one bed height fits in one section (240 → 1), one millimetre more needs two', K.sectionCuts(240, 240).length === 2 && K.sectionCuts(241, 240).length === 3);
  // The bed fit (bedFit) by hand on strips: the spot is 210 × 210 (220 minus 5 mm from each edge). A 200 × 10 strip fits
  // straight; a 280 × 10 strip only on the diagonal — (280 + 10)/√2 = 205 ≤ 210; a 300 × 10 strip nowhere — 310/√2 = 219.
  const strip = (L, t) => [[[0, 0], [L, 0], [L, t], [0, t]]];
  const f200 = K.bedFit(strip(200, 10)), f280 = K.bedFit(strip(280, 10)), f300 = K.bedFit(strip(300, 10));
  check('bed fit by hand: 200 × 10 straight · 280 × 10 only on the diagonal (≈ 45°) · 300 × 10 does not fit the 210 × 210 spot',
    f200.fits && f280.fits && Math.abs(f280.angle_deg % 90 - 45) < 3 && !f300.fits, `280: ${f280.angle_deg}°, ${f280.w_mm.toFixed(1)} × ${f280.h_mm.toFixed(1)}`);
  // The union decides (the third judge, F1): two 200 × 10 strips 205 mm apart — each alone fits, together 200 × 215 do not.
  const pair = [strip(200, 10)[0], strip(200, 10)[0].map(([x, y]) => [x, y + 205])];
  check('bed fit: the footprint is the UNION of the outlines — two strips that fit alone, 205 mm apart (215 mm together), do not fit',
    K.bedFit([pair[0]]).fits && K.bedFit([pair[1]]).fits && !K.bedFit(pair).fits);
  // The default blade's first section (rotor 1.36 m): the printed span 110 … 680 mm in three sections of 190 mm; its outlines
  // at the bottom, the middle and the top, each at its own chord, t/c and twist, together — the footprint fits the bed.
  const span136 = K.sectionCuts((0.68 - 0.11) * 1000, 240), rTop = 0.11 + span136[1] / 1000;
  const outl = [0.11, (0.11 + rTop) / 2, rTop].map((r) => K.airfoilSection({ chord_mm: pb136.chord(r) * 1000, t: pb136.tc(r), twist_rad: pb136.twist(r), n: 40 }));
  const fit136 = K.bedFit(outl);
  check('the default blade\'s first section (r 110 … 300 mm, chord 122 → 51 mm, twisted) stands on the 220 × 220 bed',
    span136.length === 4 && fit136.fits, `${span136.length - 1} sections · ${fit136.w_mm.toFixed(0)} × ${fit136.h_mm.toFixed(0)} mm at ${fit136.angle_deg}°`);

  return { bad, total, failed };
}

// The addressees of the mutants (the core judge of session 1, F1): which cases each mutant must turn red. Captured once into
// kalculator/control-golden.json AFTER two clean judges had checked every addressee by hand (2026-11-17), then guarded: a
// mutant whose expected case no longer goes red is an ADDRESSEE DRIFT — the check it was born for stopped seeing it, even if
// some other case still catches the mutant. `--control --write-golden` re-captures (only with a reason in the commit).
// @guard control-addressees
// THREAT:         a test edit leaves a mutant red only through an unrelated case — the criterion it guards quietly blind
// PROVED-AGAINST: the golden's addressee of the root-chord mutant renamed by hand → the run prints ADDRESSEE DRIFT, exit 1;
//                 the fourth judge (2026-11-17), on copies: an edited mutant, an extra golden key, a deleted mutant → exit 1;
//                 the mass case renamed with ± 50 % bands (106/106 stays green) → drift 8, exit 1, and `--write-golden` prints
//                 7 NET LOSS lines; the old golden re-captured → exactly one NET LOSS (the tube-radius mutant)
// GAP:            a mutant that gains NEW red cases is not flagged (only lost ones are); the golden is the judges' state;
//                 a mutant edited or added, or a golden key without its mutant, fails the run until `--write-golden`;
//                 `--write-golden` prints every lost / gained addressee and counts the NET LOSSES — it never refuses one
//                 (a loss can be legitimate physics), the commit must name each; a loss balanced by an unrelated gain
//                 counts as «change», not a net loss — the printed lost / gained names are the review, not the count
// ON-REAL-PATH:   NOT YET (no page; the core's own control run)
const GOLDEN = new URL('./control-golden.json', import.meta.url);
if (!CONTROL) {
  const { bad, total } = run(load(core));
  console.log(`-- ${total - bad} of ${total} as expected`);
  process.exit(bad ? 1 : 0);
} else {
  const write = process.argv.includes('--write-golden');
  let golden = {};
  try { golden = JSON.parse(readFileSync(GOLDEN, 'utf8')); } catch { /* no golden yet */ }
  const out = {};
  let missed = 0, drift = 0;
  for (const [from, to] of MUTANTS) {
    const key = `${from} → ${to}`;
    if (!core.includes(from)) { console.log(`MUTANT NOT APPLIED — "${from}" is not in the core`); missed++; continue; }
    const { bad, failed } = run(load(core.replace(from, to)), false);
    out[key] = [...failed].sort();
    const lost = (golden[key] || []).filter((name) => !failed.includes(name));
    console.log(`${bad > 0 ? 'red ' : 'GREEN?!'} mutant "${from}" → "${to}": ${bad} case(s) failed${lost.length ? ` · ADDRESSEE DRIFT, no longer red: ${lost.join(' | ')}` : ''}`);
    if (bad === 0) missed++;
    if (lost.length) drift++;
  }
  const unknown = write ? 0 : MUTANTS.filter(([f, t]) => !golden[`${f} → ${t}`]).length;
  const orphans = write ? [] : Object.keys(golden).filter((k) => !MUTANTS.some(([f, t]) => `${f} → ${t}` === k));
  if (orphans.length) console.log(`ORPHANED golden keys (no such mutant): ${orphans.join(' | ')}`);
  // The re-capture prints its own diff against the golden it replaces: a renamed case shows as one lost + one gained name; a
  // mutant with more lost than gained stopped reddening a case under ANY name — a NET LOSS to justify in the commit (the
  // 2026-11-17 re-capture: a filter by names called the tube-radius mutant's three lost cases «renamed» — EXP-0009).
  let netLoss = 0;
  if (write) {
    for (const key of Object.keys(out)) {
      const was = golden[key] || [], now = out[key];
      const lost = was.filter((x) => !now.includes(x)), gained = now.filter((x) => !was.includes(x));
      if (lost.length > gained.length) netLoss++;
      if (lost.length || gained.length) console.log(`GOLDEN ${lost.length > gained.length ? 'NET LOSS' : 'change'} "${key}": lost ${lost.length}`
        + ` · gained ${gained.length}${lost.length ? ` · lost: ${lost.join(' | ')}` : ''}${gained.length ? ` · gained: ${gained.join(' | ')}` : ''}`);
    }
    for (const key of Object.keys(golden)) if (!(key in out)) console.log(`GOLDEN dropped key (its mutant is gone): "${key}"`);
    writeFileSync(GOLDEN, JSON.stringify(out, Object.keys(out).sort(), 2) + '\n');
  }
  console.log(`-- control: ${MUTANTS.length - missed} of ${MUTANTS.length} mutants seen red · addressee drift ${drift}` +
    (write ? ` · golden written · net losses ${netLoss}` : ` · mutants not in the golden ${unknown} · orphaned keys ${orphans.length}`));
  process.exit(missed || drift || unknown || orphans.length ? 1 : 0);   // an edited mutant escapes nothing (the third judge, F3)
}
