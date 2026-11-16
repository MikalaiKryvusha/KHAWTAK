# Plan 02 — epic 01, phase 1: the calculation core (site, blade aerodynamics, loads, stud and preload)

> **Создан:** 2026-11-16 (main agent, the autonomous stretch the owner ordered at 21:40) · **Родитель:**
> `plans/01_EPIC_mvp_blade.md` → phase table, row «1 · ядро расчёта» · **Статус:** 🔧 S1–S2 done 2026-11-16 (criteria 1 and 7
> green); S3 nearly done, S4–S5 done (criteria 1, 2, 3, 4, 7 green); next — S6 (performance) · **Вовне:** one question to the
> owner at step S7 (load factors: IEC or the hobby margin)

## Goal vector

**Achieve:** a DOM-free core inside `kalculator/index.html` (between `CORE-BEGIN` / `CORE-END`) that turns the site, the
rotor diameter and the user's stud grade into the blade geometry, the power curve and yearly energy, the loads, the
smallest stud and its preload — every number traceable to `researches/01–04`. **Avoid:** an unsourced constant; a check
that cannot fail.

## Acceptance criteria (each a check `node kalculator/test.mjs` prints)

1. ρ(220 m, 7 °C) = 1.2275 kg/m³ ± 0.0005 — `researches/01` Appendix A.
2. Schmitz chord at R 0.45 m, λ 4, B 3, C_l 1.26, r 0.045 m = 89.4 mm ± 0.2, θ = 39.47° ± 0.05 — `researches/01` Appendix A.
3. BEM on the Schmitz blade, λ 6, C_l 1, L/D ∞, hub 0.1 R: Cp = 0.518 ± 0.005, Ct = 0.878 ± 0.01 — `researches/01`
   Appendix A, Ct corrected 2026-11-16 (`bugs/01_DONE_ct_checkpoint_mismatch.md`: the first value 0.84 used 4aF(1−a) in
   Buhl's region; blade-element loads and momentum-with-Buhl both give 0.878, and their agreement is guarded).
4. Minimum chord housing an M8 with two 2 mm walls at t/c 12 % = 100 mm ± 1 — `researches/01` §2.3.
5. Preload example A2: F₀ = 4.95 kN ± 0.05, wrench torque M8 = 7.9 N·m ± 0.1 — `researches/02` §2.4.
6. Stud choice for 2.6 kN at margin ≥ 1.5: grade 4.8 → M5, grade 8.8 → M4, A2-70 → M4 — main agent's check over
   `researches/02` §10 with ISO 898-1 / ISO 3506 (STATUS, 2026-11-16).
7. Brest region site, 1.4 m rotor, two log profiles (z0 0.25, k 1.8, ρ 1.2345): hub 2.39 / 2.64 / 2.77 m/s ± 0.01 and
   50 / 72 / 85 kWh ± 1 % at masts 7 / 10 / 12 m — `researches/03` §3.2, §4.2, re-computed by the core 2026-11-16.
8. Control case (gate 5): each of 1–7 is seen RED once on a deliberately broken constant before it is trusted.

## Steps

Each step quotes its anchor in the epic: «ядро расчёта … место и сдвиг ветра; БЭМ …; лопасть Шмитца …; профили …; кривая
мощности и выработка; нагрузки IEC 61400-2 …; затяжка `F₀ ≥ M/k + F_c`, выбор самой тонкой шпильки …».

- [x] **S1 · skeleton.** ✅ `node kalculator/test.mjs` runs (2026-11-16). `kalculator/index.html` with the empty core markers and `kalculator/test.mjs` that cuts the core out
  and runs it in Node — the KATAK pattern (`researches/04` §1). Check: `node kalculator/test.mjs` exits 0 with «0 of 0».
- [x] **S2 · air and wind.** ✅ criterion 1 green, 14 of 14 with the Γ / shear / Weibull identities; `--control` 4 of 4
  mutants red (2026-11-16). Recon 03 landed: criterion 7 green, 20 of 20, `--control` 6 of 6.
  `FORK: options <one log profile from the station's 10 m (recon 01) | two profiles joined at a 60 m blending height> ·
  price of error <the wrong mast spot: with one profile, trees come out windier than fields above 10 m> · consulted
  <researches/03 §3.2 (h_b 40–100 m moves the speed ±3 %)>` → two profiles, `shearTwoLayer`. ρ from altitude and temperature, log and power shear, Weibull/Rayleigh, the energy integral
  (`researches/01` §5.1). Criterion 1; criterion 7 when recon 03 lands.
- [ ] 🔧 **S3 · airfoil.** Done 2026-11-16: NACA half-thickness and the 44xx mean line, the smallest chord for a stud
  (criterion 4 green: 100 mm at max thickness, 103.4 mm at 0.40c), the printable trailing-edge cut; 31 of 31, `--control`
  8 of 8 (the mean-line mutant first SURVIVED — the forward branch had no interior case; one was added). Then the
  section polygon `airfoilSection` (cosine spacing, thickness normal to the mean line, the flat cut edge, origin at the
  stud axis, the twist about it): 37 of 37, `--control` 10 of 10. Left: t/c(r) and chord/twist along the span (they
  come with S4). The step as planned: NACA 4-digit camber + thickness by formula (`researches/04` §2.1), t/c(r) linear root → tip, cosine
  spacing, printable trailing edge ≥ 2 lines, the stud axis at 0.40c. Criterion 4.
  `FORK: options <analytic polar: linear C_l(α) to stall + constant C_d from the design L/D | embedded polar tables per Re> ·
  price of error <Cp off by a few % at Re < 100 k> · consulted <researches/01 §1.6–1.7, §3.3 (linearised blades measured
  better than "exact" ones)>` — start with the analytic polar; tables only if the owner asks for SG604x (licence open,
  `researches/01` §2.2).
- [x] **S4 · blade design.** ✅ 2026-11-16: `schmitzChord` / `schmitzPhi` / `schmitzTwist`, `linearBlade` (Burton, 0.7R and
  0.9R); criterion 2 green (89.36 mm, 39.466°); the Betz-limit case first used λμ 4 and went red — a wrong premise (Betz
  needs λμ ≫ 1: 4.2 % apart at 4, 0.7 % at 10), rewritten at λ 10; 42 of 42, `--control` 13 of 13. Schmitz chord and twist (`researches/01` §1.3) and their linearisation (§3.3). Criterion 2.
- [x] **S5 · BEM.** ✅ 2026-11-16: `prandtlF`, `bemStation` (bisection on (0, π/2]),
  `bemRotor`; criterion 3 green (Cp 0.5172, Ct 0.8777 after bugs/01); 47 of 47, `--control` 15 of 15. The step as planned: Ning's single-unknown φ iteration with Prandtl tip/hub loss and Buhl's high-induction correction,
  verbatim from `researches/01` §1.4–1.5. Criterion 3.
- [ ] **S6 · performance.** P(V) assuming the owner's smart controller holds λ near optimum up to rated (interview 001 Q5;
  the generator itself is out of the MVP); cut-in, rated, yearly energy; v_tip warning above 60–70 m/s (§6.4).
