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
