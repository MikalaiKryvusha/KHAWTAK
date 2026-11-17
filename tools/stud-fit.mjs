// stud-fit.mjs — where along the printed blade the stud's tube and its tip anchor fit inside the profile (plan 03, risk «the tip
// anchor does not fit where the 333 mm stud ends»). Kept in the repository because a plan and an interview quote its numbers
// (EXPERIENCE.md EXP-0006, EXP-0008). Reads the core from kalculator/index.html; writes nothing.
//
//   node tools/stud-fit.mjs [R_m] [stud] [lambda] [Cl]   # default: the default blade — R 0.68 m (rotor 1.36 m), M5, λ 6, Cl 1.2
//
// Then a table over the design λ 4 … 6 (the same R, stud and Cl): how far the tip nut fits, the stud that reaches it, and the
// blade's PETG mass (bladeMass, the tube along that stud) — what a wider, slower blade buys for the stud.
//
// The profile thickness is taken at the stud axis, 0.40c (researches/02 §4.5); the needs: the tube — d + 2·(gap + T(2)) as
// bladeSection builds it; the tip nut — the hex corner + 2·T(3) + 2 × 0.5 mm (researches/02 §4.5: M4 11.6 · M5 12.8 · M6 15.1 ·
// M8 18.5 mm). [NOT-TESTED] — an instrument; its formulas are the core's own.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../kalculator/index.html', import.meta.url), 'utf8');
let core = html.split('// ===== CORE-BEGIN')[1].split('// ===== CORE-END')[0];
core = core.slice(core.indexOf('\n'));
const ctx = {}; vm.createContext(ctx); vm.runInContext(core + '\nglobalThis.KHAWTAK = KHAWTAK;', ctx);
const K = ctx.KHAWTAK;

const NUT_NEED_MM = { M4: 11.6, M5: 12.8, M6: 15.1, M8: 18.5 };   // researches/02 §4.5 [РАСЧЁТ]
const ROOT_NUT_R_M = 0.035;                                      // the stud starts at its root nut (researches/02 §0; bladeMass)
const R = Number(process.argv[2] || 0.68), stud = process.argv[3] || 'M5', d = K.STUDS[stud].d;
const LAMBDA = Number(process.argv[4] || 6), CL = Number(process.argv[5] || 1.2);   // the «default seam» inputs of test.mjs
const bladeAt = (lambda) => K.printedBlade({ R, Cl: CL, lambda, alphaD_rad: 6 * Math.PI / 180 });
const blade = bladeAt(LAMBDA);
const tubeOd = d + 2 * (K.SECTION_A.gap_mm + K.wallT_mm(K.SECTION_A.tubeLines));
const thickOf = (b) => (r) => 2 * K.nacaHalfThickness(0.40, b.tc(r)) * b.chord(r) * 1000, thick = thickOf(blade);
const reachOf = (th) => (need) => { let lo = K.ROOT_DEFAULT.r0_m, hi = R; if (th(lo) < need) return null;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (th(mid) >= need) lo = mid; else hi = mid; } return lo; };
const reach = reachOf(thick);

console.log(`printed blade R ${R} m, λ ${LAMBDA}, Cl ${CL}, stud ${stud}: tube Ø ${tubeOd.toFixed(2)} mm, tip nut needs ${NUT_NEED_MM[stud] ?? '—'} mm of profile`);
console.log('   r mm | chord mm |  t/c  | thick at 0.40c mm');
for (let r = K.ROOT_DEFAULT.r0_m; r <= R + 1e-9; r += (R - K.ROOT_DEFAULT.r0_m) / 12) {
  console.log(`${(r * 1000).toFixed(0).padStart(7)} | ${(blade.chord(r) * 1000).toFixed(1).padStart(8)} | ${blade.tc(r).toFixed(3)} | ${thick(r).toFixed(2).padStart(6)}`);
}
for (const [what, need] of [['the tube', tubeOd], [`the ${stud} tip nut`, NUT_NEED_MM[stud]]]) {
  if (!need) continue;
  const r = reach(need);
  console.log(r === null ? `${what}: does not fit even at the root block`
    : `${what} fits up to r ${(r * 1000).toFixed(0)} mm (r/R ${(r / R).toFixed(3)}) — a stud from the root nut reaching it: ${((r - ROOT_NUT_R_M) * 1000).toFixed(0)} mm`);
}