- [ ] **S7 · loads.** IEC 61400-2 SLM cases that load the blade: A fatigue, D thrust, E max rpm (centrifugal), H parked
  (`researches/01` §6.1). Owner question before closing the step, filed in `interviews/`: strict IEC factors (no PETG root
  passes, §6.2) or a stated hobby margin.
- [ ] **S8 · structure.** Thin-walled section properties (shell T(3), flanges, stud tube, web — `researches/02` §0), kern
  distance k, `F₀ ≥ M/k + F_c` (§2.3), torque `T = K·F·d` (§5.1), the smallest stud M3–M14 for the grade 4.8 · 8.8 · A2-70,
  bearing pressure of the tip anchor plate (§5.2). Criteria 5, 6.
- [ ] **S9 · control cases and markers.** Break each constant once, watch its criterion go red, restore; every core block
  carries `[NOT-TESTED]` until its criterion is green, then `[TESTED: date · criterion N]`; a run report in
  `testcases/reports/`. Criterion 8.

## Risks

- Polars below Re 100 k are poorly known (`researches/01` §1.7): the core warns, it does not pretend.
- Recon 03 may move the default site numbers: criterion 7 is added then, not guessed now.
- The core grows inside one HTML file (KATAK's pattern): keep the core's functions small and named by the step they serve.
