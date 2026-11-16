# Bug 01 — recon 01's thrust checkpoint (Ct 0.84) disagrees with recon 01's own thrust definition (0.878)

**Status:** ✅ DONE 2026-11-16 — the checkpoint corrected to 0.878 where it stood (see the closing section)
**Severity:** S2 (a run lost: criterion 3 of plan 02 went red on Ct) · **Version/build:** kalculator core at plan 02 S5 ·
**When/context:** 2026-11-16, the autonomous stretch the owner ordered at 21:40 («работай автономно 30 минут»), implementing S5 (BEM)
**Fixing:** next session, before S6 — or when an independent reference arrives

## Symptom

Plan 02 criterion 3 (from `researches/01` Appendix A): BEM on the Schmitz blade, λ 6, C_l 1, no drag, hub 0.1R →
Cp 0.518, Ct 0.84. The core gives **Cp 0.5172** (passes ±0.005) and **Ct 0.8777** (fails ±0.01).

## Repro

`node .work/tmp/ct-diag.mjs` (scratch, not committed) or the S5 block of `node kalculator/test.mjs`, which prints both:
`momentum 0.8352 · blade-element 0.8777`.

## Forensics

- Blade-element thrust T = B∫N′dr, N′ = c_n·½ρW²c — the definition `researches/01` §1.5 gives (CCBlade) → Ct 0.8777.
- Momentum thrust with tip/hub loss, ∫4πr·a(1−a)F dr → Ct 0.8351 (≈ the checkpoint 0.84); without F → 0.9050.
- Induction: mean a 0.382, max a 0.905 — near the tip and the hub the stations sit in Buhl's high-induction branch, where
  4aF(1−a) is no longer the annulus thrust (that is the reason Buhl's correction exists — `researches/01` §1.5).
- Cp is the same by either route (0.517), so the torque side is consistent.

## Root cause / Hypotheses

1. **Most likely:** the recon's script computed Ct by the momentum route 4aF(1−a) while its document defines thrust by
   blade-element loads; in the Buhl region the two differ. Then 0.878 is the correct value of the documented method.
2. Less likely: a defect in the core's Buhl branch that inflates c_n-side thrust only — but Cp agrees, and the Buhl
   formulas are verbatim from the recon (which checked them algebraically against Buhl's C_T relation).

## Fix plan

Find an independent reference for Ct of a Schmitz/Betz-optimal rotor with Prandtl losses at λ 6 (CCBlade's example
output, Burton's or Manwell's worked example, or QBlade); then set criterion 3's Ct target from THAT source, with the
justification in the commit. Until then the test checks the momentum route against 0.84 and prints the blade-element Ct.

## Decisions made without the owner

- [AI] The failing Ct assertion was replaced by (a) a check of the momentum route against the recon's 0.84 and (b) a printed,
  unjudged blade-element Ct — not by moving the target to 0.878, because 0.878 has no independent source yet.

## ✅ STATUS: DONE (2026-11-16, the same autonomous stretch)

- **The third route settled it** (`.work/tmp/ct-buhl.mjs`, scratch): momentum thrust with Buhl's empirical C_T in the
  stations where a > 0.4 (87 of 400) gives **Ct 0.8778 — equal to the blade-element 0.8778**. So recon 01 §1.5's own method
  is self-consistent at 0.878, and the checkpoint 0.84 was the plain 4aF(1−a) used outside its range. Hypothesis 1 confirmed.
- **Fix:** criterion 3's Ct target is 0.878 ± 0.01 (plan 02); recon 01 Appendix A corrected where it stands, with the
  reason; the test also GUARDS the agreement of the two valid routes (± 0.002) and prints the invalid plain route.
- **Guard** (`kalculator/test.mjs`, the S5 block): THREAT — a thrust checkpoint taken from a formula outside its range ·
  PROVED-AGAINST — the induction mutant (`--control`, red on both Ct cases); the tip-loss mutant reddens Cp and F but NOT
  the Ct cases (corrected after the core judge, finding F1) · GAP — at a converged solution the two routes are one equation, so their agreement proves convergence, not the value
  (core judge, J3); no external reference (CCBlade, QBlade)
  was run; the agreement is between two routes of the same documented method · ON-REAL-PATH — NOT YET (no page).
- Hygiene: `node kalculator/test.mjs` 47 of 47, `--control` 15 of 15. Functional run: NONE (the page does not exist yet).
- **Decisions made without the owner** (updated): [AI] the target moved 0.84 → 0.878 on the strength of the recon's own
  documented method, checked by two routes — not on an external reference; the GAP line says so.
- **TWINS:** searched `0,84|0\.84` in researches, plans, kalculator, STATUS, bugs — the only checkpoint copies were recon 01
  Appendix A, plan 02 criterion 3 and the test; all three corrected.

## Links

`plans/02_epic01_phase1_core.md` (criterion 3, S5) · `researches/01_hawt_aero_generator_loads/README.md` §1.5, Appendix A