// The owner's 333 mm stud (332 after the saw cut — HOUSE_RULES.md product knowledge) from the root nut: where it ends, this
// blade against recon 02 §0's planform (c/R 0.18 → 0.10 at 0.7R → 0.05; t/c 18 → 12 %), on which recon 02 §10 sized class 333.
{
  const rEnd = ROOT_NUT_R_M + 0.332, x = rEnd / R;
  const cRecon = R * (x <= 0.15 ? 0.18 : x <= 0.7 ? 0.18 - 0.08 * (x - 0.15) / 0.55 : 0.10 - 0.05 * (x - 0.7) / 0.3), tcRecon = 0.18 - 0.06 * x;
  console.log(`the 333 mm stud ends at r ${(rEnd * 1000).toFixed(0)} mm: this blade — chord ${(blade.chord(rEnd) * 1000).toFixed(1)} mm, ${thick(rEnd).toFixed(2)} mm thick;`
    + ` recon 02 §0's planform — chord ${(cRecon * 1000).toFixed(1)} mm, ${(2 * K.nacaHalfThickness(0.40, tcRecon) * cRecon * 1000).toFixed(2)} mm thick`);
}

// The design λ against the stud: a lower λ gives a wider blade (Schmitz chord), so the tip nut fits farther out.
if (NUT_NEED_MM[stud]) {
  console.log('');
  console.log(` design λ | chord at r 367 mm | thick there | ${stud} nut fits to r | stud reaching it | blade PETG (tube along it)`
    + ' | the root seam (the «default seam» chain of test.mjs, grade 4.8)');
  const IV = K.IEC_SWT_CLASS.IV, r0 = K.ROOT_DEFAULT.r0_m;
  for (const lambda of [4, 4.5, 5, 5.5, 6]) {
    const b = bladeAt(lambda), th = thickOf(b), r = reachOf(th)(NUT_NEED_MM[stud]);
    const L = r === null ? 0 : r - ROOT_NUT_R_M, m = K.bladeMass({ blade: b, R, stud, studLen_m: L });
    // the seam at the root block: F_c at case D's ω for THIS λ, the parked moment of THIS blade's plan area, the max thrust
    const Fc = K.slmCentrifugal({ mB_kg: m.m_kg, Rcog_m: m.cog_m, omega: lambda * K.SLM.VHUB_PER_VAVE_D * IV.vAve / R });
    const sec = K.bladeSection({ chord_mm: b.chord(r0) * 1000, t: b.tc(r0), stud_d_mm: d, flange_mm: K.flangeAt_mm(r0, R) });
    const MH = K.slmParked({ R, rho: 1.225, vRef: IV.vRef, Aproj: K.bladePlanArea(b.chord, 0.1 * R, R) }).MyB_Nm;
    const s = K.seamCheck({ section: sec, grade: '4.8', Fc_D_N: Fc, MyB_H_Nm: MH, MyB_D_Nm: K.slmMaxThrust({ R, rho: 1.225, vAve: IV.vAve }).MyB_Nm });
    console.log(`${String(lambda).padStart(9)} | ${(b.chord(0.367) * 1000).toFixed(1).padStart(17)} | ${th(0.367).toFixed(2).padStart(11)} | `
      + `${r === null ? '—' : (r * 1000).toFixed(0).padStart(5) + ' mm'} | ${(L * 1000).toFixed(0).padStart(13)} mm | ${(m.petg_kg * 1000).toFixed(0)} g`
      + ` | storm ${MH.toFixed(1)} N·m, F_c ${Fc.toFixed(0)} N → F0 ${(s.F0_N / 1000).toFixed(2)} kN, ${s.stud ?? 'no stud'} 4.8, σ_p ${s.sigmaP.toFixed(2)} MPa «${s.verdict}»`);
  }
}
